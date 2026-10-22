import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { AuthForm } from "@/components/auth/forms";
import { ConfigurationNeeded } from "@/components/auth/configuration";
import { appMode, supabaseConfig } from "@/lib/auth/config";
export default function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<p className="empty">Loading sign in…</p>}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  if (appMode() === "demo")
    return (
      <main className="auth-page">
        <section className="panel padded auth-card">
          <h1>Demo workspace</h1>
          <p>No employee accounts are connected in demo mode.</p>
          <Link className="button primary" href="/">
            Open demo
          </Link>
        </section>
      </main>
    );
  if (!supabaseConfig()) return <ConfigurationNeeded />;
  const params = await searchParams;
  const recovery = params.mode === "recovery";
  return (
    <main className="auth-page">
      <section className="panel padded auth-card">
        <div className="eyebrow">ATMOSPHERA / EMPLOYEE ACCESS</div>
        <h1>{recovery ? "Reset your password" : "Welcome back."}</h1>
        <p>
          {recovery
            ? "Request a secure recovery email."
            : "Sign in with the account provided by your administrator."}
        </p>
        {params.notice === "inactive" && (
          <div className="notice">
            Your employee access is not active. Contact your administrator.
          </div>
        )}
        {params.notice === "expired" && (
          <div className="notice">
            This link is invalid or expired. Request a new invitation or
            recovery email.
          </div>
        )}
        <AuthForm
          key={recovery ? "recovery" : "login"}
          kind={recovery ? "recovery" : "login"}
        />
        <Link
          className="text-link mt-4"
          href={recovery ? "/login" : "/login?mode=recovery"}
        >
          {recovery ? "Back to sign in" : "Forgot your password?"}
        </Link>
        <p className="muted text-sm">
          Employee accounts are invitation-only. No public registration.
        </p>
      </section>
    </main>
  );
}
