import { AppShell } from "../../components/app-shell";
import { ApprovalList } from "../../components/approval-list";
import { PublishHistoryTable } from "../../components/publish-history";
import { MetricCard } from "../../components/metric-card";
import { requireDashboardRole } from "../../lib/dashboard-auth";
import { getOverview, getPublishHistory, getPublishQueue, getRecentApprovals } from "../../lib/engine-api";

export default async function PublishPage() {
  requireDashboardRole("operator", "/publish");
  const [overview, approvals, publishQueue, publishHistory] = await Promise.all([
    getOverview(),
    getRecentApprovals(50),
    getPublishQueue(50),
    getPublishHistory(50),
  ]);
  const queueItems = publishQueue.items.filter((item) => item.status !== "uploaded");
  const queueTotal = queueItems.length;
  const readyForReview = queueItems.filter((item) => item.review_summary?.caption_editable || item.review_summary?.production_allowed).length;
  const blockedCount = queueItems.filter((item) => item.review_summary && !item.review_summary.production_allowed).length;
  const uploadedCount = publishHistory.items.filter((item) => ["uploaded", "published", "draft_ready"].includes(item.status)).length;
  const failedCount = publishHistory.items.filter((item) => item.status === "failed" || Boolean(item.error_message)).length;

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-warning-700">Review & Upload</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">Review video sebelum upload private.</h2>
        <p className="mt-4 max-w-2xl text-gray-500">
          Halaman ini menampilkan video yang siap dicek, status copyright, label AI, dan riwayat upload terbaru. Aksi upload manual tetap dibatasi oleh gate produksi.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Perlu Review" value={queueTotal} tone={queueTotal > 0 ? "warn" : "neutral"} />
          <MetricCard label="Siap Review" value={readyForReview} tone={readyForReview > 0 ? "good" : "neutral"} />
          <MetricCard label="Upload Berhasil" value={uploadedCount} tone="good" />
          <MetricCard label="Upload Gagal" value={failedCount} tone={failedCount > 0 ? "warn" : "neutral"} />
          <MetricCard label="Diblokir" value={blockedCount} tone={blockedCount > 0 ? "warn" : "neutral"} />
        </div>
      </header>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="ta-panel p-5">
            <p className="ta-label text-brand-600">Upload mode</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Mode bisnis yang aman</h3>
            <p className="mt-2 text-sm text-gray-500">
              Review dulu, lalu gunakan upload private hanya jika copyright, musik, visual, dan disclosure sudah aman.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <strong className="block text-gray-900">Upload Private Test</strong>
                <p className="mt-1 text-sm text-gray-500">Mode default untuk cek teknis.</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <strong className="block text-gray-900">Production Private</strong>
                <p className="mt-1 text-sm text-gray-500">Hanya jika gate produksi lolos.</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <strong className="block text-gray-900">Production Public / Scheduled</strong>
                <p className="mt-1 text-sm text-gray-500">Tidak jadi default dan tetap diblokir jika rights gagal.</p>
              </div>
            </div>
          </div>

          <div className="ta-panel p-5">
            <p className="ta-label text-brand-600">Queue ringkas</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Video yang perlu ditinjau</h3>
            {queueItems.length ? (
              <div className="mt-4 grid gap-3">
                {queueItems.slice(0, 5).map((item) => (
                  <div key={item.job.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <strong className="text-gray-900">Video #{item.job.id}</strong>
                        <p className="mt-1 text-gray-500">{item.job.channel_id} / {item.job.niche}</p>
                      </div>
                      <span className={`ta-status ${item.review_summary?.production_allowed ? "bg-success-50 text-success-700" : "bg-warning-50 text-warning-700"}`}>
                        {item.review_summary?.production_allowed ? "Aman" : "Perlu Review"}
                      </span>
                    </div>
                    <p className="mt-3 text-gray-700">{item.review_summary?.final_title || item.selected_title || "Judul belum dipilih"}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      {item.review_summary?.production_blockers.join("; ") || item.review_summary?.reused_content_reasons.join("; ") || "Tidak ada blocker utama."}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ta-empty">Belum ada video siap review.</div>
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Riwayat publish</h3>
            <PublishHistoryTable history={publishHistory} limitLabel="Riwayat upload" />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Audit persetujuan</h3>
            <ApprovalList approvals={approvals.items} />
          </div>
        </div>
      </section>

      <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-600">
        <p className="ta-label text-brand-600">Catatan</p>
        <p className="mt-2">Upload private hanya untuk cek teknis. Status production tetap ditentukan oleh copyright, musik, visual, dan disclosure.</p>
      </div>
    </AppShell>
  );
}
