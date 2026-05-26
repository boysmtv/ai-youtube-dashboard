import Link from "next/link";
import { AppShell } from "../../components/app-shell";
import { ApprovalList } from "../../components/approval-list";
import { PublishHistoryTable } from "../../components/publish-history";
import { MetricCard } from "../../components/metric-card";
import { PageHeader } from "../../components/page-header";
import { requireDashboardRole } from "../../lib/dashboard-auth";
import { getPublishHistory, getPublishQueue, getRecentApprovals } from "../../lib/engine-api";

export default async function PublishPage() {
  requireDashboardRole("operator", "/publish");
  const [approvals, publishQueue, publishHistory] = await Promise.all([
    getRecentApprovals(50),
    getPublishQueue(50),
    getPublishHistory(50),
  ]);
  const youtubeHistory = {
    ...publishHistory,
    items: publishHistory.items.filter((item) => item.platform === "youtube"),
    total: publishHistory.items.filter((item) => item.platform === "youtube").length,
    platform_counts: { youtube: publishHistory.items.filter((item) => item.platform === "youtube").length },
  };
  const queueItems = publishQueue.items.filter((item) => item.status !== "uploaded");
  const queueTotal = queueItems.length;
  const readyForReview = queueItems.filter((item) => item.review_summary?.caption_editable || item.review_summary?.production_allowed).length;
  const blockedCount = queueItems.filter((item) => item.review_summary && !item.review_summary.production_allowed).length;
  const uploadedCount = publishHistory.items.filter((item) => ["uploaded", "published", "draft_ready"].includes(item.status)).length;
  const failedCount = publishHistory.items.filter((item) => item.status === "failed" || Boolean(item.error_message)).length;

  return (
    <AppShell>
      <PageHeader
        actions={[
          { href: "/queue", label: "Lihat Antrian", tone: "primary" },
          { href: "/channels", label: "Cek Channel", tone: "secondary" },
        ]}
        breadcrumbs={[
          { href: "/", label: "Dashboard" },
          { href: "/publish", label: "Review & Upload" },
        ]}
        description="Halaman ini menampilkan video yang siap dicek, status copyright, label AI, dan riwayat upload terbaru. Aksi upload manual tetap dibatasi oleh gate produksi."
        eyebrow="Review & Upload"
        title="Review video sebelum upload private."
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard href="/publish#queue" label="Perlu Review" value={queueTotal} tone={queueTotal > 0 ? "warn" : "neutral"} />
        <MetricCard href="/publish#queue" label="Siap Review" value={readyForReview} tone={readyForReview > 0 ? "good" : "neutral"} />
        <MetricCard href="/publish#history" label="Upload Berhasil" value={uploadedCount} tone="good" />
        <MetricCard href="/publish#history" label="Upload Gagal" value={failedCount} tone={failedCount > 0 ? "warn" : "neutral"} />
        <MetricCard href="/publish#queue" label="Diblokir" value={blockedCount} tone={blockedCount > 0 ? "warn" : "neutral"} />
      </section>

      <section className="mt-6 grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-brand-100 bg-brand-25 p-4 text-sm">
          <strong className="block text-gray-900">Lihat Video Siap Review</strong>
          <p className="mt-1 text-gray-600">Buka queue yang sudah siap dicek sebelum upload private.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
          <strong className="block text-gray-900">Cek Copyright & Safety</strong>
          <p className="mt-1 text-gray-600">Pastikan blocker rights, musik, dan disclosure sudah aman.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
          <strong className="block text-gray-900">TikTok deferred</strong>
          <p className="mt-1 text-gray-600">Fokus dashboard ini tetap YouTube untuk alur produksi utama.</p>
        </div>
      </section>

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
                        <Link className="font-semibold text-brand-600 underline-offset-4 hover:underline" href={`/jobs/${item.job.id}`}>
                          Video #{item.job.id}
                        </Link>
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
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50" href={`/jobs/${item.job.id}`}>
                        Buka detail
                      </Link>
                      <Link className="rounded-lg border border-brand-100 bg-brand-25 px-3 py-2 text-xs font-semibold text-brand-700 hover:border-brand-200" href="/publish">
                        Review & Upload
                      </Link>
                    </div>
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
            <div id="history" />
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Riwayat publish</h3>
            <PublishHistoryTable history={youtubeHistory} limitLabel="Riwayat upload YouTube" />
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
