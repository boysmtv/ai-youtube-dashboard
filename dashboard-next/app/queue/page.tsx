import { AppShell } from "../../components/app-shell";
import { JobCreateForm } from "../../components/job-create-form";
import { JobTable } from "../../components/job-table";
import { MetricCard } from "../../components/metric-card";
import { hasDashboardRole, requireDashboardSession } from "../../lib/dashboard-auth";
import { getJobs, getOverview, getRegistry } from "../../lib/engine-api";

export default async function QueuePage() {
  const session = requireDashboardSession("/queue");
  const [payload, registry, overview] = await Promise.all([getJobs(50), getRegistry(), getOverview()]);
  const canOperate = hasDashboardRole(session, "operator");
  const currentChannelIds = new Set(registry.channels.map((channel) => channel.id));
  const jobs = payload.items.filter((job) => currentChannelIds.has(job.channel_id));
  const activeCount = ["searching", "downloaded", "transcribed", "planned", "voiceover", "rendered", "uploading"].reduce(
    (total, status) => total + (overview.job_counts[status] || 0),
    0,
  );
  const readyToReview = overview.job_counts.rendered || 0;

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Antrian produksi</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">Buat video baru dan lihat antrian yang sedang berjalan.</h2>
        <p className="mt-4 max-w-3xl text-gray-500">
          Gunakan halaman ini untuk menambah job, melihat antrian, memantau proses, dan mengarah ke review jika video sudah siap.
        </p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Antri" value={overview.job_counts.queued || 0} />
        <MetricCard label="Sedang diproses" value={activeCount} tone={activeCount > 0 ? "warn" : "neutral"} />
        <MetricCard label="Siap direview" value={readyToReview} tone={readyToReview > 0 ? "good" : "neutral"} />
        <MetricCard label="Gagal" value={overview.job_counts.failed || 0} tone={(overview.job_counts.failed || 0) > 0 ? "warn" : "neutral"} />
      </section>

      <section className="mt-6" id="create-video">
        <JobCreateForm registry={registry} uploadGuard={overview.upload_guard} canOperate={canOperate} />
      </section>

      <section className="mt-6" id="antrian">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="ta-label text-brand-600">Antrian kerja</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Queue status</h3>
          </div>
          <p className="text-sm text-gray-500">Urutan kerja paling baru ditampilkan di atas.</p>
        </div>
        <JobTable jobs={jobs} canOperate={canOperate} />
      </section>
    </AppShell>
  );
}
