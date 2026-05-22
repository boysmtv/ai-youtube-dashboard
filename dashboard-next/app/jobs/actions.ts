"use server";

import { revalidatePath } from "next/cache";
import { assertDashboardRole, engineAuditHeaders } from "../../lib/dashboard-auth";
import { cancelJob, createJob, pauseJob, pushTiktokJob, pushYoutubeJob, requeueJob, resumeJob, runJob } from "../../lib/engine-api";

function optionalNumber(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text ? Number(text) : null;
}

function checked(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function publishPayload(formData: FormData) {
  return {
    enable_upload: true,
    upload_approval: String(formData.get("upload_approval") || ""),
    approval_operator_name: String(formData.get("approval_operator_name") || ""),
    approval_reason: String(formData.get("approval_reason") || ""),
    require_credentials: checked(formData.get("require_credentials")),
  };
}

function revalidateBusinessViews(jobId?: number) {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/queue");
  revalidatePath("/jobs");
  revalidatePath("/publish");
  revalidatePath("/approvals");
  if (jobId !== undefined) {
    revalidatePath(`/jobs/${jobId}`);
  }
}

export async function createDashboardJob(formData: FormData) {
  const session = assertDashboardRole("operator");
  await createJob({
    channel_id: String(formData.get("channel_id") || ""),
    publish_at: String(formData.get("publish_at") || ""),
    niche: String(formData.get("niche") || "") || undefined,
    language: String(formData.get("language") || "") || undefined,
    status: "queued",
    enable_upload: checked(formData.get("enable_upload")),
    upload_approval: String(formData.get("upload_approval") || ""),
    approval_operator_name: String(formData.get("approval_operator_name") || ""),
    approval_reason: String(formData.get("approval_reason") || ""),
    require_credentials: checked(formData.get("require_credentials")),
    keep_downloads: checked(formData.get("keep_downloads")),
    max_retries: optionalNumber(formData.get("max_retries")),
  }, engineAuditHeaders(session));
  revalidateBusinessViews();
}

export async function runDashboardJob(formData: FormData) {
  const session = assertDashboardRole("operator");
  await runJob(Number(formData.get("job_id")), {
    enable_upload: checked(formData.get("enable_upload")),
    upload_approval: String(formData.get("upload_approval") || ""),
    approval_operator_name: String(formData.get("approval_operator_name") || ""),
    approval_reason: String(formData.get("approval_reason") || ""),
    require_credentials: checked(formData.get("require_credentials")),
    keep_downloads: checked(formData.get("keep_downloads")),
    max_retries: optionalNumber(formData.get("max_retries")),
  }, engineAuditHeaders(session));
  revalidateBusinessViews();
}

export async function requeueDashboardJob(formData: FormData) {
  const session = assertDashboardRole("operator");
  await requeueJob(Number(formData.get("job_id")), engineAuditHeaders(session));
  revalidateBusinessViews();
}

export async function pauseDashboardJob(formData: FormData) {
  const session = assertDashboardRole("operator");
  await pauseJob(Number(formData.get("job_id")), engineAuditHeaders(session));
  revalidateBusinessViews();
}

export async function resumeDashboardJob(formData: FormData) {
  const session = assertDashboardRole("operator");
  await resumeJob(Number(formData.get("job_id")), engineAuditHeaders(session));
  revalidateBusinessViews();
}

export async function cancelDashboardJob(formData: FormData) {
  const session = assertDashboardRole("operator");
  await cancelJob(Number(formData.get("job_id")), engineAuditHeaders(session));
  revalidateBusinessViews();
}

export async function pushYoutubeDashboardJob(formData: FormData) {
  const session = assertDashboardRole("operator");
  const jobId = Number(formData.get("job_id"));
  await pushYoutubeJob(jobId, publishPayload(formData), engineAuditHeaders(session));
  revalidateBusinessViews(jobId);
}

export async function pushTiktokDashboardJob(formData: FormData) {
  const session = assertDashboardRole("operator");
  const jobId = Number(formData.get("job_id"));
  await pushTiktokJob(jobId, publishPayload(formData), engineAuditHeaders(session));
  revalidateBusinessViews(jobId);
}
