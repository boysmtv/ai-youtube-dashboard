import Link from "next/link";
import { Suspense } from "react";
import { AppShell } from "../../../components/app-shell";
import { JobControlPanel } from "../../../components/job-control-panel";
import { JobRealtimePanel } from "../../../components/job-realtime-panel";
import { JobReviewPanel } from "../../../components/job-review-panel";
import { PageHeader } from "../../../components/page-header";
import { hasDashboardRole, requireDashboardSession } from "../../../lib/dashboard-auth";
import { operatorDecisionForJob } from "../../../lib/operator-workflow";
import { businessUploadModeLabel, channelProfileLabel } from "../../../lib/business-copy";
import { formatStatus, formatTechnicalValue } from "../../../lib/localization";
import {
  engineArtifactDownloadUrl,
  getJobDetail,
  engineJobPreviewUrl,
  getOverview,
} from "../../../lib/engine-api";
import type { JobDetailPayload, JobResultArtifact, JobTechnicalPayload, PublishStatePayload } from "../../../lib/engine-types";
import { parseEngineSyncSettings } from "../../../lib/sync-settings";

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

function ResultCard({
  artifact,
  previewUrl,
  downloadUrl,
}: Readonly<{
  artifact: JobResultArtifact | null;
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

function JobDetailSkeleton() {
  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-6">
        <div className="ta-panel p-5">
          <p className="ta-label text-brand-600">Preview Video</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Hasil video terbaru</h3>
          <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">Memuat preview dan ringkasan detail...</div>
        </div>
        <div className="ta-panel p-5">
          <p className="ta-label text-brand-600">Review & Upload</p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">Decision center video</h3>
          <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">Memuat metadata final dan status sistem...</div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="ta-panel p-5">
          <p className="ta-label text-brand-600">Ringkas Video</p>
          <div className="mt-4 space-y-3">
            <div className="h-5 w-2/3 rounded bg-gray-100" />
            <div className="h-5 w-1/2 rounded bg-gray-100" />
            <div className="h-5 w-3/4 rounded bg-gray-100" />
            <div className="h-5 w-5/6 rounded bg-gray-100" />
          </div>
        </div>
        <div className="ta-panel p-5">
          <div className="h-48 rounded-2xl border border-dashed border-gray-200 bg-gray-50" />
        </div>
      </div>
    </section>
  );
}

export default function JobDetailPage({
  params,
  searchParams,
}: Readonly<{ params: { id: string }; searchParams: Record<string, string | string[] | undefined> }>) {
  const session = requireDashboardSession(`/jobs/${params.id}`);
  const syncSettings = parseEngineSyncSettings(searchParams);
  const jobId = Number(params.id);
  const showTechnical = typeof searchParams.technical === "string" ? searchParams.technical === "1" : Array.isArray(searchParams.technical) ? searchParams.technical[0] === "1" : false;
  const canOperate = hasDashboardRole(session, "operator");

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
          { href: `/jobs/${params.id}`, label: "Detail Video" },
        ]}
        description="Halaman ini menempatkan preview, status utama, metadata final, label AI, dan status sistem di depan. Detail teknis hanya dimuat saat diminta."
        eyebrow="Video Detail"
        title="Review video"
      />
      <Suspense fallback={<JobDetailSkeleton />}>
        <JobDetailContent jobId={jobId} canOperate={canOperate} showTechnical={showTechnical} syncSettings={syncSettings} />
      </Suspense>
    </AppShell>
  );
}

async function JobDetailContent({
  jobId,
  canOperate,
  showTechnical,
  syncSettings,
}: Readonly<{
  jobId: number;
  canOperate: boolean;
  showTechnical: boolean;
  syncSettings: ReturnType<typeof parseEngineSyncSettings>;
}>) {
  const [detail, overview] = await Promise.all([getJobDetail(jobId, syncSettings.stateView), getOverview(syncSettings.stateView)]);
  const reviewSummary = detail.review_summary || null;
  const previewArtifact = buildPreviewArtifact(detail);
  const previewUrl = previewArtifact ? engineJobPreviewUrl(jobId, `/api/jobs/${jobId}/preview`) : null;
  const downloadUrl = previewArtifact?.artifact_id ? engineArtifactDownloadUrl(jobId, previewArtifact.artifact_id) : null;
  const previewReady = Boolean(previewArtifact && previewUrl);
  const publishState = buildPublishState(detail);
  const technical = showTechnical ? (detail as unknown as JobTechnicalPayload) : null;
  const nextAction = operatorDecisionForJob(detail.job, reviewSummary, publishState as PublishStatePayload);
  const technicalHref = showTechnical ? `/jobs/${jobId}#detail-teknis` : `/jobs/${jobId}?technical=1#detail-teknis`;

  return (
    <>
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Status Utama</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`ta-status ${nextAction.tone === "error" ? "bg-error-50 text-error-700" : "bg-warning-50 text-warning-700"}`}>{nextAction.label}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Preview Video</p>
          <strong className="mt-2 block text-gray-900">{previewReady ? "Tersedia" : "Belum tersedia"}</strong>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Langkah Berikutnya</p>
          <strong className="mt-2 block text-gray-900">{nextAction.nextAction}</strong>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Mode Upload</p>
          <strong className="mt-2 block text-gray-900">{businessUploadModeLabel(reviewSummary?.selected_upload_mode || "private_validation")}</strong>
        </div>
      </section>
      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
        <p className="ta-label text-brand-600">Alasan / langkah berikutnya</p>
        <p className="mt-2">{nextAction.explanation}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100" href="#review">
            Cek Detail Sistem
          </Link>
          <Link className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href="#detail-teknis">
            Lihat Detail Teknis
          </Link>
          <Link className="rounded-lg border border-brand-100 bg-brand-25 px-3 py-2 text-sm font-semibold text-brand-700 hover:border-brand-200" href={nextAction.targetLink}>
            {nextAction.nextAction}
          </Link>
        </div>
      </div>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="ta-panel p-5">
            <p className="ta-label text-brand-600">Preview Video</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Hasil video terbaru</h3>
            <div className="mt-4">
              {previewReady && previewUrl && previewArtifact ? <ResultCard artifact={previewArtifact} previewUrl={previewUrl} downloadUrl={downloadUrl} /> : <EmptyState label="Preview belum tersedia. Buka detail teknis jika perlu menelusuri artefak render." />}
            </div>
          </div>

          <div id="review">
            <JobReviewPanel
              canOperate={canOperate}
              job={detail.job}
              previewReady={previewReady}
              previewUrl={previewUrl}
              publishState={publishState}
              reviewSummary={reviewSummary || null}
              technical={technical}
              technicalHref={technicalHref}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="ta-panel p-5">
            <p className="ta-label text-brand-600">Ringkas Video</p>
            <div className="mt-4 space-y-3">
              <DetailRow label="Nomor video" value={`#${String(detail.job.id)}`} />
              <DetailRow label="Channel" value={channelProfileLabel({ id: detail.job.channel_id, niche: detail.job.niche })} />
              <DetailRow label="Kategori konten" value={formatTechnicalValue(detail.job.niche)} />
              <DetailRow label="Target Waktu" value={detail.job.publish_at} />
              <DetailRow label="Status proses" value={formatStatus(detail.current_stage || detail.job.status)} />
              <DetailRow label="Progres" value={`${Number(detail.progress_percent || 0).toFixed(0)}%`} />
              <DetailRow label="Ringkasan hitung" value={`Percobaan ${detail.attempts.length} / Hasil ${detail.artifacts.length} / Upload ${detail.uploads.length}`} />
              <DetailRow label="Pesan terakhir" value={detail.last_error || "Tidak ada"} />
            </div>
          </div>
          <JobControlPanel job={detail.job} uploadGuard={overview.upload_guard} canOperate={canOperate} />
          <JobRealtimePanel initial={detail} syncSettings={syncSettings} />
        </div>
      </section>
    </>
  );
}

function buildPreviewArtifact(detail: JobDetailPayload): JobResultArtifact | null {
  const candidate = detail.artifacts.find((item) => looksLikePreviewArtifact(item.path));
  if (!candidate) {
    return null;
  }
  const fileName = candidate.path.split(/[/\\\\]/).pop() || candidate.path;
  return {
    artifact_id: candidate.id,
    job_id: candidate.job_id,
    platform: candidate.kind.startsWith("render:") ? candidate.kind.split(":", 2)[1] || null : null,
    kind: candidate.kind,
    file_name: fileName,
    path: candidate.path,
    size_bytes: candidate.size_bytes ?? null,
    width: null,
    height: null,
    duration_seconds: null,
    codec_video: null,
    codec_audio: null,
    created_at: candidate.created_at,
    exists: candidate.exists !== false,
  };
}

function buildPublishState(detail: JobDetailPayload): PublishStatePayload {
  const latestUpload = detail.latest_upload || (detail.uploads.length ? detail.uploads[0] : null);
  const approvalsByPlatform: PublishStatePayload["approvals"]["by_platform"] = {};
  for (const item of detail.upload_approvals) {
    approvalsByPlatform[item.platform] = { ...item, is_active: Boolean(item.is_active ?? true) };
  }
  return {
    generated_at: detail.job.updated_at || detail.job.publish_at,
    job_id: detail.job.id,
    status: detail.job.status,
    ready_to_push: Boolean(detail.production_ready ?? detail.review_summary?.production_ready ?? false),
    approvals: {
      items: detail.upload_approvals,
      by_platform: approvalsByPlatform,
    },
    render_sizes: {},
    youtube: {
      available: Boolean(latestUpload),
      status: latestUpload?.status || detail.job.status,
      privacy_status: latestUpload?.privacy_status || "unknown",
      youtube_video_id: latestUpload?.youtube_video_id || null,
      youtube_url: latestUpload?.youtube_url || null,
      publish_at: latestUpload?.publish_at || null,
      publish_mode: detail.review_summary?.selected_upload_mode || null,
      error_message: latestUpload?.error_message || null,
      manual_push_available: Boolean(detail.review_summary?.production_ready),
    },
    tiktok: {
      available: false,
      status: "not_available",
      manual_push_available: false,
      message: "TikTok publish tidak dimuat pada ringkasan cepat.",
      publish_mode: null,
      transfer_method: null,
      publish_id: null,
      post_id: null,
      status_reason: null,
      error_message: null,
    },
    actions: [],
    latest_upload: latestUpload,
    latest_uploads: detail.uploads.slice(0, 5),
    manifest_status: detail.manifest_status,
    manifest_error: detail.manifest_error,
    review_summary: detail.review_summary || undefined,
    system_compliance_status: detail.system_compliance_status,
    system_compliance_label: detail.system_compliance_label,
    system_compliance_reason: detail.system_compliance_reason,
    system_compliance_next_action: detail.system_compliance_next_action,
    auto_copyright_approved: detail.auto_copyright_approved,
    asset_policy_passed: detail.asset_policy_passed,
    production_requirements_passed: detail.production_requirements_passed,
    operator_action_required_type: detail.operator_action_required_type,
    operator_alerts: detail.operator_alerts,
    operator_alert_count: detail.operator_alert_count,
    production_ready: detail.production_ready,
    private_test_ready: detail.private_test_ready,
    upload_ready: detail.upload_ready,
    system_health_summary: detail.system_health_summary || null,
  };
}

function looksLikePreviewArtifact(path: string) {
  const value = path.toLowerCase();
  return value.endsWith(".mp4") || value.endsWith(".mov") || value.endsWith(".webm") || value.includes("/render/");
}
