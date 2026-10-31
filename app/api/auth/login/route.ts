
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminSession, cookieName } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: "Admin login is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();

    if (
      typeof body.password !== "string" ||
      body.password !== adminPassword
    ) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }

    const token = await createAdminSession();
    const cookieStore = await cookies();

    cookieStore.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 2,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      { error: "Unable to log in" },
      { status: 500 }
    );
  }
}
