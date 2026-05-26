"use server";

import { revalidatePath } from "next/cache";
import { assertDashboardRole, engineAuditHeaders } from "../../lib/dashboard-auth";
import {
  cancelJob,
  createJob,
  pauseJob,
  pushTiktokJob,
  pushYoutubeJob,
  requeueJob,
  resumeJob,
  runJob,
  updateJobReviewMetadata,
} from "../../lib/engine-api";
import type { UploadMode } from "../../lib/engine-types";

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
    copyright_acknowledged: checked(formData.get("copyright_acknowledged")),
    upload_mode: String(formData.get("upload_mode") || "private_validation") as UploadMode,
  };
}

function splitHashtags(value: string) {
  return value
    .split(/[\n,]+/g)
    .flatMap((item) => item.split(/\s+/g))
    .map((item) => item.trim())
    .filter(Boolean);
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

export async function saveJobReviewMetadata(formData: FormData) {
  const session = assertDashboardRole("operator");
  const jobId = Number(formData.get("job_id"));
  await updateJobReviewMetadata(
    jobId,
    {
      final_title: String(formData.get("final_title") || "").trim() || null,
      final_caption: String(formData.get("final_caption") || "").trim() || null,
      final_description: String(formData.get("final_description") || "").trim() || null,
      final_hashtags: splitHashtags(String(formData.get("final_hashtags") || "")),
      ai_disclosure_acknowledged: checked(formData.get("ai_disclosure_acknowledged")),
      ai_disclosure_override: checked(formData.get("ai_disclosure_override")),
      operator_review_notes: String(formData.get("operator_review_notes") || "").trim() || null,
      selected_upload_mode: String(formData.get("selected_upload_mode") || "private_validation"),
    },
    engineAuditHeaders(session),
  );
  revalidateBusinessViews(jobId);
}
