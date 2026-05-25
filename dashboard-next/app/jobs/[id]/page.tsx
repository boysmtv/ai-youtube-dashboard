import Link from "next/link";
import { AppShell } from "../../../components/app-shell";
import { ConfirmSubmitButton } from "../../../components/confirm-submit-button";
import { JobControlPanel } from "../../../components/job-control-panel";
import { JobRealtimePanel } from "../../../components/job-realtime-panel";
import { StatusBadge } from "../../../components/status-badge";
import { UploadApprovalPanel } from "../../../components/upload-approval-panel";
import { hasDashboardRole, requireDashboardSession } from "../../../lib/dashboard-auth";
import {
  engineBrowserBaseUrl,
  engineArtifactDownloadUrl,
  engineJobFileDownloadUrl,
  getJobDetail,
  getJobFile,
  getJobMetrics,
  getJobPublishState,
  getJobResult,
  getJobTimeline,
  getOverview,
} from "../../../lib/engine-api";
import type {
  JobFilePayload,
  JobResultPayload,
  JobTimelinePayload,
  PublishQueueItem,
  PublishStatePayload,
} from "../../../lib/engine-types";
import { parseEngineSyncSettings } from "../../../lib/sync-settings";
import { pushTiktokDashboardJob, pushYoutubeDashboardJob } from "../actions";

function formatBytes(value?: number | null) {
  if (!value || value <= 0) {
    return "Unknown";
  }
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  if (value < 1024 * 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatNumber(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Not set";
  }
  return new Intl.NumberFormat("en-US").format(value);
}

function formatSeconds(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Not set";
  }
  if (value < 60) {
    return `${value.toFixed(1)}s`;
  }
  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);
  return `${minutes}m ${seconds}s`;
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Not set";
  }
  return `${value.toFixed(1)}%`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function MetricCard({
  label,
  value,
  note,
  tone = "neutral",
}: Readonly<{
  label: string;
  value: string;
  note?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}>) {
  const toneClass =
    tone === "good"
      ? "border-success-200 bg-success-50"
      : tone === "warn"
        ? "border-warning-200 bg-warning-50"
        : tone === "bad"
          ? "border-error-200 bg-error-50"
          : "border-gray-200 bg-gray-50";
  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="ta-label">{label}</p>
      <strong className="mt-2 block text-2xl text-gray-900">{value}</strong>
      {note ? <p className="mt-2 text-xs text-gray-500">{note}</p> : null}
    </div>
  );
}

function StageBadge({ state }: Readonly<{ state: JobTimelinePayload["stages"][number]["state"] }>) {
  const tone =
    state === "done"
      ? "bg-success-50 text-success-700"
      : state === "current"
        ? "bg-brand-50 text-brand-700"
        : state === "failed"
          ? "bg-error-50 text-error-700"
          : "bg-gray-100 text-gray-700";
  return <span className={`ta-status font-mono ${tone}`}>{state}</span>;
}

function PublishPill({ status }: Readonly<{ status: string }>) {
  const normalized = status.toLowerCase();
  const displayLabel = normalized === "approval_required" ? "Butuh persetujuan" : status;
  const tone =
    normalized === "uploaded" || normalized === "draft_ready" || normalized === "published"
      ? "bg-success-50 text-success-700"
      : normalized === "ready" || normalized === "configured"
        ? "bg-brand-50 text-brand-700"
        : normalized === "adapter_missing" || normalized === "not_configured" || normalized === "token_missing"
          ? "bg-gray-100 text-gray-700"
          : normalized === "processing" || normalized === "pending"
            ? "bg-warning-50 text-warning-700"
          : normalized === "failed"
              ? "bg-error-50 text-error-700"
            : "bg-warning-50 text-warning-700";
  return <span className={`ta-status font-mono ${tone}`}>{displayLabel}</span>;
}

function deriveTikTokSurfaceState(tiktok: PublishStatePayload["tiktok"]) {
  const message = `${tiktok.message || ""} ${tiktok.status_reason || ""} ${tiktok.error_message || ""}`.toLowerCase();
  const status = tiktok.status.toLowerCase();
  if (!tiktok.available && (status === "adapter_missing" || message.includes("not configured"))) {
    return "not_configured";
  }
  if (message.includes("token is missing") || message.includes("token missing") || message.includes("invalid")) {
    return "token_missing";
  }
  if (tiktok.manual_push_available) {
    return status;
  }
  if (tiktok.available) {
    return status === "pending" ? "configured" : status;
  }
  return status;
}

function EmptyState({ label }: Readonly<{ label: string }>) {
  return <div className="ta-empty">{label}</div>;
}

function DetailRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0 last:pb-0">
      <span className="ta-label">{label}</span>
      <span className="max-w-[70%] break-words text-right text-sm text-gray-700">{value}</span>
    </div>
  );
}

function DownloadLink({ href, label }: Readonly<{ href: string; label: string }>) {
  return (
    <a className="ta-button-muted" href={href} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

type FinalArtifactView = {
  artifact_id?: number | null;
  job_id: number;
  platform?: string | null;
  kind: string;
  file_name: string;
  path: string;
  size_bytes?: number | null;
  width?: number | null;
  height?: number | null;
  duration_seconds?: number | null;
  created_at?: string | null;
  exists: boolean;
};

function ResultMetaRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0 last:pb-0">
      <span className="ta-label">{label}</span>
      <span className="max-w-[70%] break-words text-right text-sm text-gray-700">{value}</span>
    </div>
  );
}

function formatDimension(value?: number | null) {
  if (!value || value <= 0) {
    return "Not set";
  }
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDuration(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Not set";
  }
  if (value < 60) {
    return `${value.toFixed(1)}s`;
  }
  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);
  return `${minutes}m ${seconds}s`;
}

function FileCard({
  title,
  file,
  href,
}: Readonly<{
  title: string;
  file: JobFilePayload | null;
  href: string | null;
}>) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="ta-label text-brand-600">File proses</p>
          <h4 className="mt-1 text-base font-semibold text-gray-900">{title}</h4>
        </div>
        {file && href ? <DownloadLink href={href} label="Download" /> : null}
      </div>
      <div className="mt-4 space-y-3">
        {file ? (
          <>
            <DetailRow label="Path" value={file.path} />
            <DetailRow label="Available" value="Yes" />
          </>
        ) : (
          <EmptyState label={`${title} is not available yet.`} />
        )}
      </div>
    </div>
  );
}

function PublishButtonGroup({
  jobId,
  uploadGuard,
  publishState,
}: Readonly<{
  jobId: number;
  uploadGuard: { confirmation_text: string; reason: string };
  publishState: PublishStatePayload;
}>) {
  const youtubeReady = publishState.youtube.manual_push_available;
  const tiktokReady = publishState.tiktok.manual_push_available;
  const tiktokState = publishState.tiktok.status.toLowerCase();
  const tiktokSurfaceState = deriveTikTokSurfaceState(publishState.tiktok);
  const tiktokMessage = publishState.tiktok.message || publishState.tiktok.status_reason || publishState.tiktok.error_message || "Not set";

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="ta-label text-brand-600">Review & Upload</p>
          <h4 className="mt-1 text-base font-semibold text-gray-900">Manual push</h4>
        </div>
        <PublishPill status={publishState.youtube.status} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="ta-label">YouTube</p>
              <strong className="mt-1 block text-gray-900">Jalur upload aktif</strong>
            </div>
            <PublishPill status={youtubeReady ? "ready" : publishState.youtube.status} />
          </div>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <DetailRow label="Ready to push" value={youtubeReady ? "Yes" : "No"} />
            <DetailRow label="Approval" value={publishState.youtube.approval?.is_active ? "Siap upload" : "Butuh persetujuan"} />
            <DetailRow label="Publish mode" value={publishState.youtube.publish_mode || "private_immediate"} />
            <DetailRow label="Publish at" value={publishState.youtube.publish_at || "Not set"} />
            <DetailRow label="Video ID" value={publishState.youtube.youtube_video_id || "Pending"} />
            <DetailRow label="URL" value={publishState.youtube.youtube_url || "Pending"} />
          </div>
          <div className="mt-4 rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-900">
            <strong className="block">Peringatan copyright</strong>
            <p className="mt-2">
              Pastikan sumber video/audio dimiliki, berlisensi, atau boleh digunakan. Upload hanya boleh dilakukan setelah operator menyetujui risiko ini.
            </p>
          </div>
          {youtubeReady ? (
            <form action={pushYoutubeDashboardJob} className="mt-4 grid gap-3">
              <input name="job_id" type="hidden" value={jobId} />
              <input name="upload_approval" type="hidden" value={uploadGuard.confirmation_text} />
              <label className="grid gap-2 text-sm font-semibold">
                Operator name
                <input name="approval_operator_name" placeholder="operator name" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Publish reason
                <input name="approval_reason" placeholder={uploadGuard.reason} />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input className="ta-check" name="require_credentials" type="checkbox" defaultChecked />
                Require credentials
              </label>
              <label className="flex items-start gap-2 text-sm font-semibold text-gray-700">
                <input className="ta-check mt-1" name="copyright_acknowledged" type="checkbox" required />
                <span>Saya memahami risiko copyright untuk sumber video/audio ini.</span>
              </label>
              <ConfirmSubmitButton className="px-4 py-2 text-sm" message={`Push job #${jobId} to YouTube now?`} pendingText="Pushing...">
                Push to YouTube
              </ConfirmSubmitButton>
            </form>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
              {publishState.youtube.approval?.is_active
                ? "YouTube push becomes available after the item reaches the rendered state."
                : "YouTube upload is waiting for manual approval."}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="ta-label">TikTok</p>
              <strong className="mt-1 block text-gray-900">Lane TikTok</strong>
            </div>
            <PublishPill status={tiktokSurfaceState} />
          </div>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <DetailRow label="Approval" value={publishState.tiktok.approval?.is_active ? "Siap upload" : "Butuh persetujuan"} />
            <DetailRow label="Configured" value={publishState.tiktok.available ? "Yes" : "No"} />
            <DetailRow label="Ready to push" value={tiktokReady ? "Yes" : "No"} />
            <DetailRow label="State" value={publishState.tiktok.status} />
            <DetailRow label="Gate" value={tiktokSurfaceState === "approval_required" ? "Butuh persetujuan" : tiktokSurfaceState} />
            <DetailRow label="Mode" value={publishState.tiktok.publish_mode || "Not set"} />
            <DetailRow label="Transfer" value={publishState.tiktok.transfer_method || "Not set"} />
            <DetailRow label="Publish ID" value={publishState.tiktok.publish_id || "Pending"} />
            <DetailRow label="Post ID" value={publishState.tiktok.post_id || "Pending"} />
            <DetailRow label="Reason" value={tiktokMessage} />
          </div>
          <div className="mt-4 rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-900">
            <strong className="block">Peringatan copyright</strong>
            <p className="mt-2">
              Pastikan sumber video/audio dimiliki, berlisensi, atau boleh digunakan. Upload hanya boleh dilakukan setelah operator menyetujui risiko ini.
            </p>
          </div>
          {tiktokReady ? (
            <form action={pushTiktokDashboardJob} className="mt-4 grid gap-3">
              <input name="job_id" type="hidden" value={jobId} />
              <input name="upload_approval" type="hidden" value={uploadGuard.confirmation_text} />
              <label className="grid gap-2 text-sm font-semibold">
                Operator name
                <input name="approval_operator_name" placeholder="operator name" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Publish reason
                <input name="approval_reason" placeholder={uploadGuard.reason} />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input className="ta-check" name="require_credentials" type="checkbox" defaultChecked />
                Require credentials
              </label>
              <label className="flex items-start gap-2 text-sm font-semibold text-gray-700">
                <input className="ta-check mt-1" name="copyright_acknowledged" type="checkbox" required />
                <span>Saya memahami risiko copyright untuk sumber video/audio ini.</span>
              </label>
              <ConfirmSubmitButton className="px-4 py-2 text-sm" message={`Push job #${jobId} to TikTok now?`} pendingText="Pushing...">
                Push to TikTok
              </ConfirmSubmitButton>
            </form>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
              {publishState.tiktok.approval?.is_active
                ? publishState.tiktok.available
                  ? "TikTok is configured but this item is not ready for manual push yet."
                  : "TikTok is not configured for this channel."
                : "TikTok upload is waiting for manual approval."}
            </div>
          )}
          <p className="mt-3 text-xs text-gray-500">
            {tiktokReady
              ? "TikTok push is available from this lane."
              : tiktokState === "token_missing"
                ? "TikTok token is missing or invalid."
                : publishState.tiktok.available
                  ? "TikTok is configured, but the current state is still blocked."
                  : "TikTok publish is not enabled for this channel."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function JobDetailPage({
  params,
  searchParams,
}: Readonly<{ params: { id: string }; searchParams: Record<string, string | string[] | undefined> }>) {
  const session = requireDashboardSession(`/jobs/${params.id}`);
  const syncSettings = parseEngineSyncSettings(searchParams);
  const jobId = Number(params.id);
  const [detail, overview, transcriptFile, planFile, timeline, metrics, publishState, result] = await Promise.all([
    getJobDetail(jobId, syncSettings.stateView),
    getOverview(syncSettings.stateView),
    getJobFile(jobId, "transcript").catch(() => null),
    getJobFile(jobId, "plan").catch(() => null),
    getJobTimeline(jobId, syncSettings.stateView),
    getJobMetrics(jobId, syncSettings.stateView),
    getJobPublishState(jobId, syncSettings.stateView),
    getJobResult(jobId, syncSettings.stateView).catch(() => null),
  ]);
  const { job } = detail;
  const canOperate = hasDashboardRole(session, "operator");
  const manifest = asRecord(detail.manifest);
  const sourceManifest = asRecord(manifest?.source);
  const renderManifest = Array.isArray(manifest?.renders) ? manifest?.renders : [];
  const sourceSize = metrics.source_size_bytes ? formatBytes(metrics.source_size_bytes) : "Unknown";
  const outputSize = formatBytes(metrics.output_size_bytes);
  const sizeRatio = metrics.size_ratio !== null ? formatPercent(metrics.size_ratio * 100) : "Not set";
  const outputSpeed = metrics.download_speed_mbps !== null ? `${metrics.download_speed_mbps.toFixed(3)} Mbps` : "Not set";
  const currentStage = detail.current_stage || timeline.current_stage || job.current_stage || job.status;
  const progressValue = detail.progress_percent ?? timeline.progress_percent ?? job.progress_percent ?? 0;
  const progress = `${progressValue.toFixed(0)}%`;
  const lastError = detail.last_error || timeline.last_error || job.last_error || "";
  const titleVariants = detail.title_variants || [];
  const viralAnalysis = detail.viral_analysis;
  const viralScore = viralAnalysis?.score ?? job.viral_score ?? metrics.viral_fit_score;
  const tiktokSurfaceState = deriveTikTokSurfaceState(publishState.tiktok);
  const finalResult = result as JobResultPayload | null;
  const finalResultMessage = finalResult?.message || "Video belum selesai";
  const previewUrl = finalResult?.preview_url ? `${engineBrowserBaseUrl()}${finalResult.preview_url}` : null;
  const downloadUrl = finalResult?.download_url ? `${engineBrowserBaseUrl()}${finalResult.download_url}` : null;
  const previewArtifact = finalResult?.preview_artifact || null;
  const finalArtifacts: FinalArtifactView[] = finalResult?.artifacts.length
    ? finalResult.artifacts
    : detail.artifacts.map((artifact) => ({
        artifact_id: artifact.id,
        job_id: job.id,
        platform: artifact.kind.split(":")[1] || "render",
        kind: artifact.kind,
        file_name: artifact.path.split(/[\\/]/).pop() || artifact.path,
        path: artifact.path,
        size_bytes: artifact.size_bytes,
        created_at: artifact.created_at,
        exists: true,
      }));
  const publishQueueItem: PublishQueueItem = {
    job,
    selected_title: job.selected_title,
    viral_score: viralScore ?? null,
    status: job.status,
    publish_state: publishState,
    upload_approvals: detail.upload_approvals || [],
    approval_summary: publishState.approvals,
  };

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <Link className="ta-label text-brand-600 underline-offset-4 hover:underline" href="/jobs">
          Kembali ke antrian
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-bold leading-none text-gray-900 lg:text-5xl">Video #{job.id}</h2>
            <p className="mt-3 max-w-3xl text-gray-500">Lembar produksi untuk sumber, progres tahap, hasil video, dan upload manual.</p>
          </div>
          <StatusBadge status={job.status} />
        </div>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Tahap saat ini" value={currentStage} note={`Progres ${progress}`} tone={progressValue >= 80 ? "good" : "warn"} />
        <MetricCard label="Ukuran sumber" value={sourceSize} note={sourceManifest?.title ? String(sourceManifest.title) : "Video sumber"} />
        <MetricCard label="Ukuran hasil" value={outputSize} note={`Ratio ${sizeRatio}`} tone={metrics.output_size_bytes > 0 ? "good" : "neutral"} />
        <MetricCard label="Kecepatan unduh" value={outputSpeed} note={metrics.download_duration_seconds ? formatSeconds(metrics.download_duration_seconds) : "Not set"} />
        <MetricCard label="Antrian" value={metrics.queue_count ? formatNumber(metrics.queue_count) : "0"} note={metrics.queue_position ? `Posisi ${metrics.queue_position}` : "Siap diproses"} />
        <MetricCard label="Skor potensi viral" value={metrics.viral_fit_score !== null ? formatNumber(metrics.viral_fit_score) : "Not set"} note={metrics.quality_score_overall !== null ? `Quality ${metrics.quality_score_overall}` : "Plan score"} tone={(metrics.viral_fit_score || 0) >= 80 ? "good" : "warn"} />
      </section>

      {lastError ? (
        <section className="mt-6 rounded-2xl border border-error-200 bg-error-50 p-4 text-sm text-error-700">
        <strong className="block text-base">Alasan gagal</strong>
          <p className="mt-2">{lastError}</p>
        </section>
      ) : null}

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="ta-panel p-5">
          <p className="ta-label text-brand-600">Lihat hasil video</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">File final siap review</h3>
          <div className="mt-4 space-y-4">
            {finalResult ? (
              finalResult.available && previewUrl && previewArtifact ? (
                <>
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black">
                    <video className="aspect-[9/16] w-full bg-black" controls playsInline preload="metadata" src={previewUrl} />
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="ta-label text-brand-600">Final video</p>
                        <h4 className="mt-1 text-base font-semibold text-gray-900">{previewArtifact.file_name}</h4>
                      </div>
                      {downloadUrl && previewArtifact.artifact_id ? (
                        <DownloadLink href={downloadUrl} label="Download" />
                      ) : null}
                    </div>
                    <div className="mt-4 space-y-3">
                      <ResultMetaRow label="File name" value={previewArtifact.file_name} />
                      <ResultMetaRow label="Size" value={formatBytes(previewArtifact.size_bytes)} />
                      <ResultMetaRow
                        label="Resolution"
                        value={previewArtifact.width && previewArtifact.height ? `${formatDimension(previewArtifact.width)} Ã— ${formatDimension(previewArtifact.height)}` : "Not set"}
                      />
                      <ResultMetaRow label="Duration" value={formatDuration(previewArtifact.duration_seconds)} />
                      <ResultMetaRow label="Created" value={previewArtifact.created_at || "Not set"} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
                  <strong className="block text-base text-gray-900">{finalResult.message}</strong>
                  <p className="mt-2">
                    {finalResult.status === "failed"
                      ? "Video gagal dibuat. Lihat ringkasan error dan activity feed di atas."
                      : finalResult.status === "rendered" || finalResult.status === "uploaded"
                        ? "File hasil tidak ditemukan. Output mungkin sudah dibersihkan atau belum tersedia di folder output."
                        : "Video masih diproses. Preview akan muncul setelah render selesai."}
                  </p>
                </div>
              )
            ) : (
              <EmptyState label={finalResultMessage} />
            )}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="ta-label text-brand-600">Final artifact list</p>
              <div className="mt-4 space-y-3">
                {finalArtifacts.map((artifact, index) => (
                  <div key={`${artifact.kind}-${index}`} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <strong className="text-sm text-gray-900">{artifact.platform || artifact.kind}</strong>
                        <p className="mt-1 text-xs text-gray-500">{artifact.file_name}</p>
                      </div>
                      {artifact.artifact_id ? (
                        <DownloadLink href={engineArtifactDownloadUrl(job.id, artifact.artifact_id)} label="Download" />
                      ) : null}
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                      <ResultMetaRow label="Size" value={formatBytes(artifact.size_bytes)} />
                      <ResultMetaRow
                        label="Resolution"
                        value={artifact.width && artifact.height ? `${formatDimension(artifact.width)} Ã— ${formatDimension(artifact.height)}` : "Not set"}
                      />
                      <ResultMetaRow label="Duration" value={formatDuration(artifact.duration_seconds)} />
                      <ResultMetaRow label="Created" value={artifact.created_at || "Not set"} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="ta-panel p-5">
          <p className="ta-label text-brand-600">Judul terbaik</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">{job.selected_title || "Belum ada judul terpilih"}</h3>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              Skor potensi viral {viralScore !== null && viralScore !== undefined ? formatNumber(viralScore) : "Not set"}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              {titleVariants.length ? `${titleVariants.length} pilihan judul` : "Belum ada variasi judul"}
            </span>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Judul terbaik dipilih secara lokal dari source title, transcript, niche, dan konteks durasi tanpa API LLM berbayar.
          </p>
          <div className="mt-5 space-y-3">
            <p className="ta-label text-gray-500">Pilihan judul lain</p>
            {titleVariants.length ? (
              titleVariants.map((variant) => (
                <div key={variant.id} className={`rounded-2xl border p-4 ${variant.selected ? "border-brand-200 bg-brand-50" : "border-gray-200 bg-gray-50"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <strong className="block text-sm text-gray-900">{variant.title}</strong>
                      <p className="mt-1 text-xs text-gray-500">{variant.reason}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700">Skor {formatNumber(variant.score)}</span>
                      {variant.selected ? <span className="rounded-full bg-success-50 px-3 py-1 text-xs font-semibold text-success-700">Terpilih</span> : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Variasi judul belum tersedia untuk job ini.</p>
            )}
          </div>
          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="ta-label text-brand-600">Skor potensi viral</p>
            <h4 className="mt-2 text-3xl font-bold text-gray-900">{viralScore !== null && viralScore !== undefined ? formatNumber(viralScore) : "Not set"}</h4>
            <p className="mt-2 text-sm text-gray-500">
              {viralAnalysis?.created_at ? `Dihitung pada ${viralAnalysis.created_at}` : "Analisis lokal menunggu data lengkap."}
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="ta-label text-gray-500">Alasan</p>
                <div className="mt-2 space-y-2">
                  {viralAnalysis?.reasons?.length ? (
                    viralAnalysis.reasons.map((reason) => (
                      <div key={reason} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
                        {reason}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Belum ada alasan analisis yang disimpan.</p>
                  )}
                </div>
              </div>
              <div>
                <p className="ta-label text-gray-500">Saran perbaikan</p>
                <div className="mt-2 space-y-2">
                  {viralAnalysis?.recommendations?.length ? (
                    viralAnalysis.recommendations.map((recommendation) => (
                      <div key={recommendation} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
                        {recommendation}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Tidak ada saran mendesak saat ini.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="ta-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
          <p className="ta-label text-brand-600">Tahap produksi</p>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">Dari sumber ke hasil</h3>
            </div>
            <PublishPill status={publishState.youtube.status} />
          </div>
          <div className="mt-5 space-y-3">
            {timeline.stages.map((stage) => (
              <div key={stage.key} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <strong className="text-sm text-gray-900">{stage.label}</strong>
                    <p className="mt-1 text-xs text-gray-500">
                      Percobaan: {stage.attempt_count} {stage.duration_seconds !== null && stage.duration_seconds !== undefined ? `- ${formatSeconds(stage.duration_seconds)}` : ""}
                    </p>
                  </div>
                  <StageBadge state={stage.state} />
                </div>
                <div className="mt-3 h-2 rounded-full bg-white">
                  <div
                    className={`h-2 rounded-full ${
                      stage.state === "done"
                        ? "bg-success-500"
                        : stage.state === "current"
                          ? "bg-brand-500"
                          : stage.state === "failed"
                            ? "bg-error-500"
                            : "bg-gray-300"
                    }`}
                    style={{ width: stage.state === "done" ? "100%" : stage.state === "current" ? "65%" : stage.state === "failed" ? "100%" : "0%" }}
                  />
                </div>
                {stage.error_message ? <p className="mt-3 text-sm text-error-700">{stage.error_message}</p> : null}
              </div>
            ))}
          </div>
        </div>

        <PublishButtonGroup jobId={job.id} uploadGuard={overview.upload_guard} publishState={publishState} />
      </section>

      <section className="mt-6">
        <UploadApprovalPanel items={[publishQueueItem]} uploadGuard={overview.upload_guard} title="Butuh persetujuan" />
      </section>

      <section className="mt-6">
        <JobRealtimePanel initial={detail} syncSettings={syncSettings} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="ta-panel p-5">
          <p className="ta-label text-brand-600">Evidence</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Input and output</h3>
          <div className="mt-4 space-y-3">
            <DetailRow label="Publish window" value={job.publish_at} />
            <DetailRow label="Channel" value={job.channel_id} />
            <DetailRow label="Niche" value={job.niche} />
            <DetailRow label="Manifest status" value={detail.manifest_status} />
            <DetailRow label="Render outputs" value={String(renderManifest.length)} />
            <DetailRow label="Latest upload" value={publishState.latest_upload?.status || "Pending"} />
          </div>
          <div className="mt-4 space-y-2">
            {Object.entries(publishState.render_sizes).length ? (
              Object.entries(publishState.render_sizes).map(([platform, size]) => (
                <DetailRow key={platform} label={`${platform} size`} value={formatBytes(size)} />
              ))
            ) : (
              <p className="mt-2 text-sm text-gray-500">No render sizes recorded yet.</p>
            )}
          </div>
        </div>

        <div className="ta-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="ta-label text-brand-600">File pendukung</p>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">Transcript dan plan</h3>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <FileCard title="Transcript" file={transcriptFile} href={transcriptFile ? engineJobFileDownloadUrl(job.id, "transcript") : null} />
            <FileCard title="AI plan" file={planFile} href={planFile ? engineJobFileDownloadUrl(job.id, "plan") : null} />
          </div>
        </div>

        <div className="ta-panel p-5">
          <p className="ta-label text-brand-600">Lihat hasil video</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">File final siap review</h3>
          <div className="mt-4 space-y-4">
            {finalResult ? (
              finalResult.available && previewUrl && previewArtifact ? (
                <>
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black">
                    <video className="aspect-[9/16] w-full bg-black" controls playsInline preload="metadata" src={previewUrl} />
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="ta-label text-brand-600">Final video</p>
                        <h4 className="mt-1 text-base font-semibold text-gray-900">{previewArtifact.file_name}</h4>
                      </div>
                      {downloadUrl && previewArtifact.artifact_id ? (
                        <DownloadLink href={downloadUrl} label="Download" />
                      ) : null}
                    </div>
                    <div className="mt-4 space-y-3">
                      <ResultMetaRow label="File name" value={previewArtifact.file_name} />
                      <ResultMetaRow label="Size" value={formatBytes(previewArtifact.size_bytes)} />
                      <ResultMetaRow
                        label="Resolution"
                        value={previewArtifact.width && previewArtifact.height ? `${formatDimension(previewArtifact.width)} × ${formatDimension(previewArtifact.height)}` : "Not set"}
                      />
                      <ResultMetaRow label="Duration" value={formatDuration(previewArtifact.duration_seconds)} />
                      <ResultMetaRow label="Created" value={previewArtifact.created_at || "Not set"} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
                  <strong className="block text-base text-gray-900">{finalResult.message}</strong>
                  <p className="mt-2">
                    {finalResult.status === "failed"
                      ? "Video gagal dibuat. Lihat ringkasan error dan activity feed di atas."
                      : finalResult.status === "rendered" || finalResult.status === "uploaded"
                        ? "File hasil tidak ditemukan. Output mungkin sudah dibersihkan atau belum tersedia di folder output."
                        : "Video masih diproses. Preview akan muncul setelah render selesai."}
                  </p>
                </div>
              )
            ) : (
              <EmptyState label={finalResultMessage} />
            )}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="ta-label text-brand-600">Final artifact list</p>
              <div className="mt-4 space-y-3">
                {finalArtifacts.map((artifact, index) => (
                  <div key={`${artifact.kind}-${index}`} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <strong className="text-sm text-gray-900">{artifact.platform || artifact.kind}</strong>
                        <p className="mt-1 text-xs text-gray-500">{artifact.file_name}</p>
                      </div>
                      {artifact.artifact_id ? (
                        <DownloadLink href={engineArtifactDownloadUrl(job.id, artifact.artifact_id)} label="Download" />
                      ) : null}
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                      <ResultMetaRow label="Size" value={formatBytes(artifact.size_bytes)} />
                      <ResultMetaRow
                        label="Resolution"
                        value={artifact.width && artifact.height ? `${formatDimension(artifact.width)} × ${formatDimension(artifact.height)}` : "Not set"}
                      />
                      <ResultMetaRow label="Duration" value={formatDuration(artifact.duration_seconds)} />
                      <ResultMetaRow label="Created" value={artifact.created_at || "Not set"} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <JobControlPanel job={job} uploadGuard={overview.upload_guard} canOperate={canOperate} />
        <div className="ta-panel p-5">
          <p className="ta-label text-brand-600">Status upload</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Status terkini</h3>
          <div className="mt-4 space-y-3">
            <DetailRow label="YouTube" value={publishState.youtube.status} />
            <DetailRow label="TikTok" value={publishState.tiktok.status} />
            <DetailRow label="TikTok gate" value={tiktokSurfaceState} />
            <DetailRow label="TikTok mode" value={publishState.tiktok.publish_mode || "Not set"} />
            <DetailRow label="TikTok transfer" value={publishState.tiktok.transfer_method || "Not set"} />
            <DetailRow label="TikTok publish ID" value={publishState.tiktok.publish_id || "Pending"} />
            <DetailRow label="TikTok post ID" value={publishState.tiktok.post_id || "Pending"} />
            <DetailRow label="TikTok reason" value={publishState.tiktok.status_reason || publishState.tiktok.message} />
            <DetailRow label="Ready to push" value={publishState.ready_to_push ? "Yes" : "No"} />
            <DetailRow label="Output size" value={outputSize} />
            <DetailRow label="Queue count" value={formatNumber(metrics.queue_count)} />
            <DetailRow label="Timeline source" value={timeline.generated_at} />
          </div>
          {publishState.youtube.youtube_url ? (
            <a className="mt-4 inline-flex text-sm font-medium text-brand-600 hover:text-brand-700" href={publishState.youtube.youtube_url} target="_blank" rel="noreferrer">
              Open published YouTube item
            </a>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
