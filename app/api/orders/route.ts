import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { cookieName, verifyAdminSession } from "@/lib/auth";

async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  return !!token && (await verifyAdminSession(token));
}

export async function GET() {
  // Only authenticated admins can view orders
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            food: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);

    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Public checkout: customers can still create orders
  try {
    const body = await request.json();

    const {
      customerName,
      customerPhone,
      customerAddress,
      items,
    } = body;

    if (
      typeof customerName !== "string" ||
      !customerName.trim() ||
      typeof customerPhone !== "string" ||
      !customerPhone.trim() ||
      typeof customerAddress !== "string" ||
      !customerAddress.trim() ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: "Please provide valid customer details and order items." },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (
        typeof item.foodId !== "string" ||
        !item.foodId.trim() ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 100
      ) {
        return NextResponse.json(
          { error: "Each item must have a valid foodId and quantity." },
          { status: 400 }
        );
      }
    }

    const quantities = new Map<string, number>();

    for (const item of items) {
      quantities.set(
        item.foodId,
        (quantities.get(item.foodId) ?? 0) + item.quantity
      );
    }

    if ([...quantities.values()].some((quantity) => quantity > 100)) {
      return NextResponse.json(
        { error: "Maximum quantity per food item is 100." },
        { status: 400 }
      );
    }

    const order = await prisma.$transaction(async (tx) => {
      const foodIds = [...quantities.keys()];

      const foods = await tx.food.findMany({
        where: {
          id: { in: foodIds },
          available: true,
        },
      });

      if (foods.length !== foodIds.length) {
        throw new Error("INVALID_FOOD");
      }

      const foodMap = new Map(foods.map((food) => [food.id, food]));

      const orderItems = [...quantities.entries()].map(
        ([foodId, quantity]) => {
          const food = foodMap.get(foodId)!;

          return {
            foodId,
            quantity,
            price: food.price,
          };
        }
      );

      const total = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      return tx.order.create({
        data: {
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim(),
          total,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              food: true,
            },
          },
        },
      });
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_FOOD") {
      return NextResponse.json(
        { error: "One or more foods do not exist or are unavailable." },
        { status: 400 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    console.error("Failed to create order:", error);

    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}