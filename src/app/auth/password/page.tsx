import { connection } from "next/server";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/forms";
import { requireEmployee } from "@/lib/auth/session";
import { appMode, supabaseConfig } from "@/lib/auth/config";
import { ConfigurationNeeded } from "@/components/auth/configuration";
export default function PasswordPage() {
  return (
    <Suspense fallback={<p className="empty">Checking access…</p>}>
      <Content />
    </Suspense>
  );
}
async function Content() {
  await connection();
  if (appMode() !== "connected" || !supabaseConfig())
    return <ConfigurationNeeded />;
  await requireEmployee();
  return (
    <main className="auth-page">
      <section className="panel padded auth-card">
        <div className="eyebrow">ATMOSPHERA / EMPLOYEE ACCESS</div>
        <h1>Set your password</h1>
        <p>Use a unique password with at least 12 characters.</p>
        <AuthForm kind="password" />
      </section>
    </main>
  );
}
