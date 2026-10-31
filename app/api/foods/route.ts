
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { cookieName, verifyAdminSession } from "@/lib/auth";

// Check if the user is an authenticated admin
async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  return !!token && (await verifyAdminSession(token));
}

// GET: Get all available foods (public)
export async function GET() {
  try {
    const foods = await prisma.food.findMany({
      where: {
        available: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(foods);
  } catch (error) {
    console.error("Failed to fetch foods:", error);

    return NextResponse.json(
      { error: "Failed to fetch foods" },
      { status: 500 }
    );
  }
}

// POST: Create a new food (admin only)
export async function POST(request: Request) {
  try {
    // 1. Protect the endpoint
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: "Unauthorized. Admin login required." },
        { status: 401 }
      );
    }

    // 2. Read the request body
    const body = await request.json();

    const { name, description, price, imageUrl, category } = body;

    // 3. Validate required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 150 ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price <= 0 ||
      price > 100000
    ) {
      return NextResponse.json(
        {
          error: "Provide a valid name and a price greater than 0.",
        },
        { status: 400 }
      );
    }

    // 4. Validate optional fields
    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return NextResponse.json(
        { error: "Description must be text." },
        { status: 400 }
      );
    }

    if (
      imageUrl !== undefined &&
      imageUrl !== null &&
      typeof imageUrl !== "string"
    ) {
      return NextResponse.json(
        { error: "Image URL must be text." },
        { status: 400 }
      );
    }

    if (
      category !== undefined &&
      category !== null &&
      typeof category !== "string"
    ) {
      return NextResponse.json(
        { error: "Category must be text." },
        { status: 400 }
      );
    }

    // 5. Create the food in PostgreSQL
    const food = await prisma.food.create({
      data: {
        name: name.trim(),

        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,

        price,

        imageUrl:
          typeof imageUrl === "string" && imageUrl.trim()
            ? imageUrl.trim()
            : null,

        category:
          typeof category === "string" && category.trim()
            ? category.trim()
            : "Main",

        available: true,
      },
    });

    return NextResponse.json(food, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    console.error("Failed to create food:", error);

    return NextResponse.json(
      { error: "Failed to create food" },
      { status: 500 }
    );
  }
}
