"use server";

import { revalidatePath } from "next/cache";
import { assertDashboardRole, engineAuditHeaders } from "../../lib/dashboard-auth";
import { cleanupJobFiles } from "../../lib/engine-api";

function checked(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export async function cleanupArtifactBundle(formData: FormData) {
  const session = assertDashboardRole("operator");
  const jobId = Number(formData.get("job_id"));
  await cleanupJobFiles(
    jobId,
    {
      include_artifacts: checked(formData.get("include_artifacts")),
      include_working_files: checked(formData.get("include_working_files")),
      include_downloads: checked(formData.get("include_downloads")),
    },
    engineAuditHeaders(session),
  );
  revalidatePath("/");
  revalidatePath("/artifacts");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/logs");
}
