import Link from "next/link";
import { AppShell } from "../../../components/app-shell";
import { GuidedWorkflow } from "../../../components/guided-workflow";
import { JobControlPanel } from "../../../components/job-control-panel";
import { JobRealtimePanel } from "../../../components/job-realtime-panel";
import { JobReviewPanel } from "../../../components/job-review-panel";
import { PageHeader } from "../../../components/page-header";
import { StatusBadge } from "../../../components/status-badge";
import { hasDashboardRole, requireDashboardSession } from "../../../lib/dashboard-auth";
import {
  engineJobFileDownloadUrl,
  getJobDetail,
  getJobFile,
  getJobMetrics,
  getJobPublishState,
  getJobResult,
  getJobTimeline,
  getOverview,
} from "../../../lib/engine-api";
import type { JobFilePayload, JobResultPayload, JobTimelinePayload, PublishStatePayload } from "../../../lib/engine-types";
import { parseEngineSyncSettings } from "../../../lib/sync-settings";
import { buildJobWorkflowSteps, operatorDecisionForJob } from "../../../lib/operator-workflow";

function formatBytes(value?: number | null) {
  if (!value || value <= 0) return "Belum ada";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDimension(value?: number | null) {
  if (!value || value <= 0) return "Belum ada";
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDuration(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "Belum ada";
  if (value < 60) return `${value.toFixed(1)}s`;
  return `${Math.floor(value / 60)}m ${Math.round(value % 60)}s`;
}

function EmptyState({ label }: Readonly<{ label: string }>) {
  return <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">{label}</div>;
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
          <p className="ta-label text-brand-600">File proses</p>
          <h4 className="mt-1 text-base font-semibold text-gray-900">{title}</h4>
        </div>
        {file && href ? <DownloadLink href={href} label="Download" /> : null}
      </div>
      <div className="mt-4 space-y-3">
        {file ? (
          <>
            <DetailRow label="Path" value={file.path} />
            <DetailRow label="Status" value={file.exists ? "Ada" : "Belum ada"} />
          </>
        ) : (
          <EmptyState label={`${title} belum tersedia.`} />
        )}
      </div>
    </div>
  );
}

function ResultCard({
  artifact,
  previewUrl,
  downloadUrl,
}: Readonly<{
  artifact: JobResultPayload["preview_artifact"] | null;
  previewUrl: string | null;
  downloadUrl: string | null;
}>) {
  if (!artifact) {
    return <EmptyState label="Preview video belum tersedia." />;
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="ta-label text-brand-600">Preview Video</p>
          <h4 className="mt-1 text-base font-semibold text-gray-900">{artifact.file_name}</h4>
        </div>
        {downloadUrl && artifact.artifact_id ? <DownloadLink href={downloadUrl} label="Download" /> : null}
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-black">
        <video className="aspect-[9/16] w-full bg-black" controls playsInline preload="metadata" src={previewUrl || undefined} />
      </div>
      <div className="mt-4 space-y-3">
        <DetailRow label="File" value={artifact.file_name} />
        <DetailRow label="Ukuran" value={formatBytes(artifact.size_bytes)} />
        <DetailRow label="Resolusi" value={artifact.width && artifact.height ? `${formatDimension(artifact.width)} x ${formatDimension(artifact.height)}` : "Belum ada"} />
        <DetailRow label="Durasi" value={formatDuration(artifact.duration_seconds)} />
        <DetailRow label="Dibuat" value={artifact.created_at || "Belum ada"} />
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
  const canOperate = hasDashboardRole(session, "operator");
  const finalResult = result as JobResultPayload | null;
  const previewArtifact = finalResult?.preview_artifact || null;
  const previewUrl = finalResult?.preview_url || null;
  const downloadUrl = finalResult?.download_url || null;
  const reviewSummary = detail.review_summary || publishState.review_summary;
  const previewReady = Boolean(finalResult?.available && previewUrl && previewArtifact);
  const decision = operatorDecisionForJob(detail.job, reviewSummary, publishState);
  const workflowSteps = buildJobWorkflowSteps(detail.job, reviewSummary, publishState);

  const renderArtifacts = Array.isArray(detail.manifest?.renders) ? detail.manifest?.renders : [];

  return (
    <AppShell>
      <PageHeader
        actions={[
          { href: "/queue", label: "Kembali ke Antrian", tone: "primary" },
          { href: "/publish", label: "Review & Upload", tone: "secondary" },
        ]}
        breadcrumbs={[
          { href: "/", label: "Dashboard" },
          { href: "/queue", label: "Produksi Video" },
          { href: `/jobs/${detail.job.id}`, label: "Detail Video" },
        ]}
        description="Halaman ini menempatkan preview, status utama, title/caption/hashtag, copyright, dan label AI di depan. Detail teknis tetap tersedia di bagian lanjutan."
        eyebrow="Video Detail"
        title={`Review video #${detail.job.id}`}
      />

      <GuidedWorkflow
        eyebrow="Step 3-6 of 6"
        title="Review & Upload"
        description="Ikuti urutan aman: review hasil, cek copyright, lakukan private test, lalu pastikan hanya konten yang lolos rights gate yang menuju production."
        steps={workflowSteps}
        summaryLabel="Status utama"
        summaryAction={decision.label}
        summaryLink={decision.targetLink}
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Status produksi</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={detail.job.status} />
            <span className={`ta-status ${decision.tone === "good" ? "bg-success-50 text-success-700" : decision.tone === "error" ? "bg-error-50 text-error-700" : "bg-warning-50 text-warning-700"}`}>{decision.label}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Preview Video</p>
          <strong className="mt-2 block text-gray-900">{previewReady ? "Tersedia" : "Belum tersedia"}</strong>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Siap Upload Private?</p>
          <strong className={`mt-2 block ${(reviewSummary?.private_validation_allowed ?? reviewSummary?.production_allowed) ? "text-success-700" : "text-warning-700"}`}>
            {(reviewSummary?.private_validation_allowed ?? reviewSummary?.production_allowed) ? "Ya" : "Tidak"}
          </strong>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Siap Production?</p>
          <strong className={`mt-2 block ${reviewSummary?.production_allowed ? "text-success-700" : "text-warning-700"}`}>{reviewSummary?.production_allowed ? "Ya" : "Tidak"}</strong>
        </div>
      </section>
      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
        <p className="ta-label text-brand-600">Alasan / Next action</p>
        <p className="mt-2">{decision.explanation}</p>
        {decision.blockerReason ? <p className="mt-3 rounded-xl border border-warning-200 bg-warning-50 px-3 py-2 text-sm text-warning-900">{decision.blockerReason}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100" href="#copyright-detail">
            Cek Detail Copyright
          </Link>
          <Link className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href="#detail-teknis">
            Lihat Detail Teknis
          </Link>
          <Link className="rounded-lg border border-brand-100 bg-brand-25 px-3 py-2 text-sm font-semibold text-brand-700 hover:border-brand-200" href={decision.targetLink}>
            {decision.nextAction}
          </Link>
        </div>
      </div>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="ta-panel p-5">
            <p className="ta-label text-brand-600">Preview Video</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Hasil video terbaru</h3>
            <div className="mt-4">
              {finalResult ? (
                finalResult.available && previewUrl && previewArtifact ? (
                  <ResultCard artifact={previewArtifact} previewUrl={previewUrl} downloadUrl={downloadUrl} />
                ) : (
                  <EmptyState label={finalResult.message || "Video masih diproses."} />
                )
              ) : (
                <EmptyState label="Preview belum tersedia." />
              )}
            </div>
          </div>

          <div id="review">
            <JobReviewPanel jobId={detail.job.id} detail={detail} publishState={publishState} canOperate={canOperate} previewReady={previewReady} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="ta-panel p-5">
            <p className="ta-label text-brand-600">Ringkas Video</p>
            <div className="mt-4 space-y-3">
              <DetailRow label="ID Video" value={String(detail.job.id)} />
              <DetailRow label="Channel" value={detail.job.channel_id} />
              <DetailRow label="Topik" value={detail.job.niche} />
              <DetailRow label="Target Waktu" value={detail.job.publish_at} />
              <DetailRow label="Status proses" value={detail.current_stage || detail.job.status} />
              <DetailRow label="Progres" value={`${Number(detail.progress_percent || 0).toFixed(0)}%`} />
              <DetailRow label="Queue" value={String(metrics.queue_count)} />
              <DetailRow label="Output" value={formatBytes(metrics.output_size_bytes)} />
            </div>
          </div>

          <details className="ta-panel p-5" id="detail-teknis">
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="ta-label text-brand-600">Detail Teknis</p>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">Timeline, file, dan runtime</h3>
                </div>
                <span className="ta-status bg-gray-100 text-gray-700">Tutup / buka</span>
              </div>
            </summary>
            <div className="mt-5 space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="ta-label text-brand-600">Tahap produksi</p>
                <div className="mt-4 space-y-3">
                  {timeline.stages.map((stage) => (
                    <div key={stage.key} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <strong className="text-sm text-gray-900">{stage.label}</strong>
                          <p className="mt-1 text-xs text-gray-500">
                            Percobaan: {stage.attempt_count} {stage.duration_seconds !== null && stage.duration_seconds !== undefined ? `- ${formatDuration(stage.duration_seconds)}` : ""}
                          </p>
                        </div>
                        <StatusBadge status={stage.state} />
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-gray-100">
                        <div
                          className={`h-2 rounded-full ${stage.state === "done" ? "bg-success-500" : stage.state === "current" ? "bg-brand-500" : stage.state === "failed" ? "bg-error-500" : "bg-gray-300"}`}
                          style={{ width: stage.state === "done" ? "100%" : stage.state === "current" ? "65%" : stage.state === "failed" ? "100%" : "0%" }}
                        />
                      </div>
                      {stage.error_message ? <p className="mt-3 text-sm text-error-700">{stage.error_message}</p> : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <FileCard title="Transcript" file={transcriptFile} href={transcriptFile ? engineJobFileDownloadUrl(detail.job.id, "transcript") : null} />
                <FileCard title="Plan AI" file={planFile} href={planFile ? engineJobFileDownloadUrl(detail.job.id, "plan") : null} />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="ta-label text-brand-600">Manifest</p>
                  <div className="mt-4 space-y-3">
                    <DetailRow label="Manifest status" value={detail.manifest_status} />
                    <DetailRow label="Render outputs" value={String(renderArtifacts.length)} />
                    <DetailRow label="Latest upload" value={publishState.latest_upload?.status || "Pending"} />
                    <DetailRow label="Timeline source" value={timeline.generated_at} />
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="ta-label text-brand-600">Runtime</p>
                  <div className="mt-4 space-y-3">
                    <DetailRow label="Job state" value={detail.job.status} />
                    <DetailRow label="Publish ready" value={publishState.ready_to_push ? "Ya" : "Belum"} />
                    <DetailRow label="Upload private" value={publishState.youtube.privacy_status || "private"} />
                    <DetailRow label="Last error" value={detail.last_error || timeline.last_error || "Tidak ada"} />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <JobControlPanel job={detail.job} uploadGuard={overview.upload_guard} canOperate={canOperate} />
                <JobRealtimePanel initial={detail} syncSettings={syncSettings} />
              </div>
            </div>
          </details>
        </div>
      </section>
    </AppShell>
  );
}
