import Link from "next/link";
import { AppShell } from "../../../components/app-shell";
import { JobControlPanel } from "../../../components/job-control-panel";
import { JobRealtimePanel } from "../../../components/job-realtime-panel";
import { JobReviewPanel } from "../../../components/job-review-panel";
import { PageHeader } from "../../../components/page-header";
import { hasDashboardRole, requireDashboardSession } from "../../../lib/dashboard-auth";
import { businessUploadModeLabel, channelProfileLabel } from "../../../lib/business-copy";
import { formatStatus, formatTechnicalValue } from "../../../lib/localization";
import {
  engineBrowserUrl,
  engineJobPreviewUrl,
  getJobSummary,
  getJobTechnical,
  getOverview,
} from "../../../lib/engine-api";
import type { JobResultPayload, JobTechnicalPayload } from "../../../lib/engine-types";
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
  const showTechnical = typeof searchParams.technical === "string" ? searchParams.technical === "1" : Array.isArray(searchParams.technical) ? searchParams.technical[0] === "1" : false;
  const [summary, overview, technical] = await Promise.all([
    getJobSummary(jobId, syncSettings.stateView),
    getOverview(syncSettings.stateView),
    showTechnical ? getJobTechnical(jobId, syncSettings.stateView).catch(() => null) : Promise.resolve(null),
  ]);
  const canOperate = hasDashboardRole(session, "operator");
  const publishState = summary.publish_state;
  const reviewSummary = summary.review_summary || publishState.review_summary;
  const previewUrl = engineJobPreviewUrl(jobId, summary.preview?.preview_url || null);
  const previewArtifact = summary.preview?.preview_artifact || null;
  const downloadUrl = summary.preview?.download_url ? engineBrowserUrl(summary.preview.download_url) : null;
  const previewReady = Boolean(summary.preview?.available && previewUrl && previewArtifact);
  const technicalHref = showTechnical ? `/jobs/${jobId}#detail-teknis` : `/jobs/${jobId}?technical=1#detail-teknis`;

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
          { href: `/jobs/${summary.job.id}`, label: "Detail Video" },
        ]}
        description="Halaman ini menempatkan preview, status utama, metadata final, copyright, dan label AI di depan. Detail teknis hanya dimuat saat diminta."
        eyebrow="Video Detail"
        title="Review video"
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Status Utama</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`ta-status ${summary.next_action.tone === "error" ? "bg-error-50 text-error-700" : "bg-warning-50 text-warning-700"}`}>{summary.next_action.label}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Preview Video</p>
          <strong className="mt-2 block text-gray-900">{previewReady ? "Tersedia" : "Belum tersedia"}</strong>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Langkah Berikutnya</p>
          <strong className="mt-2 block text-gray-900">{summary.next_action.label}</strong>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Mode Upload</p>
          <strong className="mt-2 block text-gray-900">{businessUploadModeLabel(reviewSummary?.selected_upload_mode || "private_validation")}</strong>
        </div>
      </section>
      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
        <p className="ta-label text-brand-600">Alasan / langkah berikutnya</p>
        <p className="mt-2">{summary.next_action.reason}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100" href="#copyright-detail">
            Cek Detail Copyright
          </Link>
          <Link className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href="#detail-teknis">
            Lihat Detail Teknis
          </Link>
          <Link className="rounded-lg border border-brand-100 bg-brand-25 px-3 py-2 text-sm font-semibold text-brand-700 hover:border-brand-200" href={summary.next_action.targetLink}>
            {summary.next_action.label}
          </Link>
        </div>
      </div>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="ta-panel p-5">
            <p className="ta-label text-brand-600">Preview Video</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Hasil video terbaru</h3>
            <div className="mt-4">
              {summary.preview ? (
                summary.preview.available && previewUrl && previewArtifact ? (
                  <ResultCard artifact={previewArtifact} previewUrl={previewUrl} downloadUrl={downloadUrl} />
                ) : summary.preview.message ? (
                  <EmptyState label={summary.preview.message || "Video masih diproses."} />
                ) : (
                  <EmptyState label="Preview belum tersedia." />
                )
              ) : (
                <EmptyState label="Preview belum tersedia." />
              )}
            </div>
          </div>

          <div id="review">
            <JobReviewPanel
              canOperate={canOperate}
              job={summary.job}
              previewReady={previewReady}
              previewUrl={previewUrl}
              publishState={publishState}
              reviewSummary={reviewSummary || null}
              technical={technical as JobTechnicalPayload | null}
              technicalHref={technicalHref}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="ta-panel p-5">
            <p className="ta-label text-brand-600">Ringkas Video</p>
            <div className="mt-4 space-y-3">
              <DetailRow label="Nomor video" value={`#${String(summary.job.id)}`} />
              <DetailRow label="Channel" value={channelProfileLabel({ id: summary.job.channel_id, niche: summary.job.niche })} />
              <DetailRow label="Kategori konten" value={formatTechnicalValue(summary.job.niche)} />
              <DetailRow label="Target Waktu" value={summary.job.publish_at} />
              <DetailRow label="Status proses" value={formatStatus(summary.current_stage || summary.job.status)} />
              <DetailRow label="Progres" value={`${Number(summary.progress_percent || 0).toFixed(0)}%`} />
              <DetailRow label="Ringkasan hitung" value={`Percobaan ${summary.attempt_count} / Hasil ${summary.artifact_count} / Upload ${summary.upload_count}`} />
              <DetailRow label="Pesan terakhir" value={summary.last_error || "Tidak ada"} />
            </div>
          </div>
          <JobControlPanel job={summary.job} uploadGuard={overview.upload_guard} canOperate={canOperate} />
          <JobRealtimePanel initial={summary} syncSettings={syncSettings} />
        </div>
      </section>
    </AppShell>
  );
}
