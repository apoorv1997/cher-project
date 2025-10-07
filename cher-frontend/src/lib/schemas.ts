// src/lib/schemas.ts
import { z } from "zod";

const Num0 = z.coerce.number().catch(0);              // "12" | null | undefined -> 0 on failure
const RecNum0 = z.record(z.coerce.number()).catch({});

export const UserSchema = z.object({
  id: z.number().int().positive(),
  username: z.string(),
  email: z.string().email(),
  first_name: z.string().optional().default(""),
  last_name: z.string().optional().default(""),
  created_at: z.string().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const LeadSchema = z.object({
  id: z.number().int().positive(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.enum(["new","contacted","qualified","closed","lost", "negotiation"]),
  source: z.string().optional(),
  budget_min: z.number().optional(),
  budget_max: z.number().optional(),
  property_interest: z.string().optional(),
  is_active: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  activity_count: z.number().int().nonnegative().optional(),
});
export type Lead = z.infer<typeof LeadSchema>;

const LeadsByStatusFlexible = z.union([
  z.record(z.coerce.number()),                                      // { new: 5, closed: 2 }
  z.array(z.tuple([z.string(), z.coerce.number()])).transform(a =>
    Object.fromEntries(a)                                           // [ ["new",5], ["closed",2] ]
  ),
  z.array(z.object({ status: z.string(), count: z.coerce.number() })).transform(a =>
    Object.fromEntries(a.map(({ status, count }) => [status, count])) // [ {status:"new",count:5}, ... ]
  ),
]).catch({}); // default to empty object if nothing matches


const NumOrNullTo0 = z.preprocess(
  (v) => (v == null || v === "" ? 0 : v),
  z.coerce.number().catch(0)
);

// replace your ActivitySchema with this more tolerant version
export const ActivitySchema = z.object({
  id: z.coerce.number().catch(0),
  lead_id: z.coerce.number().optional().nullable().transform(v => (v ?? undefined)),
  user_id: z.coerce.number().optional().nullable().transform(v => (v ?? undefined)),
  activity_type: z.enum(["call", "email", "meeting", "note"]).catch("note"), // default to "note" if unknown
  title: z.string().min(1).catch("No Title"), // default to "No Title" if empty
  activity_date: z.string().optional().nullable().transform(v => v ?? ""),
  user_name: z.string().optional().nullable().transform(v => v ?? "Unknown User"),
  notes: z.string().optional().nullable().transform(v => v ?? ""),
  created_at: z.string().optional().nullable().transform(v => v ?? ""),
  duration: NumOrNullTo0.optional(),                 // <- null → 0, strings → number, bad → 0
});
export type Activity = z.infer<typeof ActivitySchema>;

// Accept snake_case OR camelCase; default/coerce everything to safe values
const DashboardLoose = z.object({
  // numbers
  total_leads: Num0.or(z.undefined()),
  new_leads: Num0.or(z.undefined()),
  contacted_leads: Num0.or(z.undefined()),
  qualified_leads: Num0.or(z.undefined()),
  closed_leads: Num0.or(z.undefined()),
  conversion_rate: Num0.or(z.undefined()),

  // objects
  leads_by_source: RecNum0.or(z.undefined()),
  leads_by_status: LeadsByStatusFlexible.or(z.undefined()),

  // arrays
  recent_activities: z.array(ActivitySchema).catch([]),
}).or(z.object({
  // camelCase alternatives
  totalLeads: Num0.or(z.undefined()),
  newLeads: Num0.or(z.undefined()),
  contactedLeads: Num0.or(z.undefined()),
  qualifiedLeads: Num0.or(z.undefined()),
  closedLeads: Num0.or(z.undefined()),
  conversionRate: Num0.or(z.undefined()),
  leadsBySource: RecNum0.or(z.undefined()),
  leadsByStatus: LeadsByStatusFlexible.or(z.undefined()),
  recentActivities: z.array(ActivitySchema).catch([]),
}));

const DashboardAny = z.union([
  z.object({ data: DashboardLoose }).transform(x => x.data),
  DashboardLoose,
]);

// Final normalized type you use across the app
export const DashboardStatsSchema = DashboardAny.transform((d: any) => ({
  total_leads: d.total_leads ?? d.totalLeads ?? 0,
  new_leads: d.new_leads ?? d.newLeads ?? 0,
  contacted_leads: d.contacted_leads ?? d.contactedLeads ?? 0,
  qualified_leads: d.qualified_leads ?? d.qualifiedLeads ?? 0,
  closed_leads: d.closed_leads ?? d.closedLeads ?? 0,
  conversion_rate: d.conversion_rate ?? d.conversionRate ?? 0,
  leads_by_source: d.leads_by_source ?? d.leadsBySource ?? {},
  leads_by_status: d.leads_by_status ?? d.leadsByStatus ?? {},
  recent_activities: d.recent_activities ?? d.recentActivities ?? [],
}));
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;