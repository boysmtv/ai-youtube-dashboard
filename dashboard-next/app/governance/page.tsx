import { AppShell } from "../../components/app-shell";
import { ApprovalList } from "../../components/approval-list";
import { JsonCard } from "../../components/json-card";
import { dashboardAuthReadiness, requireDashboardRole } from "../../lib/dashboard-auth";
import { getAdminBackups, getRecentApprovals } from "../../lib/engine-api";

export default async function GovernancePage() {
  requireDashboardRole("admin", "/governance");
  const [approvals, backups] = await Promise.all([getRecentApprovals(15), getAdminBackups()]);
  const auth = dashboardAuthReadiness();

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Governance</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">Who changed what, and how recovery is protected.</h2>
        <p className="mt-4 max-w-3xl text-gray-500">
          Governance covers role access, approval audit, and backup control for destructive or recovery actions.
        </p>
      </header>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <JsonCard title="Auth Readiness" value={auth} />
        <JsonCard title="Backup Snapshot Summary" value={{ count: backups.count, recent: backups.items.slice(0, 10), live: backups.live }} />
      </section>

      <section className="mt-6">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Approval audit</h3>
        <ApprovalList approvals={approvals.items} />
      </section>
    </AppShell>
  );
}
