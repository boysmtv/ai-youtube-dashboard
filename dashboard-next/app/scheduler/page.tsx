import { AppShell } from "../../components/app-shell";
import { ConfirmSubmitButton } from "../../components/confirm-submit-button";
import { JsonCard } from "../../components/json-card";
import { requireDashboardRole } from "../../lib/dashboard-auth";
import { getOverview } from "../../lib/engine-api";
import { runSchedulerTick } from "./actions";

export default async function SchedulerPage() {
  requireDashboardRole("operator", "/scheduler");
  const overview = await getOverview();
  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Scheduler</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">Kontrol scheduler.</h2>
        <p className="mt-4 max-w-2xl text-gray-500">
          Scheduler sekarang menyiapkan antrean satu per satu. Job berikutnya hanya dibuat setelah job aktif selesai, dan ini tidak mengupload video.
        </p>
      </header>
      <section className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <form action={runSchedulerTick} className="ta-panel p-5">
          <h3 className="text-lg font-semibold text-gray-900">Run scheduler tick</h3>
          <label className="mt-4 grid gap-2 text-sm font-semibold text-gray-700">
            Search window (days ahead)
            <input name="days_ahead" type="number" min="1" max="14" defaultValue={1} />
          </label>
          <ConfirmSubmitButton className="mt-5 px-5 py-3 text-sm" message="Create the next scheduled job only?">
            Create scheduled jobs
          </ConfirmSubmitButton>
        </form>
        <JsonCard title="Jobs By Channel" value={overview.jobs_by_channel} />
      </section>
    </AppShell>
  );
}
