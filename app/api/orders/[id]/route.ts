
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { cookieName, verifyAdminSession } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function isAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token) return false;

  return Boolean(await verifyAdminSession(token));
}

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const data: {
      name?: string;
      description?: string | null;
      price?: number;
      imageUrl?: string | null;
      category?: string;
      available?: boolean;
    } = {};

    if (body.name !== undefined) {
      if (
        typeof body.name !== "string" ||
        !body.name.trim() ||
        body.name.trim().length > 150
      ) {
        return NextResponse.json(
          { error: "Invalid food name" },
          { status: 400 }
        );
      }

      data.name = body.name.trim();
    }

    if (body.price !== undefined) {
      const price = Number(body.price);

      if (!Number.isFinite(price) || price <= 0 || price > 100000) {
        return NextResponse.json(
          { error: "Invalid price" },
          { status: 400 }
        );
      }

      data.price = price;
    }

    if (body.category !== undefined) {
      if (
        typeof body.category !== "string" ||
        !body.category.trim()
      ) {
        return NextResponse.json(
          { error: "Invalid category" },
          { status: 400 }
        );
      }

      data.category = body.category.trim();
    }

    if (body.description !== undefined) {
      if (
        body.description !== null &&
        typeof body.description !== "string"
      ) {
        return NextResponse.json(
          { error: "Invalid description" },
          { status: 400 }
        );
      }

      data.description =
        typeof body.description === "string" &&
        body.description.trim()
          ? body.description.trim()
          : null;
    }

    if (body.imageUrl !== undefined) {
      if (
        body.imageUrl !== null &&
        typeof body.imageUrl !== "string"
      ) {
        return NextResponse.json(
          { error: "Invalid image URL" },
          { status: 400 }
        );
      }

      data.imageUrl =
        typeof body.imageUrl === "string" && body.imageUrl.trim()
          ? body.imageUrl.trim()
          : null;
    }

    if (body.available !== undefined) {
      if (typeof body.available !== "boolean") {
        return NextResponse.json(
          { error: "Invalid availability value" },
          { status: 400 }
        );
      }

      data.available = body.available;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided" },
        { status: 400 }
      );
    }

    const food = await prisma.food.update({
      where: { id },
      data,
    });

    return NextResponse.json(food);
  } catch (error) {
    console.error("Update food error:", error);

    return NextResponse.json(
      { error: "Failed to update food. Check the food ID." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const food = await prisma.food.update({
      where: { id },
      data: { available: false },
    });

    return NextResponse.json(food);
  } catch (error) {
    console.error("Hide food error:", error);

    return NextResponse.json(
      { error: "Failed to hide food. Check the food ID." },
      { status: 500 }
    );
  }
}
