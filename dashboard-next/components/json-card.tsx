export function JsonCard({ title, value }: Readonly<{ title: string; value: unknown }>) {
  return (
    <section className="ta-panel p-5">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <pre className="mt-4 max-h-[520px] overflow-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-white">
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}
