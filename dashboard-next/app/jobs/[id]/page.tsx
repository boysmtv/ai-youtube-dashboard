import Link from "next/link";
import { Suspense } from "react";
import { AppShell } from "../../../components/app-shell";
import { JobControlPanel } from "../../../components/job-control-panel";
import { JobRealtimePanel } from "../../../components/job-realtime-panel";
import { JobReviewPanel } from "../../../components/job-review-panel";
import { PageHeader } from "../../../components/page-header";
import { hasDashboardRole, requireDashboardSession } from "../../../lib/dashboard-auth";
import { businessUploadModeLabel, channelProfileLabel } from "../../../lib/business-copy";
import { engineJobPreviewUrl, getJobSummary, getOverview } from "../../../lib/engine-api";
import type { JobSummaryPayload } from "../../../lib/engine-types";
import { parseEngineSyncSettings } from "../../../lib/sync-settings";

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

function ResultCard({
  previewUrl,
  downloadUrl,
}: Readonly<{
  previewUrl: string | null;
  downloadUrl: string | null;
}>) {
  if (!previewUrl) {
    return <EmptyState label="Preview belum tersedia. Buka detail teknis jika perlu menelusuri artefak render." />;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="ta-label text-brand-600">Preview Video</p>
          <h4 className="mt-1 text-base font-semibold text-gray-900">Hasil video terbaru</h4>
        </div>
        {downloadUrl ? (
          <a className="ta-button-muted" href={downloadUrl} target="_blank" rel="noreferrer">
            Download
          </a>
        ) : null}
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-black">
        <video className="aspect-[9/16] w-full bg-black" controls playsInline preload="metadata" src={previewUrl} />
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
  const canOperate = hasDashboardRole(session, "operator");
  const stateView = syncSettings.stateView;

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
        <JobDetailContent jobId={jobId} canOperate={canOperate} stateView={stateView} syncSettings={syncSettings} />
      </Suspense>
    </AppShell>
  );
}

async function JobDetailContent({
  jobId,
  canOperate,
  stateView,
  syncSettings,
}: Readonly<{
  jobId: number;
  canOperate: boolean;
  stateView: "default" | "redis";
  syncSettings: ReturnType<typeof parseEngineSyncSettings>;
}>) {
  const [summary, overview] = await Promise.all([getJobSummary(jobId, stateView), getOverview(syncSettings.stateView)]);
  const reviewSummary = summary.review_summary || null;
  const previewUrl = summary.preview.preview_url ? engineJobPreviewUrl(jobId, summary.preview.preview_url) : null;
  const downloadUrl = summary.preview.download_url ? engineJobPreviewUrl(jobId, summary.preview.download_url) : null;
  const technicalHref = `/jobs/${jobId}?technical=1#detail-teknis`;
  const publishState = summary.publish_state;

  return (
    <>
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Status Utama</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`ta-status ${summary.next_action.tone === "error" ? "bg-error-50 text-error-700" : "bg-warning-50 text-warning-700"}`}>{summary.next_action.label}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Preview Video</p>
          <strong className="mt-2 block text-gray-900">{summary.preview.available ? "Tersedia" : "Belum tersedia"}</strong>
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
          <Link className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100" href="#review">
            Cek Detail Sistem
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
              {summary.preview.available ? <ResultCard previewUrl={previewUrl} downloadUrl={downloadUrl} /> : <EmptyState label="Preview belum tersedia. Buka detail teknis jika perlu menelusuri artefak render." />}
            </div>
          </div>

          <div id="review">
            <JobReviewPanel
              canOperate={canOperate}
              job={summary.job}
              previewReady={summary.preview.available}
              previewUrl={previewUrl}
              publishState={publishState}
              reviewSummary={reviewSummary}
              stateView={stateView}
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
              <DetailRow label="Kategori konten" value={summary.job.niche} />
              <DetailRow label="Target Waktu" value={summary.job.publish_at} />
              <DetailRow label="Status proses" value={summary.current_stage || summary.job.status} />
              <DetailRow label="Progres" value={`${Number(summary.progress_percent || 0).toFixed(0)}%`} />
              <DetailRow label="Ringkasan hitung" value={`Percobaan ${summary.attempt_count} / Hasil ${summary.artifact_count} / Upload ${summary.upload_count}`} />
              <DetailRow label="Pesan terakhir" value={summary.last_error || "Tidak ada"} />
            </div>
          </div>
          <JobControlPanel job={summary.job} uploadGuard={overview.upload_guard} canOperate={canOperate} />
          <JobRealtimePanel initial={summary} syncSettings={syncSettings} />
        </div>
      </section>
    </>
  );
}
