"use server";

import { redirect } from "next/navigation";
import {
  authenticateDashboardUser,
  clearDashboardSession,
  isDashboardAuthEnabled,
  setDashboardSession,
} from "../../lib/dashboard-auth";

export async function loginDashboard(formData: FormData) {
  if (!isDashboardAuthEnabled()) {
    redirect("/");
  }

  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const nextPath = String(formData.get("next") || "/");
  const account = authenticateDashboardUser(username, password);
  if (!account) {
    throw new Error("Invalid username or password.");
  }

  setDashboardSession(account);
  redirect(nextPath.startsWith("/") ? nextPath : "/");
}

export async function logoutDashboard() {
  clearDashboardSession();
  redirect("/login");
}
