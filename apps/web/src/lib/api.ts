// Typed API client for the RiyadaIntel backend.
//
// Auth: a signed JWT (from /auth/login) is stored in the `riyada_token` cookie. When present,
// requests send it as a Bearer token and identity comes from /auth/me. When absent (public demo
// browsing), it falls back to the demo bootstrap (/demo/context) + tenant headers.
// Server components fetch against the API directly (absolute URL); the browser uses a relative
// path that nginx routes to the API.

const SERVER_API =
  (process.env.API_INTERNAL_URL || process.env.API_URL || "http://localhost:4400") + "/api/v1";

const baseUrl = () => (typeof window === "undefined" ? SERVER_API : "/api/v1");

export const TOKEN_COOKIE = "riyada_token";

/** Mirrors AuthService.ADMIN_ROLES — the roles that may enter the admin portal/surfaces. */
export const ADMIN_ROLES = [
  "super_admin", "platform_admin", "org_admin", "dept_manager", "compliance_manager",
  "hr_manager", "finance_manager", "instructor", "trainer",
];

/** No roles at all = anonymous demo browsing, which keeps full visibility by design. */
export function isAdmin(roles?: string[]): boolean {
  if (!roles?.length) return true;
  return roles.some((r) => ADMIN_ROLES.includes(r));
}

async function authToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      return (await cookies()).get(TOKEN_COOKIE)?.value ?? null;
    } catch {
      return null;
    }
  }
  const m = typeof document !== "undefined" ? document.cookie.match(/(?:^|; )riyada_token=([^;]+)/) : null;
  return m ? decodeURIComponent(m[1]) : null;
}

async function buildHeaders(ctx?: DemoContext): Promise<Record<string, string>> {
  const token = await authToken();
  // Always include the demo-context headers: the middleware prefers a valid Bearer token, and
  // when the cookie is stale (rotated JWT_SECRET, expired) it falls through to these instead of
  // rejecting every request until the user clears cookies.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": ctx?.tenantId ?? "",
    "X-Org-Id": ctx?.organizationId ?? "",
    "X-User-Id": ctx?.userId ?? "",
    "X-Roles": (ctx?.roles?.length ? ctx.roles : ["org_admin"]).join(","),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export interface DemoContext {
  tenantId: string;
  organizationId: string;
  userId: string;
  userName: string;
  jobTitle: string;
  departmentId: string;
  currentRoleId: string;
  targetRoleId: string;
  roles?: string[];
}

/** Resolve the current identity: /auth/me when logged in, else the demo bootstrap. A stale or
 *  rotated-secret cookie must never take pages down — fall back to the demo context so the app
 *  renders and the user can simply log in again. */
export async function getContext(): Promise<DemoContext> {
  const token = await authToken();
  if (token) {
    const res = await fetch(`${baseUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok) return res.json() as Promise<DemoContext>;
  }
  const res = await fetch(`${baseUrl()}/demo/context`, { cache: "no-store" });
  if (!res.ok) throw new Error(`context -> ${res.status}`);
  return res.json() as Promise<DemoContext>;
}

export async function apiGet<T>(path: string, ctx: DemoContext): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, { headers: await buildHeaders(ctx), cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, ctx: DemoContext, body?: unknown): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: await buildHeaders(ctx),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, ctx: DemoContext, body?: unknown): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "PATCH",
    headers: await buildHeaders(ctx),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`PATCH ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export interface CourseDetail {
  id: string;
  title: string;
  description: string;
  provider: string;
  level?: string;
  durationMinutes?: number;
  publisher?: string;
  launchUrl?: string | null;
  imageUrl?: string | null;
  skills: string[];
  assessmentId?: string | null;
}
export interface EnrollmentRow {
  id: string;
  courseId: string;
  status: string;
  percent: number;
  dueAt?: string | null;
  course?: { title: string; providerKey: string };
}
export interface ProviderConn {
  id: string;
  providerKey: string;
  displayName: string;
  status: string;
  lastSyncedAt: string | null;
  courses: number;
}
export interface WorkforceReadiness {
  roleName: string;
  teamSize: number;
  avgCoverage: number;
  readyForRole: number;
  shortages: { skillId: string; name: string; peopleShort: number; peopleCovered: number; coverage: number }[];
  singlePointsOfFailure: string[];
}

// Response shapes (mirror the API services)
export interface SkillGap {
  roleId: string;
  roleName: string;
  coverage: number;
  gaps: { skillId: string; name: string; deficit: number; importance: string; targetLevel: number; currentLevel: number }[];
}
export interface ComplianceDashboard {
  departmentId: string;
  risk: { green: number; amber: number; red: number; auditReadiness: number; status: "green" | "amber" | "red" };
  controls: { controlId: string; status: "green" | "amber" | "red"; framework: string; code: string; user: string; reason: string }[];
}
export interface Recommendation {
  courseId: string;
  title: string;
  providerKey: string;
  reason: string;
  score: number;
}
export interface CatalogCourse {
  id: string;
  title: string;
  provider: string;
  level?: string;
  durationMinutes?: number;
  skills: string[];
}
export interface CatalogResult {
  items: CatalogCourse[];
  nextCursor?: string;
}
export interface CertExpiring {
  id: string;
  user: string;
  certification: string;
  expiresAt: string | null;
  status: string;
  reminders: number[];
  cpd: { pct: number; remaining: number; met: boolean } | null;
}
export interface MarketplaceProduct {
  id: string;
  kind: string;
  name: string;
  priceCents: number;
  currency: string;
}
export interface CareerStep {
  order: number;
  skillId: string;
  courseTitle: string;
  providerKey: string;
  estMinutes: number;
  estCostCents: number;
}
export interface CareerPlanResult {
  id: string;
  targetRoleId: string;
  gapSkillIds: string[];
  steps: CareerStep[];
  estMonths: number;
  estCostCents: number;
}
