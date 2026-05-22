"use client";

export default function ErrorPage({ error, reset }: Readonly<{ error: Error; reset: () => void }>) {
  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 px-6">
      <section className="ta-panel w-full max-w-2xl p-6">
        <p className="ta-label text-error-700">Dashboard error</p>
        <h1 className="mt-3 text-3xl font-semibold text-gray-900">Engine data could not be loaded.</h1>
        <p className="mt-3 text-sm text-gray-500">
          Check the engine container/API status, then retry. The dashboard keeps this failure isolated so the operator does not see a blank screen.
        </p>
        <pre className="mt-5 max-h-52 overflow-auto rounded-xl bg-gray-900 p-4 text-xs text-white">{error.message}</pre>
        <button className="ta-button-primary mt-5" type="button" onClick={reset}>
          Retry
        </button>
      </section>
    </main>
  );
}
