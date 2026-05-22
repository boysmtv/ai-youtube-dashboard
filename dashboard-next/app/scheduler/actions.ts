"use server";

import { revalidatePath } from "next/cache";
import { assertDashboardRole, engineAuditHeaders } from "../../lib/dashboard-auth";
import { runScheduler } from "../../lib/engine-api";

export async function runSchedulerTick(formData: FormData) {
  const session = assertDashboardRole("operator");
  await runScheduler(Number(formData.get("days_ahead") || 1), engineAuditHeaders(session));
  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath("/scheduler");
}
