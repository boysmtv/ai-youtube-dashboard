import type { OverviewPayload } from "../lib/engine-types";

const flowSections = [
  {
    title: "Plan",
    description: "Scheduler creates upcoming jobs and queues manual work.",
    items: [
      { key: "queued", label: "Queued" },
      { key: "paused", label: "Paused" },
      { key: "cancelled", label: "Cancelled" },
    ],
  },
  {
    title: "Produce",
    description: "Worker transforms source into publishable output.",
    items: [
      { key: "searching", label: "Search" },
      { key: "downloaded", label: "Download" },
      { key: "transcribed", label: "Transcript" },
      { key: "planned", label: "Plan" },
      { key: "voiceover", label: "Voice" },
    ],
  },
  {
    title: "Approve",
    description: "Rendered output waits for operator decision and audit.",
    items: [
      { key: "rendered", label: "Rendered" },
      { key: "failed", label: "Failed" },
    ],
  },
  {
    title: "Publish",
    description: "Upload and schedule execution against quota and credentials.",
    items: [
      { key: "uploading", label: "Uploading" },
      { key: "uploaded", label: "Uploaded" },
    ],
  },
];

export function FlowBoard({ overview }: Readonly<{ overview: OverviewPayload }>) {
  return (
    <section className="ta-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="ta-label text-brand-600">Business flow</p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">Plan to publish pipeline.</h3>
        </div>
        <p className="max-w-xl text-sm text-gray-500">
          This view groups raw job statuses into the actual business process the operator cares about.
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
