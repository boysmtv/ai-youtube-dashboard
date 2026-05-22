const statusTone: Record<string, string> = {
  queued: "bg-brand-50 text-brand-600",
  searching: "bg-brand-50 text-brand-600",
  downloaded: "bg-brand-50 text-brand-600",
  transcribed: "bg-brand-50 text-brand-600",
  planned: "bg-brand-50 text-brand-600",
  voiceover: "bg-brand-50 text-brand-600",
  rendering: "bg-brand-50 text-brand-600",
  uploading: "bg-warning-50 text-warning-700",
  rendered: "bg-warning-50 text-warning-700",
  paused: "bg-gray-100 text-gray-700",
  failed: "bg-error-50 text-error-700",
  cancelled: "bg-error-50 text-error-700",
  canceled: "bg-error-50 text-error-700",
  uploaded: "bg-success-50 text-success-700",
  completed: "bg-success-50 text-success-700",
};

export function StatusBadge({ status }: Readonly<{ status: string }>) {
  return <span className={`ta-status font-mono ${statusTone[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
}
