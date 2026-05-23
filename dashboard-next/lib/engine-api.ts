import type {
  ApprovalAudit,
  ArtifactIndexPayload,
  BackupListPayload,
  BackupTarget,
  ChannelReadinessPayload,
  HealthPayload,
  JobCreatePayload,
  JobDetailPayload,
  JobFilePayload,
  JobMutationResult,
  JobRecord,
  JobMetricsPayload,
  JobResultPayload,
  JobTimelinePayload,
  ListPayload,
  OverviewPayload,
  ManualPushPayload,
  ManualPushResult,
  PublishQueuePayload,
  PublishHistoryPayload,
  PublishStatePayload,
  RegistryPayload,
  RuntimeHealthPayload,
  UploadApprovalPayload,
  UploadRevokePayload,
} from "./engine-types";
import type { EngineStateView } from "./sync-settings";

const DEFAULT_ENGINE_URL = "http://localhost:8080";
type EngineMutationHeaders = Record<string, string>;

export function engineBaseUrl() {
  return (process.env.ENGINE_API_BASE_URL || DEFAULT_ENGINE_URL).replace(/\/$/, "");
}

export function engineBrowserBaseUrl() {
  return (process.env.NEXT_PUBLIC_ENGINE_API_BASE_URL || DEFAULT_ENGINE_URL).replace(/\/$/, "");
}

function withStateView(path: string, stateView: EngineStateView = "default") {
  if (stateView !== "redis") {
    return path;
  }
  const [pathname, search = ""] = path.split("?");
  const params = new URLSearchParams(search);
  params.set("state_view", "redis");
  return `${pathname}?${params.toString()}`;
}

async function fetchEngine<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${engineBaseUrl()}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Engine request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getHealth() {
  return fetchEngine<HealthPayload>("/health");
}

export async function getRuntimeHealth(requireCredentials = false, stuckMinutes = 60) {
  return fetchEngine<RuntimeHealthPayload>(
    `/api/runtime-health?require_credentials=${requireCredentials ? "true" : "false"}&stuck_minutes=${stuckMinutes}`,
  );
}

export async function getOverview(stateView: EngineStateView = "default") {
  return fetchEngine<OverviewPayload>(withStateView("/api/overview", stateView));
}

export async function getRegistry() {
  return fetchEngine<RegistryPayload>("/api/registry");
}

export async function getChannelReadiness(limitPerChannel = 50) {
  return fetchEngine<ChannelReadinessPayload>(`/api/channels/readiness?limit_per_channel=${limitPerChannel}`);
}

export async function getChannelPreflight(channelId: string) {
  return fetchEngine<{ generated_at: string; channel: ChannelReadinessPayload["items"][number] }>(`/api/channels/${channelId}/preflight`);
}

export async function updateRegistry(payload: RegistryPayload, headers: EngineMutationHeaders = {}) {
  return fetchEngine<{ status: string; path: string; registry: RegistryPayload }>("/api/registry", {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function getJobs(limit = 100, stateView: EngineStateView = "default") {
  return fetchEngine<ListPayload<JobRecord>>(withStateView(`/api/jobs?limit=${limit}`, stateView));
}

export async function getArtifactsIndex(limit = 24, filters: { status?: string; channel_id?: string; query?: string } = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
    status: filters.status || "",
    channel_id: filters.channel_id || "",
    query: filters.query || "",
  });
  return fetchEngine<ArtifactIndexPayload>(`/api/artifacts?${params.toString()}`);
}

export async function getJobDetail(jobId: number, stateView: EngineStateView = "default") {
  return fetchEngine<JobDetailPayload>(withStateView(`/api/jobs/${jobId}`, stateView));
}

export async function getJobTimeline(jobId: number, stateView: EngineStateView = "default") {
  return fetchEngine<JobTimelinePayload>(withStateView(`/api/jobs/${jobId}/timeline`, stateView));
}

export async function getJobMetrics(jobId: number, stateView: EngineStateView = "default") {
  return fetchEngine<JobMetricsPayload>(withStateView(`/api/jobs/${jobId}/metrics`, stateView));
}

export async function getJobPublishState(jobId: number, stateView: EngineStateView = "default") {
  return fetchEngine<PublishStatePayload>(withStateView(`/api/jobs/${jobId}/publish-state`, stateView));
}

export async function getJobResult(jobId: number, stateView: EngineStateView = "default") {
  return fetchEngine<JobResultPayload>(withStateView(`/api/jobs/${jobId}/result`, stateView));
}

export async function getJobFile(jobId: number, fileKey: "transcript" | "plan") {
  return fetchEngine<JobFilePayload>(`/api/jobs/${jobId}/files/${fileKey}`);
}

export function engineJobFileDownloadUrl(jobId: number, fileKey: "transcript" | "plan") {
  return `${engineBrowserBaseUrl()}/api/jobs/${jobId}/files/${fileKey}/download`;
}

export function engineArtifactDownloadUrl(jobId: number, artifactId: number) {
  return `${engineBrowserBaseUrl()}/api/jobs/${jobId}/artifacts/${artifactId}/download`;
}

export async function getRecentApprovals(limit = 30) {
  return fetchEngine<ListPayload<ApprovalAudit>>(`/api/approvals/recent?limit=${limit}`);
}

export async function getPublishHistory(limit = 50) {
  return fetchEngine<PublishHistoryPayload>(`/api/publish/history?limit=${limit}`);
}

export async function getPublishQueue(limit = 100) {
  return fetchEngine<PublishQueuePayload>(`/api/publish/queue?limit=${limit}`);
}

export async function getRecentLogs(limit = 100) {
  return fetchEngine<ListPayload<Record<string, unknown>>>(`/api/logs/recent?limit=${limit}`);
}

export async function getAdminBackups() {
  return fetchEngine<BackupListPayload>("/api/admin/backups");
}

export async function createJob(payload: JobCreatePayload, headers: EngineMutationHeaders = {}) {
  return fetchEngine<JobMutationResult>("/api/jobs", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function runJob(jobId: number, payload: Partial<JobCreatePayload> = {}, headers: EngineMutationHeaders = {}) {
  return fetchEngine<JobMutationResult>(`/api/jobs/${jobId}/run`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function retryUploadJob(jobId: number, payload: Partial<JobCreatePayload> = {}, headers: EngineMutationHeaders = {}) {
  return fetchEngine<JobMutationResult>(`/api/jobs/${jobId}/retry-upload`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function pushYoutubeJob(jobId: number, payload: ManualPushPayload = {}, headers: EngineMutationHeaders = {}) {
  return fetchEngine<ManualPushResult>(`/api/jobs/${jobId}/push/youtube`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function pushTiktokJob(jobId: number, payload: ManualPushPayload = {}, headers: EngineMutationHeaders = {}) {
  return fetchEngine<ManualPushResult>(`/api/jobs/${jobId}/push/tiktok`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function approveUploadJob(jobId: number, platform: "youtube" | "tiktok", payload: UploadApprovalPayload, headers: EngineMutationHeaders = {}) {
  return fetchEngine<{ status: string; job_id: number; platform: string; approval: Record<string, unknown> }>(`/api/jobs/${jobId}/approvals/${platform}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function revokeUploadJob(jobId: number, platform: "youtube" | "tiktok", payload: UploadRevokePayload, headers: EngineMutationHeaders = {}) {
  return fetchEngine<{ status: string; job_id: number; platform: string }>(`/api/jobs/${jobId}/approvals/${platform}/revoke`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function requeueJob(jobId: number, headers: EngineMutationHeaders = {}) {
  return fetchEngine<JobMutationResult>(`/api/jobs/${jobId}/requeue`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
}

export async function pauseJob(jobId: number, headers: EngineMutationHeaders = {}) {
  return fetchEngine<JobMutationResult>(`/api/jobs/${jobId}/pause`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
}

export async function resumeJob(jobId: number, headers: EngineMutationHeaders = {}) {
  return fetchEngine<JobMutationResult>(`/api/jobs/${jobId}/resume`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
}

export async function cancelJob(jobId: number, headers: EngineMutationHeaders = {}) {
  return fetchEngine<JobMutationResult>(`/api/jobs/${jobId}/cancel`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
}

export async function cleanupJobFiles(
  jobId: number,
  payload: { include_artifacts?: boolean; include_working_files?: boolean; include_downloads?: boolean },
  headers: EngineMutationHeaders = {},
) {
  return fetchEngine<{
    status: string;
    job_id: number;
    removed_paths: string[];
    removed_artifact_ids: number[];
    counts: { removed_paths: number; removed_artifacts: number };
  }>(`/api/jobs/${jobId}/cleanup`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      include_artifacts: payload.include_artifacts ?? true,
      include_working_files: payload.include_working_files ?? true,
      include_downloads: payload.include_downloads ?? false,
    }),
  });
}

export async function runScheduler(daysAhead = 1, headers: EngineMutationHeaders = {}) {
  return fetchEngine<{ status: string; total_created: number; created: Array<Record<string, unknown>> }>("/api/scheduler/run", {
    method: "POST",
    headers,
    body: JSON.stringify({ days_ahead: daysAhead }),
  });
}

export async function runWorker(payload: Partial<JobCreatePayload> = {}, headers: EngineMutationHeaders = {}) {
  return fetchEngine<JobMutationResult>("/api/worker/run", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function createAdminBackup(target: BackupTarget | "all", headers: EngineMutationHeaders = {}) {
  return fetchEngine<{ status: string; items: Array<Record<string, unknown>> }>("/api/admin/backups/create", {
    method: "POST",
    headers,
    body: JSON.stringify({ target }),
  });
}

export async function restoreAdminBackup(target: BackupTarget, backup_name: string, headers: EngineMutationHeaders = {}) {
  return fetchEngine<{ status: string; restored: Record<string, unknown> }>("/api/admin/backups/restore", {
    method: "POST",
    headers,
    body: JSON.stringify({ target, backup_name }),
  });
}

export async function recoverRuntimeJobs(
  payload: { stuck_minutes?: number; max_retries?: number; include_failed?: boolean },
  headers: EngineMutationHeaders = {},
) {
  return fetchEngine<RuntimeHealthPayload>("/api/admin/recover", {
    method: "POST",
    headers,
    body: JSON.stringify({
      stuck_minutes: payload.stuck_minutes ?? 60,
      max_retries: payload.max_retries ?? 3,
      include_failed: payload.include_failed ?? false,
    }),
  });
}

export async function runRetentionPolicy(force = false, headers: EngineMutationHeaders = {}) {
  return fetchEngine<{
    status: string;
    reason?: string;
    deleted_bytes?: number;
    action_count?: number;
    actions?: Array<{ category: string; path: string; bytes_freed: number }>;
    before?: { managed_gb: number; free_gb: number };
    after?: { managed_gb: number; free_gb: number };
  }>("/api/admin/retention/run", {
    method: "POST",
    headers,
    body: JSON.stringify({ force }),
  });
}
