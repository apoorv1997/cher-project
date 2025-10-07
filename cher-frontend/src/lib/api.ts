// Mock API service for demonstration
// In production, replace with actual FastAPI backend calls
import {http, toApiError} from './https';
import { request } from "./request";
import { auth } from "./auth";
import {
  UserSchema, type User,
  LeadSchema, type Lead,
  ActivitySchema, type Activity,
  DashboardStatsSchema, type DashboardStats,
} from "./schemas";
import { z } from "zod";
import { AxiosError, AxiosHeaders } from "axios";
import { normalizeDashboard } from './normalize';
  
  // Mock data
  const mockLeads: Lead[] = [
    {
      id: 1,
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@example.com',
      phone: '+1-555-0100',
      status: 'new',
      source: 'website',
      budget_min: 300000,
      budget_max: 450000,
      property_interest: '3BR house in suburban area',
      is_active: true,
      created_at: '2025-01-10T10:00:00Z',
      updated_at: '2025-01-10T10:00:00Z',
      activity_count: 2
    },
    {
      id: 2,
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.j@example.com',
      phone: '+1-555-0101',
      status: 'contacted',
      source: 'referral',
      budget_min: 500000,
      budget_max: 700000,
      property_interest: 'Luxury condo downtown',
      is_active: true,
      created_at: '2025-01-09T14:30:00Z',
      updated_at: '2025-01-11T09:15:00Z',
      activity_count: 4
    },
    {
      id: 3,
      first_name: 'Michael',
      last_name: 'Chen',
      email: 'mchen@example.com',
      phone: '+1-555-0102',
      status: 'qualified',
      source: 'zillow',
      budget_min: 400000,
      budget_max: 550000,
      property_interest: 'Family home with backyard',
      is_active: true,
      created_at: '2025-01-08T11:20:00Z',
      updated_at: '2025-01-12T16:45:00Z',
      activity_count: 6
    },
    {
      id: 4,
      first_name: 'Emily',
      last_name: 'Davis',
      email: 'emily.davis@example.com',
      phone: '+1-555-0103',
      status: 'negotiation',
      source: 'referral',
      budget_min: 350000,
      budget_max: 425000,
      property_interest: 'Townhouse near schools',
      is_active: true,
      created_at: '2025-01-07T09:00:00Z',
      updated_at: '2025-01-13T14:20:00Z',
      activity_count: 8
    },
    {
      id: 5,
      first_name: 'Robert',
      last_name: 'Wilson',
      email: 'rwilson@example.com',
      phone: '+1-555-0104',
      status: 'closed',
      source: 'website',
      budget_min: 275000,
      budget_max: 325000,
      property_interest: 'Starter home',
      is_active: true,
      created_at: '2024-12-15T13:30:00Z',
      updated_at: '2025-01-05T10:00:00Z',
      activity_count: 12
    }
  ];
  
  const mockActivities: Activity[] = [
    {
      id: 1,
      lead_id: 1,
      user_id: 1,
      activity_type: 'call',
      title: 'Initial consultation call',
      notes: 'Discussed budget and preferences. Client interested in suburban areas.',
      duration: 30,
      activity_date: '2025-01-10',
      created_at: '2025-01-10T10:30:00Z',
      user_name: 'Agent Smith'
    },
    {
      id: 2,
      lead_id: 1,
      user_id: 1,
      activity_type: 'email',
      title: 'Sent property listings',
      notes: 'Emailed 5 properties matching their criteria',
      activity_date: '2025-01-11',
      created_at: '2025-01-11T14:00:00Z',
      user_name: 'Agent Smith'
    }
];

const MeUnion = z.union([UserSchema, z.object({ user: UserSchema })]);

export const getCurrentUser = async (opts?: {
  bustCache?: boolean;          // send Cache-Control: no-cache
  signal?: AbortSignal;         // support cancellation
}): Promise<User> => {
  const cfg = {
    headers: opts?.bustCache ? { "Cache-Control": "no-cache" } : undefined,
    signal: opts?.signal,
  };

  // First try the common path: /auth/me
  try {
      const data = await request<any>(
        () => http.get("/users/me", cfg),
        { idempotent: true }
      );
      const parsed = MeUnion.parse(data);
      return "user" in parsed ? parsed.user : parsed;
    } catch (e) {
        const err = toApiError(e);
        throw err;
    }
};

const AnyAuth = z.union([
  z.object({
    access_token: z.string(),
    token_type: z.string().optional(),
    refresh_token: z.string().optional(),
    user: UserSchema.optional(),
  }),
  z.object({
    token: z.string(),
    token_type: z.string().optional(),
    refresh_token: z.string().optional(),
    user: UserSchema.optional(),
  }),
  z.object({
    accessToken: z.string(),
    tokenType: z.string().optional(),
    refreshToken: z.string().optional(),
    user: UserSchema.optional(),
  }),
]);



// -------- Auth --------
const AuthResponse = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  user: UserSchema,
});
type AuthResponse = z.infer<typeof AuthResponse>;



async function fetchMeAndStore(): Promise<User | undefined> {
  try {
    const dataA = await request<any>(() => http.get("/users/me"), { idempotent: true });
    const parsedA = MeUnion.safeParse(dataA);
    console.log("Fetched /users/me:", dataA, parsedA);
    if (parsedA.success) {
      const user = "user" in parsedA.data ? parsedA.data.user : parsedA.data;
      auth.setUser(user);
      return user;
    }
  } catch {}

}

  // // Auth
  // export const login = async (
  //   username: string,
  //   password: string
  // ): Promise<{ token: string; user: User }> => {
  //   console.log("login called");
  //   const data = await request<AuthResponse>(
  //     () => http.post("/users/login", { username, password }),
  //     // { validate: (d) => AuthResponse.parse(d) }
  //   );
  //   console.log(data);
  //   const parsed = AnyAuth.parse(data);
  //   auth.set({ accessToken: data.access_token, refreshToken: data.refresh_token });
  //   let user: User | undefined = ("user" in parsed ? (parsed as any).user : undefined);
  //   if (user) {
  //     // validate & store
  //     user = UserSchema.parse(user);
  //     auth.setUser(user);
  //   } else {
  //     user = await fetchMeAndStore();
  //     console.log("Fetched user after login:", user);
  //   }
  //   return {token: data.access_token, user: data.user};
  //   // return { token: data.access_token, user: data.user };
  // };

  export const login = async (
    username: string,
    password: string
  ): Promise<{ token: string; user?: User }> => {
    const res = await http.post("/users/login", { username, password });
    const d = res.data as any;
  
    // normalize token fields
    const token =
      d?.access_token ?? d?.token ?? d?.accessToken;
    const tokenType =
      d?.token_type ?? d?.tokenType ?? "Bearer";
    const refresh =
      d?.refresh_token ?? d?.refreshToken;
  
    if (!token) throw new Error("Login response missing token");
  
    // persist for later requests (interceptor will use this)
    auth.set({ accessToken: token, refreshToken: refresh });
    if (d?.user) auth.setUser(d.user); // if backend returned a user
  
    // EXPLICIT /users/me with the fresh token (avoids interceptor/race issues)
    try {
      const cfg: any = {};
      const h = AxiosHeaders.from(cfg.headers);
      h.set("Authorization", `${/bearer/i.test(tokenType) ? "Bearer" : tokenType} ${token}`);
      cfg.headers = h;
  
      const meRes = await http.get("/users/me", cfg);
      const me = UserSchema.parse(("user" in meRes.data) ? meRes.data.user : meRes.data);
      auth.setUser(me);
      return { token, user: me };
    } catch (e) {
      // If /users/me fails, still return token; UI can fetch later
      return {token: token, user: d.user};
    }
  };
  
  export const register = async (payload: {
    username: string; email: string; password: string;
    first_name?: string; last_name?: string;
  }): Promise<{ token: string; user: User }> => {
    // Some backends return tokens; some return only user
    const data = await request<any>(() => http.post("/users/register", payload));
    const parsed = AuthResponse.safeParse(data);
  
    if (parsed.success) {
      auth.set({ accessToken: parsed.data.access_token, refreshToken: parsed.data.refresh_token });
      return { token: parsed.data.access_token, user: parsed.data.user };
    }
  
    // If only user returned, auto-login
    const loginData = await request<AuthResponse>(
      () => http.post("/users/login", { username: payload.username, password: payload.password }),
      { validate: (d) => AuthResponse.parse(d) }
    );
    auth.set({ accessToken: loginData.access_token, refreshToken: loginData.refresh_token });
    return { token: loginData.access_token, user: loginData.user };
};


// -------- Leads --------
const LeadsEnvelopeA = z.object({ items: z.array(LeadSchema), total: z.number().int() });
const LeadsEnvelopeB = z.object({ results: z.array(LeadSchema), count: z.number().int() });
const LeadsEnvelopeC = z.object({ leads: z.array(LeadSchema), total: z.number().int() });
const LeadsAny = z.union([LeadsEnvelopeA, LeadsEnvelopeB, LeadsEnvelopeC]);
  
  // Leads
export const getLeads = async (params?: {
    search?: string; status?: string; page?: number; limit?: number;
  }): Promise<{ leads: Lead[]; total: number }> => {
    const data = await request<any>(
      () => http.get("/leads", { params }),
      { idempotent: true, retries: 2 }
    );
    const p = LeadsAny.safeParse(data);
    if (p.success) {
      if ("items" in p.data) return { leads: p.data.items, total: p.data.total };
      if ("results" in p.data) return { leads: p.data.results, total: p.data.count };
      return { leads: p.data.leads, total: p.data.total };
    }
    // Fallback: allow backend that directly returns array
    const arr = z.array(LeadSchema).parse(data);
    return { leads: arr, total: arr.length };
};
  
export const getLead = async (id: number): Promise<Lead> => {
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid lead id");
  return request<Lead>(() => http.get(`/leads/${id}`), {
    idempotent: true,
    validate: (d) => LeadSchema.parse(d),
  });
};
  

export const createLead = async (payload: Partial<Lead>): Promise<Lead> => {
  return request<Lead>(() => http.post("/leads", payload), {
    validate: (d) => LeadSchema.parse(d),
  });
};

export const updateLead = async (id: number, payload: Partial<Lead>): Promise<Lead> => {
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid lead id");
  return request<Lead>(() => http.put(`/leads/${id}`, payload), {
    validate: (d) => LeadSchema.parse(d),
  });
};

export const deleteLead = async (id: number): Promise<void> => {
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid lead id");
  await request<void>(() => http.delete(`/leads/${id}`));
};
  
  // Activities
export const getLeadActivities = async (leadId: number): Promise<Activity[]> => {
    if (!Number.isInteger(leadId) || leadId <= 0) throw new Error("Invalid lead id");
    return request<Activity[]>(
      () => http.get(`/leads/${leadId}/activities`),
      { idempotent: true, validate: (d) => z.array(ActivitySchema).parse(d) }
    );
};
  
  export const createActivity = async (leadId: number, data: Partial<Activity>): Promise<Activity> => {
    if (!Number.isInteger(leadId) || leadId <= 0) throw new Error("Invalid lead id");
    const lead = mockLeads.find(l => l.id === leadId);
    if (lead) {
      if(lead.activity_count)
        lead.activity_count++;
    }
    return request<Activity>(
      () => http.post(`/leads/${leadId}/activities`, data),
      { validate: (d) => ActivitySchema.parse(d) }
    );
    

  };
  
  // Dashboard
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const raw = await request<any>(() => http.get('/dashboard'), { idempotent: true });
  console.log(raw);
  return normalizeDashboard(raw);
    // return request<DashboardStats>(
    //   () => http.get("/dashboard"),
    //   { idempotent: true, validate: (d) => DashboardStatsSchema.parse(d) }
    // );
};
  