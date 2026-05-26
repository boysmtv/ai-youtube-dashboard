import { saveJobReviewMetadata } from "../app/jobs/actions";
import type { JobDetailPayload, PublishStatePayload, ReviewSummary } from "../lib/engine-types";

function statusTone(ok: boolean) {
  return ok ? "bg-success-50 text-success-700" : "bg-error-50 text-error-700";
}

function riskTone(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "low") return "bg-success-50 text-success-700";
  if (normalized === "medium") return "bg-warning-50 text-warning-700";
  if (normalized === "high") return "bg-error-50 text-error-700";
  return "bg-gray-100 text-gray-700";
}

function summaryText(value?: string | null) {
  return value && String(value).trim() ? value : "Belum diisi";
}

function renderModeOptions(summary: ReviewSummary | undefined) {
  if (!summary?.available_upload_modes?.length) {
    return (
      <>
        <option value="private_validation">Private Validation</option>
        <option value="production_private">Production Private</option>
        <option value="production_public_or_scheduled">Production Public/Scheduled</option>
      </>
    );
  }
  return summary.available_upload_modes.map((option) => (
    <option key={option.mode} value={option.mode}>
      {option.label}
    </option>
  ));
}

function SummaryRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <span className="ta-label">{label}</span>
      <span className="max-w-[72%] break-words text-right text-sm text-gray-700">{value}</span>
    </div>
  );
}

function ReviewReadOnly({ summary }: Readonly<{ summary: ReviewSummary }>) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="ta-label text-brand-600">Review & Upload</p>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">Ringkasan review</h3>
        </div>
        <span className={`ta-status ${statusTone(summary.production_allowed)}`}>{summary.production_allowed ? "Production allowed" : "Production blocked"}</span>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <SummaryRow label="Judul final" value={summaryText(summary.final_title || summary.recommended_title)} />
          <SummaryRow label="Caption final" value={summaryText(summary.final_caption || summary.recommended_caption)} />
          <SummaryRow label="Deskripsi" value={summaryText(summary.final_description || summary.recommended_short_description)} />
          <SummaryRow label="Hashtag" value={(summary.final_hashtags || summary.recommended_hashtags).join(" ") || "Belum diisi"} />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <SummaryRow label="Mode upload" value={summary.selected_upload_mode} />
          <SummaryRow label="Risk reused-content" value={summary.reused_content_risk} />
          <SummaryRow label="AI disclosure" value={summary.needs_ai_disclosure ? "Wajib" : "Tidak wajib"} />
          <SummaryRow label="Copyright" value={summary.copyright_acknowledged ? "Sudah diakui" : "Belum diakui"} />
        </div>
      </div>
    </div>
  );
}

export function JobReviewPanel({
  jobId,
  detail,
  publishState,
  canOperate,
}: Readonly<{
  jobId: number;
  detail: JobDetailPayload;
  publishState: PublishStatePayload;
  canOperate: boolean;
}>) {
  const summary = detail.review_summary || publishState.review_summary;
  if (!summary) {
    return (
      <div className="ta-panel p-5">
        <p className="ta-label text-brand-600">Review & Upload</p>
        <h3 className="mt-2 text-lg font-semibold text-gray-900">Data review belum tersedia.</h3>
      </div>
    );
  }

  if (!canOperate) {
    return (
      <div className="ta-panel p-5">
        <ReviewReadOnly summary={summary} />
      </div>
    );
  }

  return (
    <div className="ta-panel p-5">
      <ReviewReadOnly summary={summary} />
      <form action={saveJobReviewMetadata} className="mt-5 grid gap-4">
        <input name="job_id" type="hidden" value={jobId} />
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Judul final
            <input name="final_title" defaultValue={summary.final_title || summary.recommended_title || ""} placeholder={summary.recommended_title || "Judul final"} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Mode upload
            <select name="selected_upload_mode" defaultValue={summary.selected_upload_mode}>
              {renderModeOptions(summary)}
            </select>
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          Caption final
          <textarea name="final_caption" rows={3} defaultValue={summary.final_caption || summary.recommended_caption || ""} placeholder={summary.recommended_caption || "Caption final"} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Deskripsi singkat
          <textarea
            name="final_description"
            rows={3}
            defaultValue={summary.final_description || summary.recommended_short_description || ""}
            placeholder={summary.recommended_short_description || "Deskripsi singkat"}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Hashtag final
          <input
            name="final_hashtags"
            defaultValue={(summary.final_hashtags || summary.recommended_hashtags).join(", ")}
            placeholder="#Shorts, #Gaming, #Gameplay"
          />
        </label>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex items-start gap-2 text-sm font-semibold text-gray-700">
            <input className="ta-check mt-1" name="ai_disclosure_acknowledged" type="checkbox" defaultChecked={summary.ai_disclosure_acknowledged} />
            <span>AI disclosure sudah diakui untuk konten ini.</span>
          </label>
          <label className="flex items-start gap-2 text-sm font-semibold text-gray-700">
            <input className="ta-check mt-1" name="ai_disclosure_override" type="checkbox" defaultChecked={summary.ai_disclosure_override} />
            <span>Operator override AI disclosure dicatat sebagai pengecualian review.</span>
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          Catatan review operator
          <textarea name="operator_review_notes" rows={4} defaultValue={summary.operator_review_notes || ""} placeholder="Catatan review, alasan penyesuaian, atau risiko yang perlu diingat." />
        </label>
        <div className="grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 lg:grid-cols-2">
          <div>
            <p className="ta-label text-brand-600">Caption rekomendasi</p>
            <p className="mt-1 whitespace-pre-wrap">{summary.recommended_caption || "Belum ada rekomendasi caption."}</p>
          </div>
          <div>
            <p className="ta-label text-brand-600">Alasan caption</p>
            <p className="mt-1 whitespace-pre-wrap">{summary.caption_reason || "Belum ada alasan caption."}</p>
          </div>
          <div>
            <p className="ta-label text-brand-600">Source context</p>
            <p className="mt-1">{summary.source_context_used.join(", ") || "Tidak ada context tercatat."}</p>
          </div>
          <div>
            <p className="ta-label text-brand-600">Safety notes</p>
            <p className="mt-1">{summary.safety_notes.join(" | ") || "Tidak ada catatan safety."}</p>
          </div>
        </div>
        <div className="grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 lg:grid-cols-3">
          <div>
            <p className="ta-label text-brand-600">Rights assessment</p>
            <span className={`ta-status mt-2 ${statusTone(summary.production_allowed)}`}>{summary.production_allowed ? "Allowed" : "Blocked"}</span>
            <p className="mt-2 text-xs text-gray-500">{summary.production_blockers.join("; ") || "Tidak ada blocker produksi."}</p>
          </div>
          <div>
            <p className="ta-label text-brand-600">Reused-content risk</p>
            <span className={`ta-status mt-2 ${riskTone(summary.reused_content_risk)}`}>{summary.reused_content_risk}</span>
            <p className="mt-2 text-xs text-gray-500">{summary.reused_content_reasons.join("; ") || "Tidak ada alasan tambahan."}</p>
          </div>
          <div>
            <p className="ta-label text-brand-600">AI disclosure</p>
            <span className={`ta-status mt-2 ${statusTone(!summary.needs_ai_disclosure || summary.ai_disclosure_acknowledged)}`}>
              {summary.needs_ai_disclosure ? "Required" : "Not required"}
            </span>
            <p className="mt-2 text-xs text-gray-500">{summary.ai_disclosure_required_reason || "Tidak ada alasan disclosure."}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {summary.available_upload_modes.map((mode) => (
            <span
              key={mode.mode}
              className={`ta-status ${mode.allowed ? "bg-success-50 text-success-700" : "bg-gray-100 text-gray-700"}`}
              title={mode.reason || mode.label}
            >
              {mode.label}
            </span>
          ))}
          <span className={`ta-status ${statusTone(summary.copyright_acknowledged)}`}>
            {summary.copyright_acknowledged ? "Copyright acknowledged" : "Copyright not acknowledged"}
          </span>
        </div>
        <button className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white" type="submit">
          Simpan review
        </button>
      </form>
    </div>
  );
}
