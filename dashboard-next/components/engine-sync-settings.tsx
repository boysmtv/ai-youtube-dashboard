"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { EngineSyncSettings } from "../lib/sync-settings";

export function EngineSyncSettingsPanel({ initial }: Readonly<{ initial: EngineSyncSettings }>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<EngineSyncSettings>(initial);

  useEffect(() => {
    const raw = window.localStorage.getItem("dashboard_engine_sync");
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<EngineSyncSettings>;
      setSettings({
        stateView: parsed.stateView === "redis" ? "redis" : initial.stateView,
        websocketEnabled: typeof parsed.websocketEnabled === "boolean" ? parsed.websocketEnabled : initial.websocketEnabled,
        pollingIntervalMs: typeof parsed.pollingIntervalMs === "number" ? parsed.pollingIntervalMs : initial.pollingIntervalMs,
      });
    } catch {
      setSettings(initial);
    }
  }, [initial]);

  function apply(next: EngineSyncSettings) {
    setSettings(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sync_view", next.stateView);
    params.set("sync_ws", next.websocketEnabled ? "1" : "0");
    params.set("sync_poll_ms", String(next.pollingIntervalMs));
    window.localStorage.setItem("dashboard_engine_sync", JSON.stringify(next));
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="ta-panel p-4">
      <p className="ta-label text-brand-600">Engine sync</p>
      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <label className="grid gap-2 text-sm font-semibold text-gray-700">
          State view
          <select value={settings.stateView} onChange={(event) => apply({ ...settings, stateView: event.target.value === "redis" ? "redis" : "default" })}>
            <option value="default">Default</option>
            <option value="redis">Redis-backed</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-gray-700">
          Polling interval (ms)
          <input
            value={settings.pollingIntervalMs}
            min={1000}
            max={120000}
            step={1000}
            type="number"
            onChange={(event) => setSettings({ ...settings, pollingIntervalMs: Number.parseInt(event.target.value || "15000", 10) || 15000 })}
            onBlur={(event) => apply({ ...settings, pollingIntervalMs: Math.max(1000, Math.min(120000, Number.parseInt(event.target.value || "15000", 10))) })}
          />
        </label>
        <label className="mt-7 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <input
            className="ta-check"
            type="checkbox"
            checked={settings.websocketEnabled}
            onChange={(event) => apply({ ...settings, websocketEnabled: event.target.checked })}
          />
          WebSocket enabled
        </label>
      </div>
    </div>
  );
}
