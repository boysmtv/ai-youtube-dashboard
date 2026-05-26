import Link from "next/link";
import { AppShell } from "../../components/app-shell";
import { MetricCard } from "../../components/metric-card";
import { PublishHistoryTable } from "../../components/publish-history";
import { PageHeader } from "../../components/page-header";
import { requireDashboardRole } from "../../lib/dashboard-auth";
import { getChannelReadiness, getOverview, getPublishHistory, getPublishQueue } from "../../lib/engine-api";

export default async function AnalyticsPage() {
  requireDashboardRole("viewer", "/analytics");
  const [overview, publishHistory, publishQueue, readiness] = await Promise.all([
    getOverview(),
    getPublishHistory(20),
    getPublishQueue(20),
    getChannelReadiness(20),
  ]);
  const youtubeHistory = {
    ...publishHistory,
    items: publishHistory.items.filter((item) => item.platform === "youtube"),
    total: publishHistory.items.filter((item) => item.platform === "youtube").length,
    platform_counts: { youtube: publishHistory.items.filter((item) => item.platform === "youtube").length },
  };
  const readyReview = overview.job_counts.rendered || 0;
  const uploadedPrivate = youtubeHistory.items.filter((item) => ["uploaded", "published", "draft_ready"].includes(item.status)).length;
  const failed = overview.job_counts.failed || 0;
  const totalCreated = overview.jobs.length;
  const copyrightBlocked = publishQueue.items.filter((item) => !item.review_summary?.production_allowed && item.review_summary?.production_blockers.length).length;
  const problemChannels = readiness.items.filter((item) => !item.upload_ready || item.issues.length > 0).length;
  const blockedVideos = overview.jobs.filter((job) => ["failed", "cancelled", "canceled"].includes(job.status.toLowerCase()) || Boolean(job.last_error)).slice(0, 10);
  const latestUploads = youtubeHistory.items.slice(0, 10);
  const nextAction =
    uploadedPrivate > 0
      ? { title: "Lihat riwayat upload", description: "Ada upload yang sudah sukses tercatat.", href: "/publish#history" }
      : blockedVideos.length > 0
        ? { title: "Review video diblokir", description: "Ada video yang masih butuh perbaikan.", href: `/jobs/${blockedVideos[0].id}` }
        : problemChannels > 0
          ? { title: "Cek channel", description: "Ada channel yang perlu login atau review.", href: "/channels" }
          : readyReview > 0
            ? { title: "Review sekarang", description: "Ada video yang siap ditinjau.", href: "/publish" }
            : { title: "Lihat antrian", description: "Belum ada item yang perlu tindak lanjut.", href: "/queue" };

  return (
    <AppShell>
      <PageHeader
        actions={[
          { href: "/publish", label: "Lihat Riwayat Upload", tone: "primary" },
          { href: "/queue", label: "Lihat Antrian", tone: "secondary" },
        ]}
        breadcrumbs={[
          { href: "/", label: "Dashboard" },
          { href: "/analytics", label: "Laporan" },
        ]}
        description="Halaman ini merangkum hasil operasional supaya bisnis bisa melihat apa yang berjalan dan apa yang tertahan."
        eyebrow="Laporan"
        title="Laporan operasional."
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard href="/publish" label="Total Video Dibuat" value={totalCreated} />
        <MetricCard href="/publish" label="Upload Private Sukses" value={uploadedPrivate} tone="good" />
        <MetricCard href="/publish#queue" label="Video Siap Review" value={readyReview} tone={readyReview > 0 ? "warn" : "neutral"} />
        <MetricCard label="Video Gagal" value={failed} tone={failed > 0 ? "warn" : "neutral"} />
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard href="/publish#queue" label="Diblokir Copyright" value={copyrightBlocked} tone={copyrightBlocked > 0 ? "warn" : "neutral"} />
        <MetricCard href="/channels" label="Channel Bermasalah" value={problemChannels} tone={problemChannels > 0 ? "warn" : "neutral"} />
        <MetricCard href="/queue" label="Antrian Aktif" value={overview.job_counts.queued || 0} />
        <MetricCard href="/channels" label="Channel Aktif" value={readiness.items.filter((item) => item.enabled).length} tone="good" />
      </section>

      <section className="mt-6 grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-brand-100 bg-brand-25 p-4 text-sm">
          <strong className="block text-gray-900">{nextAction.title}</strong>
          <p className="mt-1 text-gray-600">{nextAction.description}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
          <strong className="block text-gray-900">Video siap review</strong>
          <p className="mt-1 text-gray-600">{readyReview} item menunggu review sebelum private test.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
          <strong className="block text-gray-900">Channel bermasalah</strong>
          <p className="mt-1 text-gray-600">{problemChannels} channel butuh login, review, atau perbaikan setup.</p>
        </div>
        <div className="lg:col-span-3">
          <Link className="ta-button" href={nextAction.href}>
            {nextAction.title}
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-brand-100 bg-brand-25 p-4 text-sm">
          <strong className="block text-gray-900">Total video dibuat</strong>
          <p className="mt-1 text-gray-600">{totalCreated} video tercatat dari sistem utama.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
          <strong className="block text-gray-900">Upload private sukses</strong>
          <p className="mt-1 text-gray-600">{uploadedPrivate} upload private tercatat sukses.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
          <strong className="block text-gray-900">Data source</strong>
          <p className="mt-1 text-gray-600">Semua angka dibaca dari data operasional terbaru.</p>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="ta-panel p-5">
          <p className="ta-label text-brand-600">Ringkasan hasil</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Hasil publish terbaru</h3>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <span>Riwayat upload</span>
              <strong>{youtubeHistory.items.length}</strong>
            </div>
            <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <span>Video siap review</span>
              <strong>{readyReview}</strong>
            </div>
            <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <span>Diblokir copyright</span>
              <strong>{copyrightBlocked}</strong>
            </div>
            <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <span>Channel bermasalah</span>
              <strong>{problemChannels}</strong>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
            <p className="ta-label text-brand-600">Ringkasan output</p>
            <p className="mt-2">Siap review: {readyReview}. Upload sukses: {uploadedPrivate}. Gagal: {failed}. Riwayat upload: {youtubeHistory.total}.</p>
            <p className="mt-2 text-xs text-gray-500">Snapshot terbaru: {publishHistory.generated_at}</p>
          </div>
        </div>

        <div className="ta-panel p-5">
          <p className="ta-label text-brand-600">Riwayat publish</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Item terbaru</h3>
          <div className="mt-4">
            <PublishHistoryTable history={youtubeHistory} limitLabel="Riwayat upload terbaru" />
          </div>
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-gray-900">Upload terakhir</h4>
            <div className="mt-3 space-y-3">
              {latestUploads.length ? (
                latestUploads.map((item) => (
                  <div key={`${item.platform}-${item.record_id}`} className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Link className="font-mono font-semibold text-brand-600 underline-offset-4 hover:underline" href={`/jobs/${item.job_id}`}>
                        Video #{item.job_id}
                      </Link>
                      <span className="ta-status bg-success-50 text-success-700">{item.status}</span>
                    </div>
                    <p className="mt-2 text-gray-600">{item.channel_id}</p>
                    <p className="mt-2 text-xs text-gray-500">{item.created_at}</p>
                  </div>
                ))
              ) : (
                <div className="ta-empty">Belum ada laporan upload.</div>
              )}
            </div>
          </div>
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-gray-900">Video diblokir</h4>
            <div className="mt-3 space-y-3">
              {blockedVideos.length ? (
                blockedVideos.map((job) => (
                  <div key={job.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Link className="font-mono font-semibold text-brand-600 underline-offset-4 hover:underline" href={`/jobs/${job.id}`}>
                        Video #{job.id}
                      </Link>
                      <span className="ta-status bg-error-50 text-error-700">{job.status}</span>
                    </div>
                    <p className="mt-2 text-gray-600">{job.last_error || "Tidak ada detail error."}</p>
                  </div>
                ))
              ) : (
                <div className="ta-empty">Tidak ada error penting.</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
