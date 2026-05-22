export function MetricCard({ label, value, tone = "neutral" }: Readonly<{ label: string; value: string | number; tone?: "neutral" | "good" | "warn" }>) {
  const toneClass =
    tone === "good"
      ? "border-success-500/20 bg-success-50 text-success-700"
      : tone === "warn"
        ? "border-warning-500/20 bg-warning-50 text-warning-700"
        : "border-gray-200 bg-white text-gray-900";
  return (
    <article className={`rounded-2xl border p-5 shadow-panel ${toneClass}`}>
      <p className="ta-label">{label}</p>
      <strong className="mt-3 block text-3xl font-semibold leading-none">{value}</strong>
    </article>
  );
}
