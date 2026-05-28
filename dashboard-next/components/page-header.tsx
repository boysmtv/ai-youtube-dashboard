import Link from "next/link";

type Breadcrumb = {
  href: string;
  label: string;
};

type Action = {
  href: string;
  label: string;
  tone?: "primary" | "secondary";
};

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  breadcrumbs?: Breadcrumb[];
  actions?: Action[];
}>) {
  return (
    <header className="ta-panel w-full p-6">
      {breadcrumbs?.length ? (
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.href} className="flex items-center gap-2">
              {index > 0 ? <span className="text-gray-300">/</span> : null}
              <Link className="hover:text-brand-600" href={crumb.href}>
                {crumb.label}
              </Link>
            </span>
          ))}
        </nav>
      ) : null}
      <p className="ta-label text-brand-600">{eyebrow}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="max-w-none text-4xl font-bold leading-none text-gray-900 lg:text-5xl">{title}</h2>
          <p className="mt-4 max-w-none text-gray-500">{description}</p>
        </div>
        {actions?.length ? (
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <Link key={`${action.href}-${action.label}`} className={action.tone === "secondary" ? "ta-button-muted" : "ta-button"} href={action.href}>
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
