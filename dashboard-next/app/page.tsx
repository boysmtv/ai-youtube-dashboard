import Link from "next/link";
import { AppShell } from "../components/app-shell";
import { ChannelGrid } from "../components/channel-grid";
import { JobTable } from "../components/job-table";
import { MetricCard } from "../components/metric-card";
import { PageHeader } from "../components/page-header";
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
      <PageHeader
        actions={[
          { href: "/queue#create-video", label: "Buat Video Baru", tone: "primary" },
          { href: "/publish", label: "Review Video Siap Upload", tone: "secondary" },
        ]}
        breadcrumbs={[{ href: "/", label: "Dashboard" }]}
        description="Lihat video yang sedang diproses, siap review, butuh perhatian, serta channel yang siap dipakai. Detail teknis tetap tersedia di area lanjutan."
        eyebrow="Dashboard"
        title="Kontrol video produksi untuk operator bisnis."
      />

      <section className="mt-6 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2 xl:grid-cols-5">
        <Link className="rounded-2xl border border-brand-100 bg-brand-25 p-4 text-sm transition hover:border-brand-200" href="/queue#create-video">
          <strong className="block text-gray-900">Buat Video Baru</strong>
          <p className="mt-1 text-gray-600">Mulai alur kerja video baru.</p>
        </Link>
        <Link className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm transition hover:border-brand-200" href="/publish">
          <strong className="block text-gray-900">Review Video Siap Upload</strong>
          <p className="mt-1 text-gray-600">Cek metadata, copyright, dan label AI.</p>
        </Link>
        <Link className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm transition hover:border-brand-200" href="/queue#antrian">
          <strong className="block text-gray-900">Lihat Antrian</strong>
          <p className="mt-1 text-gray-600">Pantau proses yang sedang berjalan.</p>
        </Link>
        <Link className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm transition hover:border-brand-200" href="/channels">
          <strong className="block text-gray-900">Cek Channel</strong>
          <p className="mt-1 text-gray-600">Cari channel yang siap atau bermasalah.</p>
        </Link>
        <Link className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm transition hover:border-brand-200" href="/analytics">
          <strong className="block text-gray-900">Cek Laporan</strong>
          <p className="mt-1 text-gray-600">Lihat ringkasan operasional terbaru.</p>
        </Link>
      </section>

      <section className="mt-6 rounded-2xl border border-brand-100 bg-brand-25 p-5">
        <p className="ta-label text-brand-600">Yang Perlu Dilakukan</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          <NextActionItem href={recommendedAction.href} title={recommendedAction.title} description={recommendedAction.description} />
          <NextActionItem href="/publish" title="Review video siap upload" description="Buka queue review dan cek blocker produksi." />
          <NextActionItem href="/queue" title="Periksa video yang gagal" description="Lihat job yang perlu dipulihkan atau diulang." />
          <NextActionItem href="/publish" title="Lengkapi data copyright" description="Periksa metadata, rights, dan disclosure sebelum upload." />
          <NextActionItem href="/publish" title="Cek caption dan hashtag" description="Pastikan title, caption, dan hashtag final sudah sesuai." />
          <NextActionItem href="/channels" title="Cek channel perlu login" description="Cari channel yang butuh token atau perbaikan setup." />
          <NextActionItem href="/analytics" title="Lihat laporan upload" description="Ringkasan operasional upload YouTube terbaru." />
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4">
            <p className="ta-label text-brand-600">Error penting</p>
            <p className="mt-2 text-sm text-gray-700">{latestError}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard href="/queue#antrian" label="Video Diproses" value={activeCount} />
        <MetricCard href="/publish" label="Siap Review" value={readyToReview} tone={readyToReview > 0 ? "warn" : "neutral"} />
        <MetricCard href="/queue" label="Perlu Perhatian" value={needsAttention} tone={needsAttention > 0 ? "warn" : "neutral"} />
        <MetricCard href="/publish" label="Upload Private Sukses" value={uploadPrivateSuccess} tone="good" />
        <MetricCard href="/publish" label="Diblokir Copyright" value={copyrightBlocked} tone={copyrightBlocked > 0 ? "warn" : "neutral"} />
        <MetricCard href="/channels" label="Channel Aktif" value={activeChannels} tone={activeChannels > 0 ? "good" : "neutral"} />
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
