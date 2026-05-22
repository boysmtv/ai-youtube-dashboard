export type EngineStateView = "default" | "redis";

export type EngineSyncSettings = {
  stateView: EngineStateView;
  websocketEnabled: boolean;
  pollingIntervalMs: number;
};

export const DEFAULT_ENGINE_SYNC_SETTINGS: EngineSyncSettings = {
  stateView: "default",
  websocketEnabled: true,
  pollingIntervalMs: 15000,
};

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (["0", "false", "off", "no"].includes(normalized)) {
    return false;
  }
  if (["1", "true", "on", "yes"].includes(normalized)) {
    return true;
  }
  return fallback;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1000) {
    return fallback;
  }
  return Math.min(parsed, 120000);
}

function parseEnvDefaults(): EngineSyncSettings {
  const stateView = process.env.ENGINE_SYNC_STATE_VIEW === "redis" ? "redis" : DEFAULT_ENGINE_SYNC_SETTINGS.stateView;
  const websocketEnabled = parseBoolean(process.env.ENGINE_SYNC_WEBSOCKET_ENABLED, DEFAULT_ENGINE_SYNC_SETTINGS.websocketEnabled);
  const pollingIntervalMs = parsePositiveInt(process.env.ENGINE_SYNC_POLLING_INTERVAL_MS, DEFAULT_ENGINE_SYNC_SETTINGS.pollingIntervalMs);

  return {
    stateView,
    websocketEnabled,
    pollingIntervalMs,
  };
}

export function parseEngineSyncSettings(searchParams: Record<string, string | string[] | undefined>): EngineSyncSettings {
  const defaults = parseEnvDefaults();
  const viewParam = Array.isArray(searchParams.sync_view) ? searchParams.sync_view[0] : searchParams.sync_view;
  const wsParam = Array.isArray(searchParams.sync_ws) ? searchParams.sync_ws[0] : searchParams.sync_ws;
  const pollParam = Array.isArray(searchParams.sync_poll_ms) ? searchParams.sync_poll_ms[0] : searchParams.sync_poll_ms;

  return {
    stateView: viewParam === "redis" ? "redis" : defaults.stateView,
    websocketEnabled: parseBoolean(wsParam, defaults.websocketEnabled),
    pollingIntervalMs: parsePositiveInt(pollParam, defaults.pollingIntervalMs),
  };
}
