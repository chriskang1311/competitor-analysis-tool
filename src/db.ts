import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

// Service client (bypasses RLS) — kept for any admin operations
export const db = url && serviceKey ? createClient(url, serviceKey) : null;

// Per-request user-scoped client — respects RLS policies
export function createUserDb(userToken: string) {
  if (!url || !anonKey) throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required");
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
  });
}
