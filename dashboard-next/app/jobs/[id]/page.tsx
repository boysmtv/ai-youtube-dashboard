import Link from "next/link";
import { AppShell } from "../../../components/app-shell";
import { ConfirmSubmitButton } from "../../../components/confirm-submit-button";
import { JobControlPanel } from "../../../components/job-control-panel";
import { StatusBadge } from "../../../components/status-badge";
import { hasDashboardRole, requireDashboardSession } from "../../../lib/dashboard-auth";
import {
  engineArtifactDownloadUrl,
  engineJobFileDownloadUrl,
  getJobDetail,
  getJobFile,
  getJobMetrics,
  getJobPublishState,
  getJobTimeline,
  getOverview,
} from "../../../lib/engine-api";
import type { JobFilePayload, JobTimelinePayload, PublishStatePayload } from "../../../lib/engine-types";
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
  return <span className={`ta-status font-mono ${tone}`}>{status}</span>;
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
          <p className="ta-label text-brand-600">Working file</p>
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
          <p className="ta-label text-brand-600">Publish center</p>
          <h4 className="mt-1 text-base font-semibold text-gray-900">Manual push</h4>
        </div>
        <PublishPill status={publishState.youtube.status} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="ta-label">YouTube</p>
              <strong className="mt-1 block text-gray-900">Active publish path</strong>
            </div>
            <PublishPill status={youtubeReady ? "ready" : publishState.youtube.status} />
          </div>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <DetailRow label="Ready to push" value={youtubeReady ? "Yes" : "No"} />
            <DetailRow label="Publish at" value={publishState.youtube.publish_at || "Not set"} />
            <DetailRow label="Video ID" value={publishState.youtube.youtube_video_id || "Pending"} />
            <DetailRow label="URL" value={publishState.youtube.youtube_url || "Pending"} />
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
              <ConfirmSubmitButton className="px-4 py-2 text-sm" message={`Push job #${jobId} to YouTube now?`} pendingText="Pushing...">
                Push to YouTube
              </ConfirmSubmitButton>
            </form>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
              YouTube push becomes available after the item reaches the rendered state.
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="ta-label">TikTok</p>
              <strong className="mt-1 block text-gray-900">Publish lane</strong>
            </div>
            <PublishPill status={tiktokSurfaceState} />
          </div>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <DetailRow label="Configured" value={publishState.tiktok.available ? "Yes" : "No"} />
            <DetailRow label="Ready to push" value={tiktokReady ? "Yes" : "No"} />
            <DetailRow label="State" value={publishState.tiktok.status} />
            <DetailRow label="Gate" value={tiktokSurfaceState} />
            <DetailRow label="Mode" value={publishState.tiktok.publish_mode || "Not set"} />
            <DetailRow label="Transfer" value={publishState.tiktok.transfer_method || "Not set"} />
            <DetailRow label="Publish ID" value={publishState.tiktok.publish_id || "Pending"} />
            <DetailRow label="Post ID" value={publishState.tiktok.post_id || "Pending"} />
            <DetailRow label="Reason" value={tiktokMessage} />
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
              <ConfirmSubmitButton className="px-4 py-2 text-sm" message={`Push job #${jobId} to TikTok now?`} pendingText="Pushing...">
                Push to TikTok
              </ConfirmSubmitButton>
            </form>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
              {publishState.tiktok.available ? "TikTok is configured but this item is not ready for manual push yet." : "TikTok is not configured for this channel."}
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
  const [detail, overview, transcriptFile, planFile, timeline, metrics, publishState] = await Promise.all([
    getJobDetail(jobId, syncSettings.stateView),
    getOverview(syncSettings.stateView),
    getJobFile(jobId, "transcript").catch(() => null),
    getJobFile(jobId, "plan").catch(() => null),
    getJobTimeline(jobId, syncSettings.stateView),
    getJobMetrics(jobId, syncSettings.stateView),
    getJobPublishState(jobId, syncSettings.stateView),
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
  const progress = `${timeline.progress_percent.toFixed(0)}%`;
  const currentStage = timeline.current_stage || job.status;
  const tiktokSurfaceState = deriveTikTokSurfaceState(publishState.tiktok);

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <Link className="ta-label text-brand-600 underline-offset-4 hover:underline" href="/jobs">
          Back to jobs
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-bold leading-none text-gray-900 lg:text-5xl">Job #{job.id}</h2>
            <p className="mt-3 max-w-3xl text-gray-500">Business view for source intake, stage progress, output size, and manual publish control.</p>
          </div>
          <StatusBadge status={job.status} />
        </div>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Current stage" value={currentStage} note={`Progress ${progress}`} tone={timeline.progress_percent >= 80 ? "good" : "warn"} />
        <MetricCard label="Source size" value={sourceSize} note={sourceManifest?.title ? String(sourceManifest.title) : "Source video"} />
        <MetricCard label="Output size" value={outputSize} note={`Ratio ${sizeRatio}`} tone={metrics.output_size_bytes > 0 ? "good" : "neutral"} />
        <MetricCard label="Download speed" value={outputSpeed} note={metrics.download_duration_seconds ? formatSeconds(metrics.download_duration_seconds) : "Not set"} />
        <MetricCard label="Queue" value={metrics.queue_count ? formatNumber(metrics.queue_count) : "0"} note={metrics.queue_position ? `Position ${metrics.queue_position}` : "Ready lane"} />
        <MetricCard label="Viral fit" value={metrics.viral_fit_score !== null ? formatNumber(metrics.viral_fit_score) : "Not set"} note={metrics.quality_score_overall !== null ? `Quality ${metrics.quality_score_overall}` : "Plan score"} tone={(metrics.viral_fit_score || 0) >= 80 ? "good" : "warn"} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="ta-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="ta-label text-brand-600">Pipeline snapshot</p>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">Source to publish</h3>
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
                      Attempts: {stage.attempt_count} {stage.duration_seconds !== null && stage.duration_seconds !== undefined ? `- ${formatSeconds(stage.duration_seconds)}` : ""}
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
              <p className="ta-label text-brand-600">Working files</p>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">Transcript and plan</h3>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <FileCard title="Transcript" file={transcriptFile} href={transcriptFile ? engineJobFileDownloadUrl(job.id, "transcript") : null} />
            <FileCard title="AI plan" file={planFile} href={planFile ? engineJobFileDownloadUrl(job.id, "plan") : null} />
          </div>
        </div>

        <div className="ta-panel p-5">
          <p className="ta-label text-brand-600">Rendered outputs</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Ready assets</h3>
          <div className="mt-4 space-y-3">
            {detail.artifacts.length ? (
              detail.artifacts.map((artifact) => (
                <div key={artifact.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-sm text-gray-900">{artifact.kind}</strong>
                    <DownloadLink href={engineArtifactDownloadUrl(job.id, artifact.id)} label="Download" />
                  </div>
                  <p className="mt-3 break-all text-sm text-gray-700">{artifact.path}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {formatBytes(artifact.size_bytes)} - {artifact.created_at}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState label="No rendered outputs yet." />
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <JobControlPanel job={job} uploadGuard={overview.upload_guard} canOperate={canOperate} />
        <div className="ta-panel p-5">
          <p className="ta-label text-brand-600">Publish status</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Current output state</h3>
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
