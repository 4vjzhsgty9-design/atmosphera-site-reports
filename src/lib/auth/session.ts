import "server-only";
import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
import { appMode, supabaseConfig } from "./config";
import { isEmployee } from "./roles";
export async function requireEmployee(director = false) {
  if (appMode() !== "connected" || !supabaseConfig())
    throw new Error("Connected mode is not configured.");
  const client = await serverSupabase();
  // Never trust getSession(), client-supplied roles or user_metadata for access.
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id,display_name,role,active")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError)
    throw new Error("Employee permissions could not be loaded.");
  if (!isEmployee(profile) || !profile.active)
    redirect("/login?notice=inactive");
  if (director && profile.role !== "director_admin")
    throw new Error("Director access required.");
  return { client, user, profile };
}
