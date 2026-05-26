import Link from "next/link";
import { saveJobReviewMetadata } from "../app/jobs/actions";
import type { JobDetailPayload, PublishStatePayload, ReviewSummary } from "../lib/engine-types";
import {
  businessAiDisclosureStatus,
  businessChecklistState,
  businessRightsStatus,
  businessUploadModeOptions,
  summaryText,
} from "../lib/business-copy";
import { operatorDecisionForJob } from "../lib/operator-workflow";

function readBool(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "yes" || normalized === "1";
  }
  return null;
}

function SummaryRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <span className="ta-label">{label}</span>
      <span className="max-w-[72%] break-words text-right text-sm text-gray-700">{value}</span>
    </div>
  );
}

function checklistCard(title: string, lines: Array<{ label: string; value: string; tone: string }>) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="ta-label text-brand-600">{title}</p>
      <div className="mt-3 space-y-2">
        {lines.map((line) => (
          <div key={line.label} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2">
            <span className="text-sm text-gray-700">{line.label}</span>
            <span className={`ta-status ${line.tone}`}>{line.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function mainStatus(summary: ReviewSummary) {
  if (summary.production_allowed && summary.selected_upload_mode === "production_private") {
    return { label: "Siap Production", tone: "bg-success-50 text-success-700", reason: "Semua syarat produksi lolos dan mode production private aktif." };
  }
  if (summary.production_allowed && summary.selected_upload_mode === "private_validation") {
    return { label: "Siap Upload Private", tone: "bg-success-50 text-success-700", reason: "Video aman untuk cek private sebelum production." };
  }
  if (!summary.production_allowed && summary.production_blockers.length) {
    return { label: "Belum Boleh Upload", tone: "bg-error-50 text-error-700", reason: summary.production_blockers[0] };
  }
  return { label: "Perlu Review", tone: "bg-warning-50 text-warning-700", reason: "Masih ada data review atau policy yang perlu dilengkapi." };
}

function statusTone(label: string) {
  if (label === "Siap Production" || label === "Siap Upload Private") {
    return "bg-success-50 text-success-700";
  }
  if (label === "Belum Boleh Upload") {
    return "bg-error-50 text-error-700";
  }
  return "bg-warning-50 text-warning-700";
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

  const status = mainStatus(summary);
  const rights = detail.rights_assessment || {};
  const uploadModes = businessUploadModeOptions(summary.available_upload_modes);
  const decision = operatorDecisionForJob(detail.job, detail.review_summary || publishState.review_summary, publishState);

  return (
    <div className="ta-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="ta-label text-brand-600">Review & Upload</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Status utama video</h3>
          <p className="mt-2 text-sm text-gray-500">{status.reason}</p>
        </div>
        <span className={`ta-status ${status.tone}`}>{status.label}</span>
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
        {decision.blockerReason ? <p className="mt-3 rounded-xl border border-warning-200 bg-warning-50 px-3 py-2 text-sm text-warning-900">{decision.blockerReason}</p> : null}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Status Utama</p>
          <strong className={`mt-2 block ${statusTone(status.label)}`}>{status.label}</strong>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Preview Video</p>
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
      </div>

      {!summary.production_allowed ? (
        <div className="mt-4 rounded-2xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-900">
          <strong className="block">Belum siap production</strong>
          <p className="mt-2">Alasan: {status.reason}</p>
          <p className="mt-2">Yang perlu dilakukan: perbaiki blocker di bawah, lalu simpan metadata lagi.</p>
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        <p className="ta-label text-brand-600">Panduan singkat</p>
        <p className="mt-2">Private Test hanya untuk validasi teknis.</p>
        <p className="mt-1">Production hanya boleh jika copyright, musik, visual, dan disclosure sudah aman.</p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label text-brand-600">Preview ringkas</p>
          <div className="mt-3 space-y-3">
            <SummaryRow label="Judul Final" value={summaryText(summary.final_title || summary.recommended_title)} />
            <SummaryRow label="Caption Final" value={summaryText(summary.final_caption || summary.recommended_caption)} />
            <SummaryRow label="Deskripsi Singkat" value={summaryText(summary.final_description || summary.recommended_short_description)} />
            <SummaryRow label="Hashtag Final" value={(summary.final_hashtags || summary.recommended_hashtags).join(" ") || "Belum diisi"} />
            <SummaryRow label="Alasan Rekomendasi" value={summary.caption_reason || "Belum ada alasan"} />
            <SummaryRow label="Catatan Keamanan" value={(summary.safety_notes || []).join(" | ") || "Tidak ada catatan"} />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label text-brand-600">Status copy</p>
          <div className="mt-3 grid gap-3">
            <div id="copyright-detail" className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="ta-label text-brand-600">Status copyright</p>
              <SummaryRow label="Copyright" value={businessRightsStatus(summary).label} />
              <SummaryRow label="Risiko Konten Ulang" value={String(summary.reused_content_risk || "unknown").toUpperCase()} />
              <SummaryRow label="Production blockers" value={summary.production_blockers.join("; ") || "Tidak ada"} />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <SummaryRow label="Konten AI" value={summary.ai_generated ? "Ya" : "Tidak"} />
              <SummaryRow label="Terlihat realistis" value={summary.realistic_synthetic_content ? "Ya" : "Tidak"} />
              <SummaryRow label="Butuh disclosure" value={summary.needs_ai_disclosure ? "Ya" : "Tidak"} />
              <SummaryRow label="Status disclosure" value={businessAiDisclosureStatus(summary).label} />
              {summary.needs_ai_disclosure ? (
                <p className="mt-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-900">
                  Konten ini membutuhkan disclosure AI/synthetic content sebelum production upload.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {canOperate ? (
        <form action={saveJobReviewMetadata} className="mt-5 grid gap-4">
          <input name="job_id" type="hidden" value={jobId} />
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Judul Final
              <input name="final_title" defaultValue={summary.final_title || summary.recommended_title || ""} placeholder={summary.recommended_title || "Judul final"} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Mode Upload
              <select name="selected_upload_mode" defaultValue={summary.selected_upload_mode}>
                {uploadModes.map((option) => (
                  <option key={option.mode} value={option.mode} disabled={!option.allowed}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="text-xs font-normal text-gray-500">Default aman adalah Upload Private Test. Production nonaktif jika gate rights gagal.</span>
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Caption Final
            <textarea name="final_caption" rows={3} defaultValue={summary.final_caption || summary.recommended_caption || ""} placeholder={summary.recommended_caption || "Caption final"} />
          </label>
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
            <input
              name="final_hashtags"
              defaultValue={(summary.final_hashtags || summary.recommended_hashtags).join(", ")}
              placeholder="#Shorts, #Gaming, #Football"
            />
          </label>
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
          <div className="grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 lg:grid-cols-2">
            <div>
              <p className="ta-label text-brand-600">Alasan Caption</p>
              <p className="mt-1 whitespace-pre-wrap">{summary.caption_reason || "Belum ada alasan caption."}</p>
            </div>
            <div>
              <p className="ta-label text-brand-600">Sumber Context</p>
              <p className="mt-1">{(summary.source_context_used || []).join(", ") || "Tidak ada context tercatat."}</p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {checklistCard("Cek Keamanan Copyright", [
              { label: "Script original", value: businessChecklistState(readBool(rights.script_original)).label, tone: businessChecklistState(readBool(rights.script_original)).tone },
              { label: "Voice-over legal", value: businessChecklistState(summary.voiceover_legal ?? readBool(rights.voiceover_legal)).label, tone: businessChecklistState(summary.voiceover_legal ?? readBool(rights.voiceover_legal)).tone },
              { label: "Visual aman", value: businessChecklistState(summary.visual_rights_ok ?? readBool(rights.visual_rights_ok)).label, tone: businessChecklistState(summary.visual_rights_ok ?? readBool(rights.visual_rights_ok)).tone },
              { label: "Musik berlisensi", value: businessChecklistState(summary.music_rights_ok ?? readBool(rights.music_rights_ok)).label, tone: businessChecklistState(summary.music_rights_ok ?? readBool(rights.music_rights_ok)).tone },
              {
                label: "Source audio aman",
                value: businessChecklistState(readBool(rights.source_audio_licensed) ?? summary.source_audio_status === "licensed").label,
                tone: businessChecklistState(readBool(rights.source_audio_licensed) ?? summary.source_audio_status === "licensed").tone,
              },
              { label: "Copyright acknowledged", value: businessChecklistState(summary.copyright_acknowledged).label, tone: businessChecklistState(summary.copyright_acknowledged).tone },
            ])}
            {checklistCard("Cek Label AI", [
              { label: "Konten AI", value: summary.ai_generated ? "Ya" : "Tidak", tone: summary.ai_generated ? "bg-brand-50 text-brand-700" : "bg-gray-100 text-gray-700" },
              { label: "Terlihat realistis", value: summary.realistic_synthetic_content ? "Ya" : "Tidak", tone: summary.realistic_synthetic_content ? "bg-warning-50 text-warning-700" : "bg-success-50 text-success-700" },
              { label: "Butuh disclosure", value: summary.needs_ai_disclosure ? "Ya" : "Tidak", tone: summary.needs_ai_disclosure ? "bg-warning-50 text-warning-700" : "bg-success-50 text-success-700" },
              { label: "Status disclosure", value: businessAiDisclosureStatus(summary).label, tone: businessAiDisclosureStatus(summary).tone },
            ])}
            {checklistCard("Mode Upload", uploadModes.map((option) => ({
              label: option.label,
              value: option.allowed ? "Siap" : option.reason || "Diblokir",
              tone: option.allowed ? "bg-success-50 text-success-700" : "bg-warning-50 text-warning-700",
            })))}
          </div>
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
            <p className="ta-label text-brand-600">Penjelasan mode</p>
            <p className="mt-2">Upload Private Test dipakai untuk validasi teknis. Production hanya muncul bila gate rights mengizinkan.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white" type="submit">
              Simpan Metadata
            </button>
            <Link className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href="#copyright-detail">
              Cek Detail Copyright
            </Link>
            <Link className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href="#detail-teknis">
              Lihat Detail Teknis
            </Link>
          </div>
        </form>
      ) : (
        <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          Operator dapat melihat ringkasan review, tetapi tidak dapat mengubah metadata.
        </div>
      )}
    </div>
  );
}
