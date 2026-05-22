import type { RegistryPayload } from "../lib/engine-types";
import { saveChannelSettings, saveCoreSettings } from "../app/settings/actions";
import { ConfirmSubmitButton } from "./confirm-submit-button";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
}: Readonly<{
  label: string;
  name: string;
  defaultValue: string | number;
  type?: string;
}>) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-gray-700">
      {label}
      <input name={name} type={type} defaultValue={defaultValue} />
    </label>
  );
}

export function CoreSettingsForm({ registry }: Readonly<{ registry: RegistryPayload }>) {
  return (
    <form action={saveCoreSettings} className="ta-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="ta-label text-brand-600">Safe form</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Core automation</h3>
        </div>
        <ConfirmSubmitButton className="px-5 py-3 text-sm" message="Save core automation settings to the engine registry?">
          Save core
        </ConfirmSubmitButton>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Timezone" name="timezone" defaultValue={registry.timezone} />
        <Field label="Storage budget GB" name="storage_budget_gb" type="number" defaultValue={registry.storage_budget_gb} />
        <Field label="Default publish slots CSV" name="default_publish_slots" defaultValue={registry.default_publish_slots.join(",")} />
        <Field label="Worker max active jobs" name="worker_max_active_jobs" type="number" defaultValue={registry.worker.max_active_jobs} />
        <Field label="Worker min free disk GB" name="worker_min_free_disk_gb" type="number" defaultValue={registry.worker.min_free_disk_gb} />
        <Field
          label="Publish lead time hours"
          name="worker_publish_lead_time_hours"
          type="number"
          defaultValue={registry.worker.publish_lead_time_hours}
        />
        <Field label="Approval text" name="upload_approval_confirmation_text" defaultValue={registry.upload_approval.confirmation_text} />
        <Field label="Approval session minutes" name="upload_approval_session_minutes" type="number" defaultValue={registry.upload_approval.session_minutes} />
        <Field label="Retention keep recent job dirs" name="retention_keep_recent_job_dirs" type="number" defaultValue={registry.retention.keep_recent_job_dirs} />
        <Field label="Retention cleanup interval hours" name="retention_cleanup_interval_hours" type="number" defaultValue={registry.retention.cleanup_interval_hours} />
      </div>
      <label className="mt-4 grid gap-2 text-sm font-semibold text-gray-700">
        Approval reason
        <textarea
          name="upload_approval_reason"
          defaultValue={registry.upload_approval.reason}
          className="min-h-24"
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-gray-700">
        <label className="flex items-center gap-2">
          <input className="ta-check" name="upload_approval_enabled" type="checkbox" defaultChecked={registry.upload_approval.enabled} />
          Upload guard enabled
        </label>
        <label className="flex items-center gap-2">
          <input className="ta-check" name="upload_approval_require_operator_name" type="checkbox" defaultChecked={registry.upload_approval.require_operator_name} />
          Require operator name
        </label>
        <label className="flex items-center gap-2">
          <input className="ta-check" name="upload_approval_require_reason" type="checkbox" defaultChecked={registry.upload_approval.require_reason} />
          Require reason
        </label>
        <label className="flex items-center gap-2">
          <input className="ta-check" name="retention_enabled" type="checkbox" defaultChecked={registry.retention.enabled} />
          Retention enabled
        </label>
        <label className="flex items-center gap-2">
          <input className="ta-check" name="retention_auto_cleanup_on_worker_start" type="checkbox" defaultChecked={registry.retention.auto_cleanup_on_worker_start} />
          Auto cleanup on worker start
        </label>
        <label className="flex items-center gap-2">
          <input className="ta-check" name="retention_auto_cleanup_on_scheduler_tick" type="checkbox" defaultChecked={registry.retention.auto_cleanup_on_scheduler_tick} />
          Auto cleanup on scheduler tick
        </label>
        <label className="flex items-center gap-2">
          <input className="ta-check" name="retention_delete_downloads_first" type="checkbox" defaultChecked={registry.retention.delete_downloads_first} />
          Delete downloads first
        </label>
      </div>
    </form>
  );
}

export function ChannelSettingsForms({ registry }: Readonly<{ registry: RegistryPayload }>) {
  return (
    <div className="ta-panel p-5">
      <p className="ta-label text-brand-600">Safe form</p>
      <h3 className="mt-2 text-lg font-semibold text-gray-900">Channels</h3>
      <div className="mt-5 space-y-4">
        {registry.channels.map((channel) => (
          <form key={channel.id} action={saveChannelSettings} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <input name="channel_id" type="hidden" value={channel.id} />
                <strong className="text-gray-900">{channel.id}</strong>
                <p className="mt-1 font-mono text-xs text-gray-500">{channel.gcp_project_id}</p>
              </div>
              <ConfirmSubmitButton className="px-4 py-2 text-sm" message={`Save settings for channel ${channel.id}?`}>
                Save channel
              </ConfirmSubmitButton>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Display name" name="display_name" defaultValue={channel.display_name} />
              <Field label="Niche" name="niche" defaultValue={channel.niche} />
              <Field label="Language" name="language" defaultValue={channel.language} />
              <Field label="GCP project" name="gcp_project_id" defaultValue={channel.gcp_project_id} />
              <Field label="Client secret path" name="client_secret_path" defaultValue={channel.client_secret_path} />
              <Field label="Token path" name="token_path" defaultValue={channel.token_path} />
              <Field label="Publish slots CSV" name="publish_slots" defaultValue={channel.publish_slots.join(",")} />
              <Field label="Curated sources path" name="curated_sources_path" defaultValue={channel.curated_sources_path} />
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-gray-700">
              <label className="flex items-center gap-2">
                <input className="ta-check" name="enabled" type="checkbox" defaultChecked={channel.enabled} />
                Enabled
              </label>
              <label className="flex items-center gap-2">
                <input className="ta-check" name="require_client_secret" type="checkbox" defaultChecked={channel.upload_preflight.require_client_secret} />
                Require client secret
              </label>
              <label className="flex items-center gap-2">
                <input className="ta-check" name="require_token" type="checkbox" defaultChecked={channel.upload_preflight.require_token} />
                Require token
              </label>
              <label className="flex items-center gap-2">
                <input className="ta-check" name="require_curated_sources" type="checkbox" defaultChecked={channel.upload_preflight.require_curated_sources} />
                Require curated sources
              </label>
              <label className="flex items-center gap-2">
                <input className="ta-check" name="require_publish_slots" type="checkbox" defaultChecked={channel.upload_preflight.require_publish_slots} />
                Require publish slots
              </label>
              <label className="flex items-center gap-2">
                <input className="ta-check" name="validate_oauth_credentials" type="checkbox" defaultChecked={channel.upload_preflight.validate_oauth_credentials} />
                Validate OAuth token
              </label>
              <label className="flex items-center gap-2">
                <input className="ta-check" name="auto_bootstrap_allowed" type="checkbox" defaultChecked={channel.upload_preflight.auto_bootstrap_allowed} />
                Auto bootstrap allowed
              </label>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
