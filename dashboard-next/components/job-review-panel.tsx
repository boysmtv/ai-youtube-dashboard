import Link from "next/link";
import type { JobRecord, PublishStatePayload, ReviewModeOption, ReviewSummary, TitleVariantRecord } from "../lib/engine-types";
import {
  businessAiDisclosureStatus,
  businessChecklistState,
  businessRiskStatus,
  businessRightsStatus,
  businessUploadStatus,
  businessUploadModeLabel,
  businessUploadModeOptions,
  summaryText,
} from "../lib/business-copy";
import { saveJobReviewMetadata } from "../app/jobs/actions";
import { JobTechnicalPanel } from "./job-technical-panel";

function SummaryRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <span className="ta-label">{label}</span>
      <span className="max-w-[72%] break-words text-right text-sm text-gray-700">{value}</span>
    </div>
  );
}

function normalizeHashtag(tag: string) {
  const cleaned = String(tag || "").trim();
  if (!cleaned) return "";
  const withoutPrefix = cleaned.replace(/^#+/, "");
  const normalized = withoutPrefix.replace(/[^A-Za-z0-9_]+/g, "");
  if (!normalized) return "";
  return normalized.toLowerCase() === "shorts" ? "#Shorts" : `#${normalized}`;
}

function HashtagPills({
  hashtags,
  emptyLabel = "Belum diisi",
}: Readonly<{
  hashtags: string[];
  emptyLabel?: string;
}>) {
  const normalized = Array.from(
    new Map(
      hashtags
        .map(normalizeHashtag)
        .filter(Boolean)
        .map((item) => [item.toLowerCase(), item]),
    ).values(),
  );

  if (!normalized.length) {
    return <span className="text-sm text-gray-500">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {normalized.map((tag) => (
        <span key={tag} className="rounded-full border border-brand-100 bg-brand-25 px-3 py-1 text-xs font-semibold text-brand-700">
          {tag}
        </span>
      ))}
    </div>
  );
}

function TitleVariantList({ variants }: Readonly<{ variants: TitleVariantRecord[] }>) {
  if (!variants.length) {
    return <div className="text-sm text-gray-500">Belum ada title variant dari engine.</div>;
  }

  return (
    <div className="grid gap-2">
      {variants.slice(0, 4).map((variant) => (
        <div key={`${variant.job_id}-${variant.variant_rank}-${variant.title}`} className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <strong className="block text-sm text-gray-900">{variant.title}</strong>
              <p className="mt-1 text-xs text-gray-500">{variant.reason}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="ta-status bg-gray-100 text-gray-700">Skor {variant.score}</span>
              {variant.selected ? <span className="ta-status bg-success-50 text-success-700">Dipilih engine</span> : null}
            </div>
          </div>
        </div>
      ))}
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

function checklistStatusLabel(value: boolean | null | undefined, blockedWhenFalse = false) {
  if (value === true) return businessChecklistState(true);
  if (value === false && blockedWhenFalse) return { label: "Diblokir", tone: "bg-error-50 text-error-700" };
  if (value === false) return businessChecklistState(false);
  return { label: "Perlu Review", tone: "bg-warning-50 text-warning-700" };
}

function sourceAudioStatus(summary: ReviewSummary) {
  const normalized = String(summary.source_audio_status || "").toLowerCase();
  if (summary.source_audio_licensed === true) return { label: "Aman", tone: "bg-success-50 text-success-700" };
  if (summary.source_audio_licensed === false) return { label: "Diblokir", tone: "bg-error-50 text-error-700" };
  if (normalized.includes("allow") || normalized.includes("ready") || normalized.includes("licensed")) {
    return { label: "Aman", tone: "bg-success-50 text-success-700" };
  }
  if (normalized.includes("block") || normalized.includes("missing")) {
    return { label: "Diblokir", tone: "bg-error-50 text-error-700" };
  }
  return { label: "Perlu Review", tone: "bg-warning-50 text-warning-700" };
}

function riskStatus(summary: ReviewSummary) {
  return businessRiskStatus(summary.reused_content_risk);
}

export function JobReviewPanel({
  job,
  reviewSummary,
  titleVariants,
  publishState,
  canOperate,
  previewReady,
  previewUrl,
  sourceTitle,
  sourceDescription,
  sourceUrl,
  stateView,
  technicalHref,
}: Readonly<{
  job: JobRecord;
  reviewSummary: ReviewSummary | null;
  titleVariants: TitleVariantRecord[];
  publishState: Pick<PublishStatePayload, "approvals" | "youtube" | "tiktok" | "latest_upload" | "latest_uploads" | "review_summary" | "ready_to_push">;
  canOperate: boolean;
  previewReady: boolean;
  previewUrl: string | null;
  sourceTitle: string | null;
  sourceDescription: string | null;
  sourceUrl: string | null;
  stateView: "default" | "redis";
  technicalHref: string;
}>) {
  const summary = reviewSummary || publishState.review_summary;
  if (!summary) {
    return (
      <div className="ta-panel p-5">
        <p className="ta-label text-brand-600">Review & Upload</p>
        <h3 className="mt-2 text-lg font-semibold text-gray-900">Data review belum tersedia.</h3>
      </div>
    );
  }

  const uploadModes = businessUploadModeOptions(summary.available_upload_modes);
  const operatorAlerts = summary.operator_alerts || [];
  const latestUploads = (publishState.latest_uploads || (publishState.latest_upload ? [publishState.latest_upload] : [])).slice(0, 3);
  const scriptStatus = riskStatus(summary);
  const sourceAudio = sourceAudioStatus(summary);
  const aiLabel = businessAiDisclosureStatus(summary);
  const rightsLabel = businessRightsStatus(summary);
  const productionAllowed = Boolean(summary.production_ready ?? summary.auto_copyright_approved);
  const systemReason = summary.system_compliance_reason || (productionAllowed ? "Semua aset memenuhi aturan sistem." : "Aset belum memenuhi syarat sistem.");
  const systemNextAction = summary.system_compliance_next_action || (productionAllowed ? "Lanjutkan Upload Private Test atau Production sesuai mode yang tersedia." : "Lengkapi konfigurasi aset aman.");
  const productionReady = productionAllowed;
  const selectedTitle =
    summary.final_title ||
    summary.recommended_title ||
    titleVariants.find((variant) => variant.selected)?.title ||
    titleVariants[0]?.title ||
    job.selected_title ||
    "Belum tersedia";
  const selectedHashtags = summary.final_hashtags.length ? summary.final_hashtags : summary.recommended_hashtags;

  return (
    <div className="ta-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="ta-label text-brand-600">Review & Upload</p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">Decision center video</h3>
          <p className="mt-2 text-sm text-gray-500">Cek status utama, metadata final, dan compliance sistem lalu pilih mode upload yang tersedia.</p>
        </div>
        <span className={`ta-status ${rightsLabel.tone}`}>{rightsLabel.label}</span>
      </div>

      <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-25 p-4">
        <p className="ta-label text-brand-600">Langkah Berikutnya</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <strong className="block text-gray-900">{productionReady ? "Aman berdasarkan aturan sistem" : rightsLabel.label}</strong>
            <p className="mt-1 text-sm text-gray-600">{systemReason}</p>
          </div>
          <Link className="ta-button" href={productionReady ? "#review" : "#detail-teknis"}>
            {productionReady ? "Lanjut Upload Private Test" : "Perbaiki Kebutuhan Sistem"}
          </Link>
        </div>
        <p className="mt-3 text-sm text-gray-700">{systemNextAction}</p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Preview Video</p>
          <strong className="mt-2 block text-gray-900">{previewReady ? "Tersedia" : "Belum tersedia"}</strong>
          {previewReady && previewUrl ? (
            <a className="mt-3 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700" href={previewUrl} target="_blank" rel="noreferrer">
              Buka preview
            </a>
          ) : null}
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Status Utama</p>
          <strong className={`mt-2 block ${productionReady ? "text-success-700" : "text-warning-700"}`}>{rightsLabel.label}</strong>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Judul Final</p>
          <strong className="mt-2 block text-gray-900">{summaryText(summary.final_title || summary.recommended_title)}</strong>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Status Upload</p>
          <strong className="mt-2 block text-gray-900">{businessUploadModeLabel(summary.selected_upload_mode)}</strong>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label text-brand-600">Metadata Final</p>
          <div className="mt-3 rounded-2xl border border-brand-100 bg-white p-4">
            <p className="ta-label text-brand-600">Judul Shorts</p>
            <strong className="mt-2 block text-gray-900">{summaryText(selectedTitle)}</strong>
            <p className="mt-2 text-xs text-gray-500">Judul ini mengikuti output engine dan bisa disesuaikan sebelum upload.</p>
            <div className="mt-3">
              <HashtagPills hashtags={selectedHashtags} />
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
            <p className="ta-label text-brand-600">Title Variants Engine</p>
            <div className="mt-3">
              <TitleVariantList variants={titleVariants} />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <SummaryRow label="Judul Final" value={summaryText(summary.final_title || summary.recommended_title)} />
            <SummaryRow label="Caption Final" value={summaryText(summary.final_caption || summary.recommended_caption)} />
            <SummaryRow label="Deskripsi Singkat" value={summaryText(summary.final_description || summary.recommended_short_description)} />
            <SummaryRow label="Hashtag Final" value={(summary.final_hashtags || summary.recommended_hashtags).join(" ") || "Belum diisi"} />
            <SummaryRow label="Catatan Operator" value={summary.operator_review_notes || "Belum ada catatan"} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="ta-label text-brand-600">Sumber Asli</p>
            <div className="mt-3 space-y-2">
              <SummaryRow label="Judul sumber" value={sourceTitle || job.selected_title || "Belum tersedia"} />
              <SummaryRow label="Deskripsi sumber" value={sourceDescription || "Deskripsi sumber tidak tersimpan di manifest."} />
              <SummaryRow label="URL sumber" value={sourceUrl || "Belum tersedia"} />
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="ta-label text-brand-600">Cek Keamanan Sistem</p>
            <div className="mt-3 space-y-2">
              <SummaryRow label="Status Sistem" value={rightsLabel.label} />
              <SummaryRow label="Naskah asli" value={scriptStatus.label} />
              <SummaryRow label="Voice-over legal" value={checklistStatusLabel(summary.voiceover_legal).label} />
              <SummaryRow label="Visual aman" value={checklistStatusLabel(summary.visual_rights_ok).label} />
              <SummaryRow label="Musik berlisensi" value={checklistStatusLabel(summary.music_rights_ok).label} />
              <SummaryRow label="Source audio aman untuk production" value={sourceAudio.label} />
              <SummaryRow label="Risiko konten ulang" value={riskStatus(summary).label} />
              <SummaryRow label="Label AI" value={aiLabel.label} />
            </div>
            {operatorAlerts.length ? (
              <div className="mt-4 grid gap-3">
                {operatorAlerts.map((alert) => {
                  const item = alert as Record<string, unknown>;
                  return (
                    <div key={`${String(item.type || item.label || "alert")}-${String(item.reason || "")}`} className="rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-900">
                      <strong className="block">{String(item.label || "Perhatian Sistem")}</strong>
                      <p className="mt-2">{String(item.reason || "Ada kebutuhan sistem yang perlu ditangani.")}</p>
                      <p className="mt-2 text-xs text-warning-800">Langkah berikutnya: {String(item.next_action || "Tindak lanjuti kebutuhan sistem.")}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-900">Sistem siap berjalan.</div>
            )}
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="ta-label text-brand-600">Kebutuhan AI</p>
            <div className="mt-3 space-y-2">
              <SummaryRow label="Status disclosure" value={aiLabel.label} />
              <SummaryRow label="Kondisi konten" value={summary.needs_ai_disclosure ? "Label AI perlu dikonfigurasi" : "Tidak perlu label AI"} />
              <SummaryRow label="Arah sistem" value={summary.system_compliance_next_action || "Selesaikan konfigurasi yang dibutuhkan."} />
            </div>
            {summary.system_compliance_status === "blocked_ai_disclosure" ? (
              <div className="mt-4 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-900">
                Label AI perlu dikonfigurasi sebelum konten ini bisa masuk production.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <form action={saveJobReviewMetadata} className="mt-5 grid gap-4">
        <input name="job_id" type="hidden" value={job.id} />
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
            <span>Label AI sudah dikonfigurasi sesuai metadata.</span>
          </label>
          <label className="flex items-start gap-2 text-sm font-semibold text-gray-700">
            <input className="ta-check mt-1" name="ai_disclosure_override" type="checkbox" defaultChecked={summary.ai_disclosure_override} />
            <span>Override AI disclosure dicatat untuk kebutuhan admin.</span>
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
              <SummaryRow label="Status Upload Terakhir" value={publishState.latest_upload ? businessUploadStatus(publishState.latest_upload.status) : "Menunggu"} />
              <SummaryRow label="Mode Upload" value={businessUploadModeLabel(summary.selected_upload_mode)} />
              <SummaryRow label="Status Channel" value={publishState.youtube.privacy_status === "private" ? "Private" : "Belum tersedia"} />
              <SummaryRow label="Publish Siap" value={publishState.ready_to_push ? "Siap" : "Belum siap"} />
            </div>
          </div>
        </div>

      <JobTechnicalPanel jobId={job.id} stateView={stateView} technicalHref={technicalHref} />
    </div>
  );
}
