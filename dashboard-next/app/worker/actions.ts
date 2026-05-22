"use server";

import { revalidatePath } from "next/cache";
import { assertDashboardRole, engineAuditHeaders } from "../../lib/dashboard-auth";
import { runWorker } from "../../lib/engine-api";

export async function runWorkerOnce() {
  const session = assertDashboardRole("operator");
  await runWorker({ enable_upload: false }, engineAuditHeaders(session));
  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath("/worker");
}
