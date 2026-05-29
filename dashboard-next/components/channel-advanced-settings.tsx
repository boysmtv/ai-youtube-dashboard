"use client";

import { useState } from "react";
import type { ChannelConfig } from "../lib/engine-types";

function Field({
  label,
  name,
  defaultValue,
  id,
}: Readonly<{
  label: string;
  name: string;
  defaultValue: string;
  id?: string;
}>) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-gray-700">
      {label}
      <input id={id} name={name} type="text" defaultValue={defaultValue} />
    </label>
  );
}

export function ChannelAdvancedSettings({ channel }: Readonly<{ channel: ChannelConfig }>) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="ta-label text-brand-600">Advanced / Admin</span>
          <p className="mt-1 text-xs text-gray-500">Detail teknis hanya dimuat saat dibuka.</p>
        </div>
        <button
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          type="button"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "Tutup" : "Buka"}
        </button>
      </div>

      {open ? (
        <div className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field id={`settings-${channel.id}-client-secret-path`} label="Client secret path" name="client_secret_path" defaultValue={channel.client_secret_path} />
            <Field id={`settings-${channel.id}-token-path`} label="Token path" name="token_path" defaultValue={channel.token_path} />
            <Field label="Publish slots CSV" name="publish_slots" defaultValue={channel.publish_slots.join(",")} />
            <Field label="Curated sources path" name="curated_sources_path" defaultValue={channel.curated_sources_path} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input className="ta-check" name="require_client_secret" type="checkbox" defaultChecked={channel.upload_preflight.require_client_secret} />
              Wajib client secret
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input className="ta-check" name="require_token" type="checkbox" defaultChecked={channel.upload_preflight.require_token} />
              Wajib token
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input className="ta-check" name="require_curated_sources" type="checkbox" defaultChecked={channel.upload_preflight.require_curated_sources} />
              Wajib curated source
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input className="ta-check" name="require_publish_slots" type="checkbox" defaultChecked={channel.upload_preflight.require_publish_slots} />
              Wajib slot kerja
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input className="ta-check" name="validate_oauth_credentials" type="checkbox" defaultChecked={channel.upload_preflight.validate_oauth_credentials} />
              Cek login YouTube
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input className="ta-check" name="auto_bootstrap_allowed" type="checkbox" defaultChecked={channel.upload_preflight.auto_bootstrap_allowed} />
              Auto bootstrap diperbolehkan
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}
