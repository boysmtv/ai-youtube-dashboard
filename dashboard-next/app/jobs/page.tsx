import { AppShell } from "../../components/app-shell";
import { JobCreateForm } from "../../components/job-create-form";
import { JobTable } from "../../components/job-table";
import { PageHeader } from "../../components/page-header";
import { hasDashboardRole, requireDashboardSession } from "../../lib/dashboard-auth";
import { getJobs, getOverview, getRegistry } from "../../lib/engine-api";

export default async function JobsPage({
  searchParams,
}: Readonly<{ searchParams: Record<string, string | string[] | undefined> }>) {
  const session = requireDashboardSession("/jobs");
  const [payload, registry, overview] = await Promise.all([getJobs(50), getRegistry(), getOverview()]);
  const canOperate = hasDashboardRole(session, "operator");
  const selectedChannelId = typeof searchParams.channel_id === "string" ? searchParams.channel_id : Array.isArray(searchParams.channel_id) ? searchParams.channel_id[0] : "";
  const currentChannelIds = new Set(registry.channels.map((channel) => channel.id));
  const jobs = payload.items.filter((job) => currentChannelIds.has(job.channel_id) && (!selectedChannelId || job.channel_id === selectedChannelId));

  return (
    <AppShell>
      <PageHeader
        actions={[
          { href: "/queue#create-video", label: "Buat Video Baru", tone: "primary" },
          { href: "/queue#antrian", label: "Lihat Antrian", tone: "secondary" },
        ]}
        breadcrumbs={[
          { href: "/", label: "Dashboard" },
          { href: "/queue", label: "Produksi Video" },
          { href: "/jobs", label: "Detail Video" },
        ]}
        description="Gunakan halaman ini untuk menambah kerja, memeriksa status antrian, dan mengendalikan proses berikutnya."
        eyebrow="Detail Video"
        title="Detail video dan kontrol produksi."
      />
      <section className="mt-6">
        <JobCreateForm defaultChannelId={selectedChannelId} registry={registry} uploadGuard={overview.upload_guard} canOperate={canOperate} />
      </section>
      <section className="mt-6">
        <JobTable jobs={jobs} canOperate={canOperate} />
      </section>
    </AppShell>
  );
}
