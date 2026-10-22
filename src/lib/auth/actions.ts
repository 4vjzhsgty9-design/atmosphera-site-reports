"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { serverSupabase } from "@/lib/supabase/server";
import { appMode, supabaseConfig } from "./config";
import { requireEmployee } from "./session";
export type AuthResult = { message: string; ok?: boolean };
export async function signIn(
  _previous: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  if (appMode() !== "connected" || !supabaseConfig())
    return { message: "Connected mode is not configured." };
  const parsed = z
    .object({ email: z.email().max(254), password: z.string().min(1).max(256) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { message: "Enter a valid email and password." };
  const client = await serverSupabase();
  const { error } = await client.auth.signInWithPassword(parsed.data);
  if (error)
    return {
      message:
        "Sign-in failed. Check your credentials or contact your administrator.",
    };
  const { profile } = await requireEmployee();
  if (!profile.active)
    return { message: "Your account is inactive. Contact your administrator." };
  redirect("/");
}
export async function signOut() {
  if (appMode() === "connected" && supabaseConfig()) {
    const client = await serverSupabase();
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) throw new Error("Sign-out failed. Please retry.");
  }
  redirect("/login");
}
export async function requestPasswordReset(
  _previous: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  const config = supabaseConfig();
  if (appMode() !== "connected" || !config)
    return { message: "Connected mode is not configured." };
  const email = z.email().max(254).safeParse(form.get("email"));
  if (!email.success) return { message: "Enter a valid email address." };
  const client = await serverSupabase();
  await client.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${config.origin}/auth/confirm`,
  });
  // Same result for existing, unknown and rate-limited addresses: do not enumerate accounts.
  return {
    message:
      "If the account can receive recovery email, instructions will be sent. Check your inbox or contact your administrator.",
    ok: true,
  };
}
export async function updatePassword(
  _previous: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  const parsed = z
    .object({ password: z.string().min(12).max(128), confirm: z.string() })
    .refine((p) => p.password === p.confirm)
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { message: "Use matching passwords of 12–128 characters." };
  const { client } = await requireEmployee();
  const { error } = await client.auth.updateUser({
    password: parsed.data.password,
  });
  if (error)
    return {
      message:
        "Password could not be updated. Request a fresh recovery email and retry.",
    };
  redirect("/");
}
