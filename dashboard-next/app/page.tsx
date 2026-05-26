import Link from "next/link";
import { AppShell } from "../components/app-shell";
import { ChannelGrid } from "../components/channel-grid";
import { JobTable } from "../components/job-table";
import { MetricCard } from "../components/metric-card";
import { PublishHistoryTable } from "../components/publish-history";
import { hasDashboardRole, requireDashboardSession } from "../lib/dashboard-auth";
import { getChannelReadiness, getOverview, getPublishHistory, getPublishQueue, getRecentApprovals, getRegistry, getRuntimeHealth } from "../lib/engine-api";

function NextActionItem({ href, title, description }: Readonly<{ href: string; title: string; description: string }>) {
  return (
    <Link className="block rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-25" href={href}>
      <strong className="block text-gray-900">{title}</strong>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </Link>
  );
}

export default async function DashboardPage() {
  const session = requireDashboardSession("/");
  const [overview, approvals, registry, readiness, publishHistory, runtimeHealth, publishQueue] = await Promise.all([
    getOverview(),
    getRecentApprovals(5),
    getRegistry(),
    getChannelReadiness(20),
    getPublishHistory(20),
    getRuntimeHealth(),
    getPublishQueue(20),
  ]);
  const canOperate = hasDashboardRole(session, "operator");
  const activeCount = ["searching", "downloaded", "transcribed", "planned", "voiceover", "rendered", "uploading"].reduce(
    (total, status) => total + (overview.job_counts[status] || 0),
    0,
  );
  const readyToReview = overview.job_counts.rendered || 0;
  const needsAttention = (overview.job_counts.failed || 0) + (runtimeHealth.errors?.length || 0) + (runtimeHealth.warnings?.length || 0);
  const uploadPrivateSuccess = publishHistory.items.filter((item) => item.platform === "youtube" && ["uploaded", "published", "draft_ready"].includes(item.status)).length;
  const copyrightBlocked = publishQueue.items.filter((item) => !item.review_summary?.production_allowed && item.review_summary?.production_blockers.length).length;
  const activeChannels = readiness.items.filter((item) => item.enabled).length;
  const latestError = runtimeHealth.errors?.[0] || runtimeHealth.warnings?.[0] || "Tidak ada error penting saat ini.";
  const recommendedAction =
    readyToReview > 0
      ? { href: "/publish", title: "Review video siap upload", description: "Ada video yang sudah siap dicek." }
      : needsAttention > 0
        ? { href: "/queue", title: "Perbaiki video yang gagal", description: "Ada video yang perlu perhatian." }
        : activeCount > 0
          ? { href: "/queue", title: "Pantau proses", description: "Video masih sedang diproses." }
          : { href: "/queue#create-video", title: "Buat video baru", description: "Belum ada pekerjaan aktif." };

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Dashboard</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="max-w-4xl text-4xl font-bold leading-none text-gray-900 lg:text-5xl">Kontrol video produksi untuk operator bisnis.</h2>
            <p className="mt-4 max-w-2xl text-gray-500">
              Lihat video yang sedang diproses, siap review, butuh perhatian, serta channel yang siap dipakai. Detail teknis tetap tersedia di area lanjutan.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="ta-button" href="/queue#create-video">
              Buat Video
            </Link>
            <Link className="ta-button-muted" href="/publish">
              Review & Upload
            </Link>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-25 p-4">
          <p className="ta-label text-brand-600">Yang Perlu Dilakukan</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            <NextActionItem href={recommendedAction.href} title={recommendedAction.title} description={recommendedAction.description} />
            <NextActionItem href="/queue" title="Lihat antrian video" description="Cek video yang sedang berjalan atau gagal." />
            <NextActionItem href="/channels" title="Cek channel siap pakai" description="Pastikan setiap channel sudah siap upload." />
            <NextActionItem href="/publish" title="Review caption dan hashtag" description="Tinjau title, caption, hashtag, copyright, dan label AI." />
            <NextActionItem href="/settings" title="Buka pengaturan" description="Atur channel, safety, dan detail admin." />
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4">
              <p className="ta-label text-brand-600">Error penting</p>
              <p className="mt-2 text-sm text-gray-700">{latestError}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Video Diproses" value={activeCount} />
        <MetricCard label="Siap Review" value={readyToReview} tone={readyToReview > 0 ? "warn" : "neutral"} />
        <MetricCard label="Perlu Perhatian" value={needsAttention} tone={needsAttention > 0 ? "warn" : "neutral"} />
        <MetricCard label="Upload Private Sukses" value={uploadPrivateSuccess} tone="good" />
        <MetricCard label="Diblokir Copyright" value={copyrightBlocked} tone={copyrightBlocked > 0 ? "warn" : "neutral"} />
        <MetricCard label="Channel Aktif" value={activeChannels} tone={activeChannels > 0 ? "good" : "neutral"} />
      </section>

      <section className="mt-6">
        <ChannelGrid registry={registry} overview={overview} readiness={readiness} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Video terbaru</h3>
            <span className="font-mono text-xs text-gray-500">{overview.generated_at}</span>
          </div>
          <JobTable jobs={overview.jobs.slice(0, 8)} canOperate={canOperate} />
        </div>
        <div className="space-y-6">
          <div className="ta-panel p-5">
            <p className="ta-label text-brand-600">Ringkasan</p>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span>Video siap review</span>
                <strong>{readyToReview}</strong>
              </div>
              <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span>Channel aktif</span>
                <strong>{activeChannels}</strong>
              </div>
              <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span>Error penting</span>
                <strong>{needsAttention}</strong>
              </div>
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Riwayat review dan publish</h3>
            <PublishHistoryTable history={publishHistory} limitLabel="Riwayat publish" />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Audit operator</h3>
            {approvals.items.length ? (
              <div className="grid gap-3">
                {approvals.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="ta-panel p-4">
                    <p className="ta-label text-brand-600">{item.job_id ? `Video #${item.job_id}` : "Worker"}</p>
                    <p className="mt-2 text-sm text-gray-700">{item.action}</p>
                    <p className="mt-2 text-xs text-gray-500">{item.operator_name || "unknown"} / {item.created_at}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ta-empty">Belum ada audit operator.</div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
