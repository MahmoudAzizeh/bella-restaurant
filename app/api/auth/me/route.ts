
import { NextResponse, connection } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { cookieName, verifySession } from "@/lib/auth";

export async function GET() {
  await connection();

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const session = await verifySession(token);

    if (!session) {
      return NextResponse.json(
        { message: "Invalid session" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Auth me error:", error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
