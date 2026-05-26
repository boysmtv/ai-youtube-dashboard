import Link from "next/link";
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
  const blockedCount = overview.job_counts.failed || 0;

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Antrian Video</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">Buat video baru dan pantau antrian kerja.</h2>
        <p className="mt-4 max-w-3xl text-gray-500">
          Halaman ini dipakai untuk menyusun video baru, melihat antrian yang berjalan, dan mengarah ke review saat video sudah siap.
        </p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Menunggu" value={overview.job_counts.queued || 0} />
        <MetricCard label="Sedang Diproses" value={activeCount} tone={activeCount > 0 ? "warn" : "neutral"} />
        <MetricCard label="Siap Review" value={readyToReview} tone={readyToReview > 0 ? "good" : "neutral"} />
        <MetricCard label="Gagal" value={blockedCount} tone={blockedCount > 0 ? "warn" : "neutral"} />
      </section>

      <section className="mt-6 grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 lg:grid-cols-3">
        <Link className="rounded-2xl border border-brand-100 bg-brand-25 p-4 text-sm transition hover:border-brand-200" href="#create-video">
          <strong className="block text-gray-900">Buat Video Baru</strong>
          <p className="mt-1 text-gray-600">Mulai dari channel, topik, dan target waktu.</p>
        </Link>
        <Link className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm transition hover:border-brand-200" href="#antrian">
          <strong className="block text-gray-900">Lihat Antrian</strong>
          <p className="mt-1 text-gray-600">Cek video yang sedang berjalan atau gagal.</p>
        </Link>
        <Link className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm transition hover:border-brand-200" href="/publish">
          <strong className="block text-gray-900">Review & Upload</strong>
          <p className="mt-1 text-gray-600">Buka video yang sudah siap review.</p>
        </Link>
      </section>

      <section className="mt-6" id="create-video">
        <JobCreateForm registry={registry} uploadGuard={overview.upload_guard} canOperate={canOperate} />
      </section>

      <section className="mt-6" id="antrian">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="ta-label text-brand-600">Antrian kerja</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Video yang sedang berjalan</h3>
          </div>
          <p className="text-sm text-gray-500">Urutan terbaru tampil di atas.</p>
        </div>
        <JobTable jobs={jobs} canOperate={canOperate} />
      </section>
    </AppShell>
  );
}
