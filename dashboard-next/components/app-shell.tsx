import Link from "next/link";
import type { DashboardRole } from "../lib/dashboard-auth";
import { getDashboardSession, hasDashboardRole } from "../lib/dashboard-auth";
import { logoutDashboard } from "../app/login/actions";

const navSections: Array<{ heading: string; items: Array<{ href: string; label: string; role: DashboardRole }> }> = [
  {
    heading: "Menu Utama",
    items: [
      { href: "/", label: "Dashboard", role: "viewer" },
      { href: "/queue", label: "Produksi Video", role: "viewer" },
      { href: "/publish", label: "Review & Upload", role: "operator" },
      { href: "/channels", label: "Channel", role: "viewer" },
      { href: "/analytics", label: "Laporan", role: "viewer" },
      { href: "/settings", label: "Pengaturan", role: "admin" },
    ],
  },
  {
    heading: "Admin / Lanjutan",
    items: [
      { href: "/jobs", label: "Detail Video", role: "viewer" },
      { href: "/artifacts", label: "File Video", role: "viewer" },
      { href: "/operations", label: "Operasi", role: "viewer" },
      { href: "/quota", label: "Kuota", role: "viewer" },
      { href: "/worker", label: "Worker", role: "operator" },
      { href: "/scheduler", label: "Scheduler", role: "operator" },
      { href: "/logs", label: "Logs", role: "admin" },
      { href: "/health", label: "Health", role: "admin" },
      { href: "/registry", label: "Manifest", role: "admin" },
      { href: "/system", label: "System", role: "admin" },
      { href: "/governance", label: "Governance", role: "admin" },
      { href: "/diagnostics", label: "Diagnostik Teknis", role: "admin" },
    ],
  },
];

export async function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = getDashboardSession();
  const allowedSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasDashboardRole(session, item.role)),
    }))
    .filter((section) => section.items.length);

  return (
    <main className="min-h-screen bg-gray-50 lg:grid lg:grid-cols-[290px_1fr]">
      <aside className="border-r border-gray-200 bg-white px-5 py-6 lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500 text-lg font-bold text-white shadow-elevated">YT</div>
          <div>
            <p className="ta-label">AI YouTube</p>
            <h1 className="text-xl font-bold leading-none text-gray-900">Business Operator</h1>
          </div>
        </div>
        <nav className="mt-8 space-y-6">
          {allowedSections.map((section) => (
            <div key={section.heading}>
              <p className={`ta-label px-3 ${section.heading === "Menu Utama" ? "text-gray-500" : "text-gray-400"}`}>{section.heading}</p>
              <div className="mt-2 grid gap-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-brand-50 hover:text-brand-600 ${
                      section.heading === "Menu Utama" ? "text-gray-800" : "text-gray-600"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-gray-300 transition group-hover:bg-brand-500" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-25 p-4 text-sm text-gray-700">
          <p className="ta-label text-brand-600">Mode</p>
          <p className="mt-2">Business-first control surface. Technical views stay behind detail and advanced ops.</p>
        </div>
      </aside>
      <section className="min-w-0">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="ta-label">Ruang Operator</p>
              <h2 className="text-xl font-semibold text-gray-900">Dashboard bisnis</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700">
                <span className="h-2.5 w-2.5 rounded-full bg-success-500" />
                Tersambung ke engine
              </div>
              {session.authEnabled ? (
                <form action={logoutDashboard}>
                  <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" type="submit">
                    {session.username} / {session.role} / Sign out
                  </button>
                </form>
              ) : (
                <div className="rounded-full border border-brand-100 bg-brand-25 px-4 py-2 text-sm text-brand-600">local-admin</div>
              )}
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-8">{children}</div>
      </section>
    </main>
  );
}
