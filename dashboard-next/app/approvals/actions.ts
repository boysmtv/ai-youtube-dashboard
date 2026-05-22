"use server";

import { revalidatePath } from "next/cache";
import { assertDashboardRole, engineAuditHeaders } from "../../lib/dashboard-auth";
import { retryUploadJob } from "../../lib/engine-api";

function checked(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export async function approveUploadJob(formData: FormData) {
  const session = assertDashboardRole("operator");
  const jobId = Number(formData.get("job_id"));
  await retryUploadJob(jobId, {
    enable_upload: true,
    upload_approval: String(formData.get("upload_approval") || ""),
    approval_operator_name: String(formData.get("approval_operator_name") || ""),
    approval_reason: String(formData.get("approval_reason") || ""),
    require_credentials: checked(formData.get("require_credentials")),
    keep_downloads: checked(formData.get("keep_downloads")),
  }, engineAuditHeaders(session));
  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
}
