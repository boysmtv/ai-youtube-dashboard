"use server";

import { revalidatePath } from "next/cache";
import { assertDashboardRole, engineAuditHeaders } from "../../lib/dashboard-auth";
import { createAdminBackup, getRegistry, restoreAdminBackup, runRetentionPolicy, updateRegistry } from "../../lib/engine-api";
import type { RegistryPayload } from "../../lib/engine-types";

function text(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) || fallback).trim();
}

function intValue(formData: FormData, key: string, fallback: number) {
  const value = Number.parseInt(text(formData, key), 10);
  return Number.isFinite(value) ? value : fallback;
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function csv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function persistRegistry(payload: RegistryPayload) {
  const session = assertDashboardRole("admin");
  await updateRegistry(payload, engineAuditHeaders(session));
  revalidatePath("/");
  revalidatePath("/channels");
  revalidatePath("/jobs");
  revalidatePath("/artifacts");
  revalidatePath("/system");
  revalidatePath("/settings");
}

function refreshAdminPaths() {
  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath("/logs");
  revalidatePath("/registry");
  revalidatePath("/settings");
}

export async function saveRegistrySettings(formData: FormData) {
  assertDashboardRole("admin");
  const raw = String(formData.get("registry_json") || "").trim();
  if (!raw) {
    throw new Error("Registry JSON is required.");
  }

  let payload: RegistryPayload;
  try {
    payload = JSON.parse(raw) as RegistryPayload;
  } catch (error) {
    throw new Error(`Registry JSON is invalid: ${error instanceof Error ? error.message : String(error)}`);
  }

  await persistRegistry(payload);
}

export async function saveCoreSettings(formData: FormData) {
  assertDashboardRole("admin");
  const registry = await getRegistry();
  registry.timezone = text(formData, "timezone", registry.timezone);
  registry.storage_budget_gb = intValue(formData, "storage_budget_gb", registry.storage_budget_gb);
  registry.default_publish_slots = csv(text(formData, "default_publish_slots", registry.default_publish_slots.join(",")));
  registry.worker.max_active_jobs = intValue(formData, "worker_max_active_jobs", registry.worker.max_active_jobs);
  registry.worker.min_free_disk_gb = intValue(formData, "worker_min_free_disk_gb", registry.worker.min_free_disk_gb);
  registry.worker.publish_lead_time_hours = intValue(
    formData,
    "worker_publish_lead_time_hours",
    registry.worker.publish_lead_time_hours,
  );
  registry.retention.enabled = checked(formData, "retention_enabled");
  registry.retention.auto_cleanup_on_worker_start = checked(formData, "retention_auto_cleanup_on_worker_start");
  registry.retention.auto_cleanup_on_scheduler_tick = checked(formData, "retention_auto_cleanup_on_scheduler_tick");
  registry.retention.keep_recent_job_dirs = intValue(formData, "retention_keep_recent_job_dirs", registry.retention.keep_recent_job_dirs);
  registry.retention.cleanup_interval_hours = intValue(formData, "retention_cleanup_interval_hours", registry.retention.cleanup_interval_hours);
  registry.retention.delete_downloads_first = checked(formData, "retention_delete_downloads_first");
  registry.upload_approval.enabled = checked(formData, "upload_approval_enabled");
  registry.upload_approval.confirmation_text = text(
    formData,
    "upload_approval_confirmation_text",
    registry.upload_approval.confirmation_text,
  );
  registry.upload_approval.reason = text(formData, "upload_approval_reason", registry.upload_approval.reason);
  registry.upload_approval.session_minutes = intValue(
    formData,
    "upload_approval_session_minutes",
    registry.upload_approval.session_minutes,
  );
  registry.upload_approval.require_operator_name = checked(formData, "upload_approval_require_operator_name");
  registry.upload_approval.require_reason = checked(formData, "upload_approval_require_reason");
  await persistRegistry(registry);
}

export async function saveChannelSettings(formData: FormData) {
  assertDashboardRole("admin");
  const registry = await getRegistry();
  const channelId = text(formData, "channel_id");
  const channel = registry.channels.find((item) => item.id === channelId);
  if (!channel) {
    throw new Error(`Channel ${channelId} was not found.`);
  }
  channel.display_name = text(formData, "display_name", channel.display_name);
  channel.niche = text(formData, "niche", channel.niche);
  channel.language = text(formData, "language", channel.language);
  channel.gcp_project_id = text(formData, "gcp_project_id", channel.gcp_project_id);
  channel.client_secret_path = text(formData, "client_secret_path", channel.client_secret_path);
  channel.token_path = text(formData, "token_path", channel.token_path);
  channel.curated_sources_path = text(formData, "curated_sources_path", channel.curated_sources_path);
  channel.publish_slots = csv(text(formData, "publish_slots", channel.publish_slots.join(",")));
  channel.enabled = checked(formData, "enabled");
  channel.upload_preflight.require_client_secret = checked(formData, "require_client_secret");
  channel.upload_preflight.require_token = checked(formData, "require_token");
  channel.upload_preflight.require_curated_sources = checked(formData, "require_curated_sources");
  channel.upload_preflight.require_publish_slots = checked(formData, "require_publish_slots");
  channel.upload_preflight.validate_oauth_credentials = checked(formData, "validate_oauth_credentials");
  channel.upload_preflight.auto_bootstrap_allowed = checked(formData, "auto_bootstrap_allowed");
  await persistRegistry(registry);
}

export async function runRetentionSnapshot(formData: FormData) {
  const session = assertDashboardRole("admin");
  await runRetentionPolicy(checked(formData, "force"), engineAuditHeaders(session));
  revalidatePath("/");
  revalidatePath("/system");
  revalidatePath("/settings");
  revalidatePath("/artifacts");
  revalidatePath("/logs");
}

export async function createBackupSnapshot(formData: FormData) {
  const session = assertDashboardRole("admin");
  await createAdminBackup(String(formData.get("target") || "all") as "registry" | "database" | "all", engineAuditHeaders(session));
  refreshAdminPaths();
}

export async function restoreBackupSnapshot(formData: FormData) {
  const session = assertDashboardRole("admin");
  await restoreAdminBackup(
    String(formData.get("target") || "registry") as "registry" | "database",
    String(formData.get("backup_name") || ""),
    engineAuditHeaders(session),
  );
  refreshAdminPaths();
}
