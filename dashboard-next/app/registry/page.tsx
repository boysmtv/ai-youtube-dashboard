import Link from "next/link";
import { AppShell } from "../../components/app-shell";
import { JsonCard } from "../../components/json-card";
import { requireDashboardRole } from "../../lib/dashboard-auth";
import { getRegistry } from "../../lib/engine-api";

export default async function RegistryPage() {
  requireDashboardRole("admin", "/registry");
  const registry = await getRegistry();

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Registry</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">Manifest runtime.</h2>
        <p className="mt-4 max-w-2xl text-gray-500">
          Dashboard reads this database-backed engine registry as source of truth. Editing is centralized in Settings to keep one validated save path.
        </p>
        <Link className="ta-button-primary mt-5" href="/settings">
          Open registry editor
        </Link>
      </header>

      <section className="mt-6">
        <JsonCard title="Registry Snapshot" value={registry} />
      </section>
    </AppShell>
  );
}
