import { redirect } from "next/navigation";
import { isDashboardAuthEnabled } from "../../lib/dashboard-auth";
import { loginDashboard } from "./actions";

export default function LoginPage({
  searchParams,
}: Readonly<{
  searchParams?: { next?: string };
}>) {
  if (!isDashboardAuthEnabled()) {
    redirect("/");
  }

  const nextPath = searchParams?.next || "/";

  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 px-6 py-12">
      <section className="ta-panel w-full max-w-md p-6">
        <p className="ta-label text-brand-600">Dashboard access</p>
        <h1 className="mt-3 text-3xl font-semibold text-gray-900">Sign in to the control plane.</h1>
        <p className="mt-3 text-sm text-gray-500">Roles are enforced server-side. Monitoring and control actions are separated by account role.</p>
        <form action={loginDashboard} className="mt-6 grid gap-4">
          <input name="next" type="hidden" value={nextPath} />
          <label className="grid gap-2 text-sm font-semibold text-gray-700">
            Username
            <input name="username" required autoComplete="username" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-gray-700">
            Password
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          <button className="ta-button-primary" type="submit">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
