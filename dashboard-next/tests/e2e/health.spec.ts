import { expect, test, APIRequestContext } from "@playwright/test";

const URLS = [
  "http://localhost:3001/health",
  "http://localhost:8080/health",
  "http://localhost:8092/health",
  "http://localhost:8091/health",
  "http://localhost:8080/api/runtime/config-contract",
  "http://localhost:8080/api/overview",
];

function findValue(input: unknown, key: string): unknown {
  if (!input || typeof input !== "object") {
    return undefined;
  }
  if (Array.isArray(input)) {
    for (const item of input) {
      const found = findValue(item, key);
      if (found !== undefined) {
        return found;
      }
    }
    return undefined;
  }
  const record = input as Record<string, unknown>;
  if (key in record) {
    return record[key];
  }
  for (const value of Object.values(record)) {
    const found = findValue(value, key);
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}

async function fetchJsonOrText(request: APIRequestContext, url: string) {
  const response = await request.get(url, { timeout: 60_000 });
  expect(response.status(), `Unexpected HTTP status for ${url}`).toBeLessThan(400);
  const contentType = response.headers()["content-type"] || "";
  const bodyText = await response.text();
  return {
    response,
    contentType,
    bodyText,
    bodyJson: contentType.includes("application/json") ? JSON.parse(bodyText) as unknown : undefined,
  };
}

for (const url of URLS) {
  test(`health endpoint responds cleanly: ${url}`, async ({ request }) => {
    const result = await fetchJsonOrText(request, url);
    expect(result.bodyText.trim().length, `Empty body for ${url}`).toBeGreaterThan(0);

    if (url.endsWith("/api/runtime/config-contract")) {
      const redisEnabled = findValue(result.bodyJson, "redis_enabled");
      const postgresRequired = findValue(result.bodyJson, "postgres_required");
      const sqliteSupported = findValue(result.bodyJson, "sqlite_supported");
      expect(redisEnabled, `redis_enabled missing for ${url}`).toBe(true);
      expect(postgresRequired, `postgres_required missing for ${url}`).toBe(true);
      expect(sqliteSupported, `sqlite_supported missing for ${url}`).toBe(false);
    }

    if (url.endsWith("/api/overview")) {
      const storageBackend = findValue(result.bodyJson, "storage_backend");
      expect(storageBackend, `storage_backend missing for ${url}`).toBe("postgres");
    }
  });
}
