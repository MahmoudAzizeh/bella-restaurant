
import { SignJWT, jwtVerify } from "jose";

export const cookieName = "bella_session";

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("AUTH_SECRET is missing from .env");
}

const secretKey = new TextEncoder().encode(secret);

export type UserRole = "CUSTOMER" | "ADMIN";

export type SessionPayload = {
  userId: string;
  role: UserRole;
};

export async function createSession(user: {
  id: string;
  role: UserRole;
}) {
  return new SignJWT({
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      (payload.role !== "CUSTOMER" && payload.role !== "ADMIN")
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function verifyAdminSession(
  token: string
): Promise<boolean> {
  const session = await verifySession(token);

  return session?.role === "ADMIN";
}
