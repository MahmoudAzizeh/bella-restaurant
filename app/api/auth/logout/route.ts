
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cookieName } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({
    success: true,
    message: "Logout successful",
  });
}
