"use client";
import { useActionState } from "react";
import {
  signIn,
  requestPasswordReset,
  updatePassword,
} from "@/lib/auth/actions";
export function AuthForm({
  kind,
}: {
  kind: "login" | "recovery" | "password";
}) {
  const action =
    kind === "login"
      ? signIn
      : kind === "recovery"
        ? requestPasswordReset
        : updatePassword;
  const [state, formAction, pending] = useActionState(action, { message: "" });
  return (
    <form action={formAction} className="row-list">
      {kind !== "password" && (
        <label className="field">
          <span>Email address</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
      )}
      {kind !== "recovery" && (
        <label className="field">
          <span>{kind === "password" ? "New password" : "Password"}</span>
          <input
            name="password"
            type="password"
            autoComplete={
              kind === "password" ? "new-password" : "current-password"
            }
            required
            minLength={kind === "password" ? 12 : 1}
            maxLength={128}
          />
        </label>
      )}
      {kind === "password" && (
        <label className="field">
          <span>Confirm password</span>
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
          />
        </label>
      )}
      {state.message && (
        <p className="notice compact" role="status">
          {state.message}
        </p>
      )}
      <button className="button primary" disabled={pending}>
        {pending
          ? "Please wait…"
          : kind === "login"
            ? "Sign in"
            : kind === "recovery"
              ? "Send recovery email"
              : "Set password"}
      </button>
    </form>
  );
}
