import { getChannelBusinessProfile } from "./channel-profiles";
import type { ChannelConfig } from "./engine-types";

const STATUS_LABELS: Record<string, string> = {
  queued: "Menunggu",
  searching: "Menunggu",
  pending: "Menunggu",
  downloaded: "Sedang Diproses",
  transcribed: "Sedang Diproses",
  planned: "Sedang Diproses",
  voiceover: "Sedang Diproses",
  rendering: "Sedang Diproses",
  uploading: "Sedang Diproses",
  processing: "Sedang Diproses",
  rendered: "Siap Review",
  uploaded: "Sudah Upload Private",
  published: "Sudah Upload Private",
  draft_ready: "Siap Review",
  completed: "Selesai",
  paused: "Dijeda",
  blocked: "Diblokir",
  failed: "Gagal",
  cancelled: "Gagal",
  canceled: "Gagal",
  ready: "Siap",
  ok: "OK",
  active: "Aktif",
  enabled: "Aktif",
  disabled: "Disabled",
  missing: "Missing",
  warning: "Perlu Review",
  review: "Perlu Review",
  approved: "Disetujui",
  revoked: "Dicabut",
  expired: "Kedaluwarsa",
};

const UPLOAD_MODE_LABELS: Record<string, string> = {
  private_validation: "Upload Private Test",
  production_private: "Production Private",
  production_public_or_scheduled: "Production Public / Scheduled",
};

const BLOCKER_LABELS: Record<string, string> = {
  source_rate_limited: "Sumber video sedang dibatasi.",
  local_source_invalid: "File sumber tidak ditemukan atau tidak valid.",
  missing_token: "Channel perlu login ulang YouTube.",
  missing_client_secret: "Client secret belum tersedia.",
  missing_curated_sources: "Sumber kurasi belum lengkap.",
  service_down: "Service perlu perhatian.",
  database_unavailable: "PostgreSQL belum tersedia.",
  queue_unavailable: "Antrian belum aktif.",
  worker_unavailable: "Worker belum aktif.",
  publisher_unavailable: "Publisher belum aktif.",
  quota_low: "Kuota rendah.",
  quota_exhausted: "Kuota habis.",
  channel_login_missing: "Login channel perlu diperbarui.",
  safe_source_missing: "Sumber belum terdaftar aman.",
  licensed_music_missing: "Musik berlisensi belum tersedia.",
  production_policy_not_configured: "Aturan produksi belum lengkap.",
  "reused_content_risk=high": "Aset belum memenuhi syarat sistem.",
};

const SETTING_STATUS_LABELS: Record<string, string> = {
  ok: "OK",
  aktif: "Aktif",
  active: "Aktif",
  enabled: "Aktif",
  ready: "Aktif",
  missing: "Missing",
  perlu_review: "Perlu Review",
  review: "Perlu Review",
  warning: "Perlu Review",
  disabled: "Disabled",
  nonaktif: "Disabled",
};

const LABELS = {
  dashboard: "Dashboard",
  production: "Produksi Video",
  reviewUpload: "Review & Upload",
  channel: "Channel",
  report: "Laporan",
  settings: "Pengaturan",
  technicalDetail: "Detail Teknis",
  operatorNotes: "Catatan Operator",
  uploadHistory: "Riwayat Upload",
  processHistory: "Riwayat Proses",
  loading: "Memuat",
  unavailable: "Belum tersedia",
} as const;

export type LabelKey = keyof typeof LABELS;

export function tLabel(key: LabelKey) {
  return LABELS[key];
}

function normalize(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function sentenceCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatStatus(status?: string | null) {
  const normalized = normalize(status);
  if (!normalized) return "Belum tersedia";
  return STATUS_LABELS[normalized] || sentenceCase(status || "");
}

export function formatBoolean(value?: boolean | null, context: "default" | "status" | "gate" = "default") {
  if (value === null || value === undefined) return "Belum tersedia";
  if (context === "status") {
    return value ? "Aktif" : "Nonaktif";
  }
  if (context === "gate") {
    return value ? "Aman" : "Perlu Review";
  }
  return value ? "Ya" : "Tidak";
}

export function formatUploadMode(mode?: string | null) {
  const normalized = normalize(mode);
  if (!normalized) return "Belum tersedia";
  return UPLOAD_MODE_LABELS[normalized] || sentenceCase(mode || "");
}

export function formatBlocker(code?: string | null) {
  const normalized = normalize(code);
  if (!normalized) return "Belum tersedia";
  return BLOCKER_LABELS[normalized] || sentenceCase(code || "");
}

export function formatTechnicalValue(value: unknown): string {
  if (value === null || value === undefined) return "Belum tersedia";
  if (typeof value === "boolean") return formatBoolean(value);
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "Belum tersedia";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "Belum tersedia";
    const normalized = normalize(trimmed);
    if (STATUS_LABELS[normalized]) return STATUS_LABELS[normalized];
    if (UPLOAD_MODE_LABELS[normalized]) return UPLOAD_MODE_LABELS[normalized];
    return sentenceCase(trimmed);
  }
  if (Array.isArray(value)) {
    if (!value.length) return "Belum tersedia";
    return value.map((item) => formatTechnicalValue(item)).join(", ");
  }
  return "Data teknis tersedia";
}

export function formatChannelProfile(channel: Pick<ChannelConfig, "niche" | "id"> & { display_name?: string | null }) {
  return getChannelBusinessProfile(channel).niche_label;
}

export function formatChannelName(channel: Pick<ChannelConfig, "niche" | "id"> & { display_name?: string | null }) {
  return channel.display_name || getChannelBusinessProfile(channel).display_name || "Channel";
}

export function formatSettingStatus(status?: string | null) {
  const normalized = normalize(status);
  if (!normalized) return "Belum tersedia";
  return SETTING_STATUS_LABELS[normalized] || sentenceCase(status || "");
}

export function formatIssueList(issues: string[]) {
  if (!issues.length) return "Tidak ada";
  return issues.map((issue) => formatBlocker(issue)).join(", ");
}
