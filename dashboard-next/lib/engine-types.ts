export type HealthPayload = {
  status: string;
  generated_at: string;
};

export type RuntimeHealthPayload = {
  status: "ok" | "fail";
  generated_at: string;
  timezone: string;
  stuck_threshold_minutes: number;
  counts: {
    queued_jobs: number;
    active_jobs: number;
    failed_jobs: number;
    stuck_jobs: number;
  };
  disk: {
    free_gb: number;
    required_gb: number;
    ok: boolean;
  };
  storage: {
    managed_gb: number;
    budget_gb: number;
    ok: boolean;
  };
  quota: {
    ok: boolean;
    blocked_projects: Array<Record<string, unknown>>;
  };
  credentials: {
    checked: boolean;
    ok: boolean;
    missing: Array<Record<string, unknown>>;
  };
  recovery: {
    attempted: boolean;
    recovered_stuck_jobs: number;
    requeued_failed_jobs: number;
  };
  blocking_jobs: Array<Record<string, unknown>>;
  warnings: string[];
  errors: string[];
  checks: Array<{
    code: string;
    ok: boolean;
    value: string;
  }>;
};

export type ChannelReadinessItem = {
  channel_id: string;
  display_name: string;
  enabled: boolean;
  placeholder: boolean;
  niche: string;
  language: string;
  gcp_project_id: string;
  publish_slots: string[];
  upload_ready: boolean;
  paths: {
    client_secret_path: string;
    token_path: string;
    curated_sources_path: string;
    client_secret_exists: boolean;
    token_exists: boolean;
    curated_sources_exists: boolean;
  };
  quota: {
    daily_quota_units: number;
    quota_reserve_units: number;
    upload_cost_units: number;
    usable_quota_units: number;
  };
  job_counts: Record<string, number>;
  latest_job: JobRecord | null;
  last_upload: Record<string, unknown> | null;
  upload_preflight: ChannelConfig["upload_preflight"];
  retention: RetentionPolicy;
  oauth_validation?: Record<string, unknown> | null;
  checks: Array<{
    code: string;
    label: string;
    ok: boolean;
    value: string;
  }>;
  readiness_score: number;
  issues: string[];
};

export type ChannelReadinessPayload = {
  generated_at: string;
  count: number;
  items: ChannelReadinessItem[];
};

export type JobRecord = {
  id: number;
  channel_id: string;
  gcp_project_id: string;
  niche: string;
  language: string;
  publish_at: string;
  status: string;
  manifest_path?: string | null;
  output_dir?: string | null;
  retry_count: number;
  last_error?: string | null;
};

export type JobParameters = {
  job_id: number;
  enable_upload: boolean;
  upload_approval: string;
  approval_operator_name: string;
  approval_reason: string;
  require_credentials: boolean;
  keep_downloads: boolean;
  max_retries: number | null;
  source: string;
  created_at: string;
  updated_at: string;
};

export type ChannelConfig = {
  id: string;
  display_name: string;
  niche: string;
  language: string;
  gcp_project_id: string;
  client_secret_path: string;
  token_path: string;
  curated_sources_path: string;
  publish_slots: string[];
  enabled: boolean;
  placeholder: boolean;
  upload_preflight: {
    require_client_secret: boolean;
    require_token: boolean;
    require_curated_sources: boolean;
    require_publish_slots: boolean;
    validate_oauth_credentials: boolean;
    auto_bootstrap_allowed: boolean;
  };
  retention?: RetentionPolicy | null;
};

export type RetentionPolicy = {
  enabled: boolean;
  auto_cleanup_on_worker_start: boolean;
  auto_cleanup_on_scheduler_tick: boolean;
  keep_recent_job_dirs: number;
  delete_downloads_first: boolean;
  cleanup_interval_hours: number;
};

export type WorkerConfig = {
  max_active_jobs: number;
  min_free_disk_gb: number;
  publish_lead_time_hours: number;
};

export type GcpProjectConfig = {
  id: string;
  display_name: string;
  daily_quota_units: number;
  quota_reserve_units: number;
  upload_cost_units: number;
};

export type RegistryPayload = {
  schema_version: number;
  timezone: string;
  storage_budget_gb: number;
  worker: WorkerConfig;
  retention: RetentionPolicy;
  upload_approval: UploadGuard;
  default_publish_slots: string[];
  gcp_projects: GcpProjectConfig[];
  channels: ChannelConfig[];
};

export type JobCreatePayload = {
  channel_id: string;
  publish_at: string;
  niche?: string;
  language?: string;
  status?: "queued" | "paused";
  enable_upload?: boolean;
  upload_approval?: string;
  approval_operator_name?: string;
  approval_reason?: string;
  require_credentials?: boolean;
  keep_downloads?: boolean;
  max_retries?: number | null;
};

export type JobMutationResult = {
  status: string;
  job?: JobRecord;
  parameters?: JobParameters;
  job_id?: number | null;
  manifest_path?: string | null;
  output_dir?: string | null;
  message?: string;
};

export type UploadGuard = {
  enabled: boolean;
  confirmation_text: string;
  reason: string;
  session_minutes: number;
  require_operator_name: boolean;
  require_reason: boolean;
};

export type OverviewPayload = {
  generated_at: string;
  date: string;
  timezone: string;
  channels: {
    enabled: number;
    configured: number;
  };
  worker: {
    max_active_jobs: number;
    min_free_disk_gb: number;
    publish_lead_time_hours: number;
  };
  upload_guard: UploadGuard;
  storage: Record<string, number>;
  job_counts: Record<string, number>;
  jobs_by_channel: Record<string, number>;
  quota: Array<Record<string, unknown>>;
  jobs: JobRecord[];
  recent_attempts: Array<Record<string, unknown>>;
  recent_events: Array<Record<string, unknown>>;
};

export type ApprovalAudit = {
  id: number;
  job_id: number | null;
  action: string;
  operator_name: string;
  approval_reason: string;
  session_minutes: number;
  guard_requires_operator_name: boolean;
  guard_requires_reason: boolean;
  created_at: string;
};

export type RuntimeEvent = {
  timestamp?: string;
  command?: string;
  event?: string;
  details?: Record<string, unknown>;
};

export type StageAttempt = {
  id: number;
  job_id: number;
  stage: string;
  status: string;
  error_message?: string | null;
  started_at: string;
  finished_at?: string | null;
};

export type ArtifactRecord = {
  id: number;
  job_id: number;
  kind: string;
  path: string;
  exists?: boolean;
  size_bytes?: number | null;
  created_at: string;
};

export type UploadRecord = {
  id: number;
  job_id: number;
  youtube_video_id?: string | null;
  youtube_url?: string | null;
  privacy_status: string;
  publish_at: string;
  status: string;
  error_message?: string | null;
  created_at: string;
};

export type JobDetailPayload = {
  job: JobRecord;
  attempts: StageAttempt[];
  artifacts: ArtifactRecord[];
  uploads: UploadRecord[];
  approval_audits: ApprovalAudit[];
  parameters: JobParameters | null;
  runtime_events: RuntimeEvent[];
  manifest: Record<string, unknown> | null;
  manifest_status: string;
  manifest_error: string;
};

export type JobTimelineStage = {
  key: string;
  label: string;
  state: "pending" | "current" | "done" | "failed";
  attempt_count: number;
  started_at?: string | null;
  finished_at?: string | null;
  duration_seconds?: number | null;
  error_message?: string | null;
};

export type JobTimelinePayload = {
  generated_at: string;
  job: JobRecord;
  current_stage: string;
  progress_percent: number;
  stages: JobTimelineStage[];
  latest_upload: UploadRecord | null;
  render_sizes: Record<string, number>;
  recent_events: RuntimeEvent[];
  manifest_status: string;
  manifest_error: string;
};

export type JobMetricsPayload = {
  generated_at: string;
  job_id: number;
  status: string;
  source_size_bytes: number | null;
  output_size_bytes: number;
  transcript_size_bytes: number | null;
  download_duration_seconds: number | null;
  download_speed_bytes_per_second: number | null;
  download_speed_mbps: number | null;
  queue_position: number | null;
  queue_count: number;
  render_count: number;
  upload_count: number;
  source_score: number | null;
  viral_fit_score: number | null;
  quality_score_overall: number | null;
  size_ratio: number | null;
  publish_ready: boolean;
  artifacts: ArtifactRecord[];
  uploads: UploadRecord[];
};

export type PublishActionLink = {
  platform: "youtube" | "tiktok";
  method: "POST";
  path: string;
};

export type PublishStatePayload = {
  generated_at: string;
  job_id: number;
  status: string;
  ready_to_push: boolean;
  render_sizes: Record<string, number>;
  youtube: {
    available: boolean;
    status: string;
    youtube_video_id?: string | null;
    youtube_url?: string | null;
    privacy_status: string;
    publish_at?: string | null;
    error_message?: string | null;
    manual_push_available: boolean;
  };
  tiktok: {
    available: boolean;
    status: string;
    manual_push_available: boolean;
    message: string;
  };
  actions: PublishActionLink[];
  latest_upload: UploadRecord | null;
  manifest_status: string;
  manifest_error: string;
};

export type ListPayload<T> = {
  items: T[];
  count: number;
};

export type BackupTarget = "registry" | "database";

export type BackupRecord = {
  name: string;
  target: BackupTarget;
  path: string;
  size_bytes: number;
  created_at: string;
  live_path: string;
};

export type BackupListPayload = {
  generated_at: string;
  count: number;
  items: BackupRecord[];
  live: Record<BackupTarget, { path: string; exists: boolean }>;
};

export type JobFilePayload = {
  job_id: number;
  file_key: "transcript" | "plan";
  path: string;
  text: string;
  exists?: boolean;
  json?: Record<string, unknown> | null;
};

export type ManualPushPayload = {
  enable_upload?: boolean;
  upload_approval?: string;
  approval_operator_name?: string;
  approval_reason?: string;
  require_credentials?: boolean;
};

export type ManualPushResult = {
  generated_at: string;
  job_id: number;
  status: string;
  youtube_video_id?: string | null;
  youtube_url?: string | null;
  privacy_status?: string;
  quota_units?: number;
  error_message?: string | null;
  manifest_status?: string;
};

export type ArtifactIndexItem = {
  job: JobRecord;
  manifest_status: string;
  manifest_error: string;
  transcript: JobFilePayload | null;
  plan: JobFilePayload | null;
  artifacts: ArtifactRecord[];
  uploads: UploadRecord[];
  approval_audits: ApprovalAudit[];
  runtime_events: RuntimeEvent[];
};

export type ArtifactIndexPayload = {
  generated_at: string;
  count: number;
  items: ArtifactIndexItem[];
  filters: {
    limit: number;
    channel_id: string;
    status: string;
    query: string;
  };
};
