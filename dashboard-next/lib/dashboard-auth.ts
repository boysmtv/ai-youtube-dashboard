import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type DashboardRole = "viewer" | "operator" | "admin";

type DashboardSession = {
  username: string;
  role: DashboardRole;
  authEnabled: boolean;
};

type DashboardAccount = {
  username: string;
  password: string;
  role: DashboardRole;
};

const SESSION_COOKIE = "dashboard_session";
const ROLE_WEIGHT: Record<DashboardRole, number> = {
  viewer: 1,
  operator: 2,
  admin: 3,
};

function configuredAccounts(): DashboardAccount[] {
  const candidates: DashboardAccount[] = [
    {
      username: (process.env.DASHBOARD_VIEWER_USERNAME || "").trim(),
      password: process.env.DASHBOARD_VIEWER_PASSWORD || "",
      role: "viewer",
    },
    {
      username: (process.env.DASHBOARD_OPERATOR_USERNAME || "").trim(),
      password: process.env.DASHBOARD_OPERATOR_PASSWORD || "",
      role: "operator",
    },
    {
      username: (process.env.DASHBOARD_ADMIN_USERNAME || "").trim(),
      password: process.env.DASHBOARD_ADMIN_PASSWORD || "",
      role: "admin",
    },
  ];

  return candidates.filter((item) => item.username && item.password);
}

function authSecret() {
  return process.env.DASHBOARD_AUTH_SECRET || "";
}

export function isDashboardAuthEnabled() {
  const envFlag = (process.env.DASHBOARD_AUTH_ENABLED || "").trim().toLowerCase();
  if (envFlag === "0" || envFlag === "false" || envFlag === "off") {
    return false;
  }
  return Boolean(authSecret() && configuredAccounts().length);
}

export function dashboardAuthReadiness() {
  const accounts = configuredAccounts();
  return {
    enabled: isDashboardAuthEnabled(),
    secret_present: Boolean(authSecret()),
    account_count: accounts.length,
    expected_env: [
      "DASHBOARD_AUTH_ENABLED",
      "DASHBOARD_AUTH_SECRET",
      "DASHBOARD_VIEWER_USERNAME",
      "DASHBOARD_VIEWER_PASSWORD",
      "DASHBOARD_OPERATOR_USERNAME",
      "DASHBOARD_OPERATOR_PASSWORD",
      "DASHBOARD_ADMIN_USERNAME",
      "DASHBOARD_ADMIN_PASSWORD",
    ],
  };
}

function signValue(value: string) {
  return createHmac("sha256", authSecret()).update(value).digest("base64url");
}

function verifyValue(value: string, signature: string) {
  const expected = signValue(value);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function encodeSession(payload: { username: string; role: DashboardRole }) {
  const raw = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  return `${raw}.${signValue(raw)}`;
}

function decodeSession(value: string | undefined): DashboardSession | null {
  if (!value) {
    return null;
  }
  const [raw, signature] = value.split(".");
  if (!raw || !signature || !verifyValue(raw, signature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf-8")) as { username: string; role: DashboardRole };
    if (!parsed.username || !parsed.role || !(parsed.role in ROLE_WEIGHT)) {
      return null;
    }
    return { ...parsed, authEnabled: true };
  } catch {
    return null;
  }
}

export function authenticateDashboardUser(username: string, password: string): DashboardAccount | null {
  return configuredAccounts().find((item) => item.username === username.trim() && item.password === password) || null;
}

export function setDashboardSession(account: DashboardAccount) {
  cookies().set(SESSION_COOKIE, encodeSession({ username: account.username, role: account.role }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export function clearDashboardSession() {
  cookies().delete(SESSION_COOKIE);
}

export function getDashboardSession(): DashboardSession {
  if (!isDashboardAuthEnabled()) {
    return { username: "local-admin", role: "admin", authEnabled: false };
  }

  const session = decodeSession(cookies().get(SESSION_COOKIE)?.value);
  if (!session) {
    return { username: "", role: "viewer", authEnabled: true };
  }
  return session;
}

export function requireDashboardSession(nextPath = "/"): DashboardSession {
  const session = getDashboardSession();
  if (!session.authEnabled) {
    return session;
  }
  if (!session.username) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return session;
}

export function requireDashboardRole(role: DashboardRole, nextPath = "/"): DashboardSession {
  const session = requireDashboardSession(nextPath);
  if (ROLE_WEIGHT[session.role] < ROLE_WEIGHT[role]) {
    redirect("/");
  }
  return session;
}

export function assertDashboardRole(role: DashboardRole): DashboardSession {
  const session = getDashboardSession();
  if (session.authEnabled && !session.username) {
    throw new Error("Authentication required.");
  }
  if (ROLE_WEIGHT[session.role] < ROLE_WEIGHT[role]) {
    throw new Error(`Role ${role} required.`);
  }
  return session;
}

export function hasDashboardRole(session: DashboardSession, role: DashboardRole) {
  return ROLE_WEIGHT[session.role] >= ROLE_WEIGHT[role];
}

export function engineAuditHeaders(session: DashboardSession): Record<string, string> {
  return {
    "X-Dashboard-Actor": session.username || "local-admin",
    "X-Dashboard-Role": session.role,
    "X-Dashboard-Source": "dashboard-next",
  };
}
