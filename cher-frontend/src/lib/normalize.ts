// src/lib/normalize.ts
import type { Activity } from "../lib/schemas";

const n = (v: any, d = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
};
const rec = (obj: any): Record<string, number> => {
  const out: Record<string, number> = {};
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) out[k] = n(v, 0);
  }
  return out;
};
const acts = (arr: any): Activity[] =>
  Array.isArray(arr)
    ? arr.map((a, i) => {
        const rawType = String(a?.type ?? a?.activity_type ?? a?.activityType ?? "note").toLowerCase();
        const activity_type =
          rawType === "call" || rawType === "email" || rawType === "meeting" || rawType === "note"
            ? (rawType as "call" | "email" | "meeting" | "note")
            : ("note" as "note");
        return {
          id: n(a?.id ?? a?.activity_id) || i + 1,
          lead_id: n(a?.lead_id ?? a?.leadId ?? 0),
          user_id: n(a?.user_id ?? a?.userId ?? 0),
          activity_type,
          created_at: String(a?.created_at ?? a?.createdAt ?? ""),
          title: String(a?.title ?? a?.activity_title ?? ""),
          activity_date: String(a?.activity_date ?? a?.date ?? a?.activityDate ?? ""),
          user_name: String(a?.user_name ?? a?.userName ?? ""),
          notes: a?.notes ?? a?.note ?? undefined,
          duration: a?.duration != null ? n(a?.duration) : undefined,
        };
      })
    : [];

export function normalizeDashboard(raw: any) {
  const d = raw?.data ?? raw ?? {};
  return {
    total_leads: n(d.total_leads ?? d.totalLeads),
    new_leads: n(d.new_leads ?? d.newLeads),
    contacted_leads: n(d.contacted_leads ?? d.contactedLeads),
    qualified_leads: n(d.qualified_leads ?? d.qualifiedLeads),
    closed_leads: n(d.closed_leads ?? d.closedLeads),
    conversion_rate: n(d.conversion_rate ?? d.conversionRate),
    leads_by_source: rec(d.leads_by_source ?? d.leadsBySource),
    leads_by_status: rec(d.leads_by_status ?? d.leadsByStatus),
    recent_activities: acts(d.recent_activities ?? d.recentActivities),
  };
}
