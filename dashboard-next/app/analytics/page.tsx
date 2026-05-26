import { AppShell } from "../../components/app-shell";
import { MetricCard } from "../../components/metric-card";
import { PublishHistoryTable } from "../../components/publish-history";
import { requireDashboardRole } from "../../lib/dashboard-auth";
import { getOverview, getPublishHistory } from "../../lib/engine-api";

function ratio(numerator: number, denominator: number) {
  if (!denominator) return "0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

export default async function AnalyticsPage() {
  requireDashboardRole("viewer", "/analytics");
  const [overview, publishHistory] = await Promise.all([getOverview(), getPublishHistory(80)]);
  const youtubeItems = publishHistory.items.filter((item) => item.platform === "youtube");
  const tiktokItems = publishHistory.items.filter((item) => item.platform === "tiktok");
  const youtubeSuccess = youtubeItems.filter((item) => ["uploaded", "published", "draft_ready"].includes(item.status)).length;
  const tiktokSuccess = tiktokItems.filter((item) => ["published", "draft_ready"].includes(item.status)).length;
  const youtubeFailed = youtubeItems.filter((item) => item.status === "failed" || Boolean(item.error_message)).length;
  const tiktokFailed = tiktokItems.filter((item) => item.status === "failed" || Boolean(item.error_message)).length;
  const ready = overview.job_counts.rendered || 0;
  const published = overview.job_counts.uploaded || overview.job_counts.completed || 0;
  const failed = overview.job_counts.failed || 0;

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Laporan</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">Ringkasan performa bisnis.</h2>
        <p className="mt-4 max-w-3xl text-gray-500">
          Halaman ini merangkum throughput, hasil publish, dan performa channel supaya bisnis bisa melihat apa yang berjalan dan apa yang tertahan.
        </p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Siap Review" value={ready} tone={ready > 0 ? "warn" : "neutral"} />
        <MetricCard label="Sudah Publish" value={published} tone="good" />
        <MetricCard label="Gagal" value={failed} tone={failed > 0 ? "warn" : "neutral"} />
        <MetricCard label="Avg viral fit" value={overview.recent_attempts.length ? "Lihat antrian" : "Belum ada"} />
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="YouTube publish" value={youtubeItems.length} tone="good" />
        <MetricCard label="YouTube sukses" value={ratio(youtubeSuccess, youtubeItems.length)} tone={youtubeSuccess > 0 ? "good" : "neutral"} />
        <MetricCard label="TikTok publish" value={tiktokItems.length} tone="warn" />
        <MetricCard label="TikTok sukses" value={ratio(tiktokSuccess, tiktokItems.length)} tone={tiktokSuccess > 0 ? "good" : "neutral"} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="ta-panel p-5">
          <p className="ta-label text-brand-600">Platform mix</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Hasil publish terbaru</h3>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <span>YouTube history</span>
              <strong>{youtubeItems.length}</strong>
            </div>
            <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <span>TikTok history</span>
              <strong>{tiktokItems.length}</strong>
            </div>
            <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <span>YouTube failed</span>
              <strong>{youtubeFailed}</strong>
            </div>
            <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <span>TikTok failed</span>
              <strong>{tiktokFailed}</strong>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
            <p className="ta-label text-brand-600">Output cadence</p>
            <p className="mt-2">
              Ready items: {ready}. Published: {published}. Failed: {failed}. Recent publish history items: {publishHistory.total}.
            </p>
            <p className="mt-2 text-xs text-gray-500">Latest history snapshot: {publishHistory.generated_at}</p>
          </div>
        </div>

        <div className="ta-panel p-5">
          <p className="ta-label text-brand-600">Riwayat publish</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Item terbaru</h3>
          <div className="mt-4">
            <PublishHistoryTable history={publishHistory} limitLabel="Riwayat publish terbaru" />
          </div>
        </div>
      </section>
    </AppShell>
  );
}
