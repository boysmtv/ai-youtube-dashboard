"use server";

import { revalidatePath } from "next/cache";
import { assertDashboardRole, engineAuditHeaders } from "../../lib/dashboard-auth";
import { recoverRuntimeJobs } from "../../lib/engine-api";

function intValue(formData: FormData, key: string, fallback: number) {
  const value = Number.parseInt(String(formData.get(key) || fallback), 10);
  return Number.isFinite(value) ? value : fallback;
}

export async function recoverRuntimeHealth(formData: FormData) {
  const session = assertDashboardRole("operator");
  await recoverRuntimeJobs(
    {
      stuck_minutes: intValue(formData, "stuck_minutes", 60),
      max_retries: intValue(formData, "max_retries", 3),
      include_failed: formData.get("include_failed") === "on",
    },
    engineAuditHeaders(session),
  );
  revalidatePath("/");
  revalidatePath("/health");
  revalidatePath("/system");
  revalidatePath("/jobs");
  revalidatePath("/logs");
}
