
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  cookieName,
  verifyAdminSession,
} from "@/lib/auth";
import FoodsManagementClient from "./FoodsManagementClient";

export const instant = false;

export default async function AdminFoodsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token || !(await verifyAdminSession(token))) {
    redirect("/admin/login");
  }

  return <FoodsManagementClient />;
}
