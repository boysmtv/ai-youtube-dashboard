import type { OverviewPayload } from "../lib/engine-types";

const flowSections = [
  {
    title: "Rencana",
    description: "Scheduler menyiapkan video yang akan diproses.",
    items: [
      { key: "queued", label: "Menunggu" },
      { key: "paused", label: "Dijeda" },
      { key: "cancelled", label: "Dibatalkan" },
    ],
  },
  {
    title: "Produksi",
    description: "Worker mengubah bahan menjadi video siap review.",
    items: [
      { key: "searching", label: "Cari sumber" },
      { key: "downloaded", label: "Unduh" },
      { key: "transcribed", label: "Transkrip" },
      { key: "planned", label: "Rencana" },
      { key: "voiceover", label: "Voice" },
    ],
  },
  {
    title: "Review",
    description: "Video render menunggu keputusan operator.",
    items: [
      { key: "rendered", label: "Siap Review" },
      { key: "failed", label: "Gagal" },
    ],
  },
  {
    title: "Publikasi",
    description: "Tahap upload dan penjadwalan yang terkendali.",
    items: [
      { key: "uploading", label: "Upload" },
      { key: "uploaded", label: "Sudah Upload" },
    ],
  },
];

export function FlowBoard({ overview }: Readonly<{ overview: OverviewPayload }>) {
  return (
    <section className="ta-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="ta-label text-brand-600">Alur bisnis</p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">Rencana sampai publish.</h3>
        </div>
        <p className="max-w-xl text-sm text-gray-500">
          Tampilan ini mengelompokkan status teknis ke proses bisnis yang lebih mudah dibaca.
        </p>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-4">
        {flowSections.map((section) => (
          <article key={section.title} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="ta-label text-brand-600">{section.title}</p>
            <p className="mt-2 text-sm text-gray-500">{section.description}</p>
            <div className="mt-4 space-y-2">
              {section.items.map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <strong className="font-mono text-sm text-gray-900">{overview.job_counts[item.key] || 0}</strong>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
