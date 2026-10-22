export type AppMode = "demo" | "connected";
export function appMode(): AppMode {
  const mode = process.env.APP_MODE ?? "demo";
  if (mode !== "demo" && mode !== "connected")
    throw new Error("APP_MODE must be demo or connected.");
  return mode;
}
function safeUrl(value: string | undefined): string | null {
  try {
    const url = new URL(value ?? "");
    if (
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return null;
    if (
      url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["127.0.0.1", "localhost"].includes(url.hostname)
      )
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}
export function supabaseConfig() {
  const url = safeUrl(process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const origin = safeUrl(process.env.APP_ORIGIN);
  if (!url || !origin || !key || key.startsWith("sb_secret_")) return null;
  // Legacy JWT anon keys are also supported, but never a service-role JWT here.
  if (!key.startsWith("sb_publishable_")) {
    try {
      if (
        JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString())
          .role !== "anon"
      )
        return null;
    } catch {
      return null;
    }
  }
  return { url, key, origin };
}
