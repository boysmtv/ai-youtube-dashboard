import { AppShell } from "../../components/app-shell";
import { ConfirmSubmitButton } from "../../components/confirm-submit-button";
import { JsonCard } from "../../components/json-card";
import { requireDashboardRole } from "../../lib/dashboard-auth";
import { getOverview } from "../../lib/engine-api";
import { runWorkerOnce } from "./actions";

export default async function WorkerPage() {
  requireDashboardRole("operator", "/worker");
  const overview = await getOverview();
  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Worker</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">Kontrol worker.</h2>
        <p className="mt-4 max-w-2xl text-gray-500">Manual worker trigger for dry-run processing. Live upload remains guarded in Approvals.</p>
      </header>
      <section className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <form action={runWorkerOnce} className="ta-panel p-5">
          <h3 className="text-lg font-semibold text-gray-900">Run one worker pass</h3>
          <p className="mt-3 text-sm text-gray-500">Runs the worker once with upload disabled.</p>
          <ConfirmSubmitButton className="mt-5 px-5 py-3 text-sm" message="Run one worker pass now? Upload remains disabled for this manual trigger.">
            Run worker once
          </ConfirmSubmitButton>
        </form>
        <JsonCard title="Worker Snapshot" value={overview.worker} />
      </section>
    </AppShell>
  );
}
