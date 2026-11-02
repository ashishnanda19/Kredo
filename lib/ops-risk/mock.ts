/**
 * The risk console's mock mode (SCORE_API_URL unset): read-only answers from lib/score/ops-fixtures.json, which the
 * score service generates from its fake demo presets with the same shaping code as the live API. Role rules mirror
 * the service's, so the console behaves the same; actions need the live service.
 */
import { can, type Capability } from "@/lib/ops-permissions";
import type { OpsRole } from "@/lib/mock-ops";
import type { Alert, ConfigView, Monitoring, Override, UserDetail, UserPage, VendorSignals } from "./types";

type OpsFixtures = { users: UserPage; details: Record<string, UserDetail>; monitoring: Monitoring; alerts: Alert[]; overrides: Override[]; config: ConfigView };

let cache: Promise<OpsFixtures> | null = null;
const load = () => (cache ??= import("@/lib/score/ops-fixtures.json").then((m) => m.default as unknown as OpsFixtures));

export function capabilityFor(path: string): Capability {
  if (path.startsWith("users")) return "riskView";
  if (path.startsWith("monitoring")) return "monitoringView";
  if (path.startsWith("overrides")) return "overridesView";
  if (path.startsWith("config")) return "configView";
  return "alertsView";
}

export type MockAnswer = { status: number; data: unknown };

export async function mockRisk(role: OpsRole, pathWithQuery: string): Promise<MockAnswer> {
  const [path, query = ""] = pathWithQuery.split("?");
  if (!can(role, capabilityFor(path))) return { status: 403, data: { detail: { code: "ROLE_NOT_ALLOWED" } } };
  const q = new URLSearchParams(query);
  const f = await load();
  const segs = path.split("/");

  if (path === "users") {
    let rows = f.users.rows;
    for (const key of ["band", "tier"] as const) if (q.get(key)) rows = rows.filter((r) => r[key] === q.get(key));
    if (q.get("knockout")) rows = rows.filter((r) => r.knockouts.includes(q.get("knockout")!));
    if (q.get("q")) rows = rows.filter((r) => r.user_id.includes(q.get("q")!.toLowerCase()));
    if (q.get("sort") === "recent") rows = [...rows].sort((a, b) => b.as_of.localeCompare(a.as_of));
    const limit = Number(q.get("limit") ?? 50);
    const offset = Number(q.get("offset") ?? 0);
    return { status: 200, data: { total: rows.length, limit, offset, rows: rows.slice(offset, offset + limit) } };
  }
  if (segs[0] === "users" && segs.length === 2) {
    const d = f.details[segs[1]];
    return d ? { status: 200, data: d } : { status: 404, data: { detail: { code: "NO_SCORE" } } };
  }
  if (path === "monitoring") return { status: 200, data: f.monitoring };
  if (path === "overrides") return { status: 200, data: f.overrides.filter((o) => !q.get("status") || o.status === q.get("status")) };
  if (path === "config") return { status: 200, data: f.config };
  if (path === "audit") return { status: 200, data: [] };
  if (path === "fraud-alerts") {
    let rows = f.alerts;
    for (const key of ["status", "rule", "severity", "user_id", "vendor_id"] as const) if (q.get(key)) rows = rows.filter((a) => a[key] === q.get(key));
    return { status: 200, data: rows };
  }
  if (segs[0] === "fraud-alerts" && segs.length === 2) {
    const a = f.alerts.find((x) => x.id === segs[1]);
    return a ? { status: 200, data: a } : { status: 404, data: { detail: { code: "UNKNOWN_ALERT" } } };
  }
  if (segs[0] === "vendors" && segs[2] === "fraud-signals") {
    const alerts = f.alerts.filter((a) => a.vendor_id === segs[1]);
    const count = (xs: string[]) => xs.reduce<Record<string, number>>((m, x) => ({ ...m, [x]: (m[x] ?? 0) + 1 }), {});
    const data: VendorSignals = {
      vendor_id: segs[1],
      students: new Set(alerts.map((a) => a.user_id).filter(Boolean)).size,
      open: alerts.filter((a) => a.status === "open").length,
      by_rule: count(alerts.map((a) => a.rule)),
      signals: count(alerts.flatMap((a) => a.evidence.instances.map((i) => i.signal))),
      alerts,
    };
    return { status: 200, data };
  }
  return { status: 404, data: { detail: { code: "NOT_FOUND" } } };
}
