import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/lib/auth/config";
export function adminSupabase() {
  const config = supabaseConfig();
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!config || !key) throw new Error("Account invitation is not configured.");
  return createClient(config.url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
