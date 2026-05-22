export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 px-6">
      <section className="ta-panel w-full max-w-md p-6">
        <p className="ta-label text-brand-600">Loading</p>
        <h1 className="mt-3 text-2xl font-semibold text-gray-900">Fetching engine state.</h1>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-brand-500" />
        </div>
      </section>
    </main>
  );
}
