
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  cookieName,
  verifyAdminSession,
} from "@/lib/auth";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token || !(await verifyAdminSession(token))) {
    redirect("/admin/login");
  }

  return <AdminDashboardClient />;
}
