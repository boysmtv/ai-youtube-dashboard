import Link from "next/link";
import type { JobDetailPayload, PublishStatePayload, ReviewModeOption, ReviewSummary } from "../lib/engine-types";
import {
  businessAiDisclosureStatus,
  businessBlockerDetail,
  businessChecklistState,
  businessRightsStatus,
  businessUploadModeOptions,
  summaryText,
} from "../lib/business-copy";
import { operatorDecisionForJob } from "../lib/operator-workflow";
import { saveJobReviewMetadata } from "../app/jobs/actions";

function SummaryRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <span className="ta-label">{label}</span>
      <span className="max-w-[72%] break-words text-right text-sm text-gray-700">{value}</span>
    </div>
  );
}

function checkTone(option: ReviewModeOption) {
  if (option.allowed) return "border-success-200 bg-success-50 text-success-700";
  return "border-gray-200 bg-gray-50 text-gray-500";
}

function ModeCard({ option, selected }: Readonly<{ option: ReviewModeOption; selected: boolean }>) {
  return (
    <label className={`block cursor-pointer rounded-2xl border p-4 transition hover:border-brand-200 ${checkTone(option)}`}>
      <div className="flex items-start gap-3">
        <input className="mt-1" name="selected_upload_mode" type="radio" value={option.mode} defaultChecked={selected} disabled={!option.allowed} />
        <div className="min-w-0">
          <strong className="block text-sm">{option.label}</strong>
          <p className="mt-1 text-xs leading-5 text-current/80">{option.allowed ? "Siap dipilih." : option.reason || "Diblokir."}</p>
        </div>
      </div>
    </label>
  );
}

function blockerMessage(message: string) {
  const detail = businessBlockerDetail(message);
  return (
    <div className="rounded-2xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-900">
      <p className="font-semibold">{detail.problem}</p>
      <p className="mt-2">Dampak: {detail.impact}</p>
      <p className="mt-2">Langkah berikutnya: {detail.nextStep}</p>
    </div>
  );
}

export function JobReviewPanel({
  jobId,
  detail,
  publishState,
  canOperate,
  previewReady,
}: Readonly<{
  jobId: number;
  detail: JobDetailPayload;
  publishState: PublishStatePayload;
  canOperate: boolean;
  previewReady: boolean;
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

  const decision = operatorDecisionForJob(detail.job, detail.review_summary || publishState.review_summary, publishState);
  const uploadModes = businessUploadModeOptions(summary.available_upload_modes);
  const blockers = summary.production_blockers.length ? summary.production_blockers : [decision.blockerReason].filter(Boolean) as string[];
  const latestUploads = detail.uploads.slice(0, 3);

  return (
    <div className="ta-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="ta-label text-brand-600">Review & Upload</p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">Decision center video</h3>
          <p className="mt-2 text-sm text-gray-500">Cek preview, caption, hashtag, copyright, dan mode upload sebelum memilih langkah berikutnya.</p>
        </div>
        <span className={`ta-status ${decision.tone === "good" ? "bg-success-50 text-success-700" : decision.tone === "error" ? "bg-error-50 text-error-700" : "bg-warning-50 text-warning-700"}`}>
          {decision.label}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-25 p-4">
        <p className="ta-label text-brand-600">Langkah Berikutnya</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <strong className="block text-gray-900">{decision.nextAction}</strong>
            <p className="mt-1 text-sm text-gray-600">{decision.explanation}</p>
          </div>
          <Link className="ta-button" href={decision.targetLink}>
            Lanjut
          </Link>
        </div>
        {decision.blockerReason ? <div className="mt-3">{blockerMessage(decision.blockerReason)}</div> : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Preview</p>
          <strong className="mt-2 block text-gray-900">{previewReady ? "Tersedia" : "Belum tersedia"}</strong>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Siap Upload Private?</p>
          <strong className={`mt-2 block ${(summary.private_validation_allowed ?? summary.production_allowed) ? "text-success-700" : "text-warning-700"}`}>
            {(summary.private_validation_allowed ?? summary.production_allowed) ? "Ya" : "Tidak"}
          </strong>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Siap Production?</p>
          <strong className={`mt-2 block ${summary.production_allowed ? "text-success-700" : "text-warning-700"}`}>{summary.production_allowed ? "Ya" : "Tidak"}</strong>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Label AI</p>
          <strong className="mt-2 block text-gray-900">{businessAiDisclosureStatus(summary).label}</strong>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label text-brand-600">Preview Konten</p>
          <div className="mt-3 space-y-2">
            <SummaryRow label="Judul" value={summaryText(summary.final_title || summary.recommended_title)} />
            <SummaryRow label="Caption" value={summaryText(summary.final_caption || summary.recommended_caption)} />
            <SummaryRow label="Hashtag" value={(summary.final_hashtags || summary.recommended_hashtags).join(" ") || "Belum diisi"} />
            <SummaryRow label="Deskripsi Singkat" value={summaryText(summary.final_description || summary.recommended_short_description)} />
            <SummaryRow label="Alasan Rekomendasi" value={summary.caption_reason || "Belum ada alasan"} />
            <SummaryRow label="Catatan Operator" value={summary.operator_review_notes || "Belum ada catatan"} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="ta-label text-brand-600">Cek Keamanan Copyright</p>
            <div className="mt-3 space-y-2">
              <SummaryRow label="Copyright" value={businessRightsStatus(summary).label} />
              <SummaryRow label="Risiko ulang" value={String(summary.reused_content_risk || "unknown").toUpperCase()} />
              <SummaryRow label="Musik" value={businessChecklistState(summary.music_rights_ok).label} />
              <SummaryRow label="Visual" value={businessChecklistState(summary.visual_rights_ok).label} />
              <SummaryRow label="Voice-over" value={businessChecklistState(summary.voiceover_legal).label} />
              <SummaryRow label="Copyright acknowledged" value={businessChecklistState(summary.copyright_acknowledged).label} />
            </div>
            {blockers.length ? <div className="mt-4 grid gap-3">{blockers.map((item) => blockerMessage(item))}</div> : null}
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="ta-label text-brand-600">Cek Label AI</p>
            <div className="mt-3 space-y-2">
              <SummaryRow label="AI generated" value={summary.ai_generated ? "Ya" : "Tidak"} />
              <SummaryRow label="Terlihat realistis" value={summary.realistic_synthetic_content ? "Ya" : "Tidak"} />
              <SummaryRow label="Butuh disclosure" value={summary.needs_ai_disclosure ? "Ya" : "Tidak"} />
              <SummaryRow label="Status disclosure" value={businessAiDisclosureStatus(summary).label} />
            </div>
            {summary.needs_ai_disclosure && !summary.ai_disclosure_acknowledged && !summary.ai_disclosure_override ? (
              <div className="mt-4 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-900">
                Konten ini membutuhkan disclosure AI sebelum production.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <form action={saveJobReviewMetadata} className="mt-5 grid gap-4">
        <input name="job_id" type="hidden" value={jobId} />
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Judul Final
            <input name="final_title" defaultValue={summary.final_title || summary.recommended_title || ""} placeholder={summary.recommended_title || "Judul final"} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Caption Final
            <textarea name="final_caption" rows={3} defaultValue={summary.final_caption || summary.recommended_caption || ""} placeholder={summary.recommended_caption || "Caption final"} />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          Deskripsi Singkat
          <textarea
            name="final_description"
            rows={3}
            defaultValue={summary.final_description || summary.recommended_short_description || ""}
            placeholder={summary.recommended_short_description || "Deskripsi singkat"}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Hashtag Final
          <input name="final_hashtags" defaultValue={(summary.final_hashtags || summary.recommended_hashtags).join(", ")} placeholder="#Shorts, #Gaming, #Football" />
        </label>

        <div className="grid gap-3 lg:grid-cols-3">
          {uploadModes.map((option) => (
            <ModeCard key={option.mode} option={option} selected={option.mode === summary.selected_upload_mode} />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex items-start gap-2 text-sm font-semibold text-gray-700">
            <input className="ta-check mt-1" name="ai_disclosure_acknowledged" type="checkbox" defaultChecked={summary.ai_disclosure_acknowledged} />
            <span>Label AI sudah dicek dan diakui.</span>
          </label>
          <label className="flex items-start gap-2 text-sm font-semibold text-gray-700">
            <input className="ta-check mt-1" name="ai_disclosure_override" type="checkbox" defaultChecked={summary.ai_disclosure_override} />
            <span>Override AI disclosure dicatat untuk review manual.</span>
          </label>
        </div>

        <label className="grid gap-2 text-sm font-semibold">
          Catatan Review Operator
          <textarea name="operator_review_notes" rows={4} defaultValue={summary.operator_review_notes || ""} placeholder="Catatan review, alasan penyesuaian, atau risiko yang perlu diingat." />
        </label>

        <div className="flex flex-wrap gap-3">
          {canOperate ? (
            <button className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white" type="submit">
              Simpan Metadata
            </button>
          ) : null}
          <Link className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href="#detail-teknis">
            Detail Teknis
          </Link>
        </div>
      </form>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label text-brand-600">Riwayat Upload</p>
          <div className="mt-3 space-y-3">
            {latestUploads.length ? (
              latestUploads.map((upload) => (
                <div key={upload.id} className="rounded-xl border border-gray-200 bg-white p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-gray-900">{upload.status}</strong>
                    <span className="ta-status bg-gray-100 text-gray-700">{upload.privacy_status}</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{upload.created_at}</p>
                </div>
              ))
            ) : (
              <div className="ta-empty">Belum ada riwayat upload.</div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label text-brand-600">Ringkasan Publikasi</p>
          <div className="mt-3 space-y-2">
            <SummaryRow label="Latest upload status" value={publishState.latest_upload?.status || "Pending"} />
            <SummaryRow label="Mode upload" value={summary.selected_upload_mode} />
            <SummaryRow label="Privacy status" value={publishState.youtube.privacy_status || "private"} />
            <SummaryRow label="Publish ready" value={publishState.ready_to_push ? "Ya" : "Belum"} />
          </div>
        </div>
      </div>

      <details className="mt-5 rounded-2xl border border-gray-200 bg-white p-5" id="detail-teknis">
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="ta-label text-brand-600">Detail Teknis</p>
              <h4 className="mt-2 text-lg font-semibold text-gray-900">Manifest, raw payload, dan event</h4>
            </div>
            <span className="ta-status bg-gray-100 text-gray-700">Tutup / buka</span>
          </div>
        </summary>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="ta-label text-brand-600">Manifest</p>
            <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-white">{JSON.stringify(detail.manifest || {}, null, 2)}</pre>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="ta-label text-brand-600">Approval status</p>
            <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-white">{JSON.stringify(summary.approval_status || {}, null, 2)}</pre>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="ta-label text-brand-600">Job events</p>
            <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-white">{JSON.stringify(detail.job_events || [], null, 2)}</pre>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="ta-label text-brand-600">Upload records</p>
            <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-white">{JSON.stringify(detail.uploads || [], null, 2)}</pre>
          </div>
        </div>
      </details>
    </div>
  );
}
