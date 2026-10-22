import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "@/lib/auth/config";
export async function serverSupabase() {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase configuration is incomplete.");
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: config.origin.startsWith("https:"),
    },
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        // Server Components cannot write cookies; proxy refreshes them before render.
        try {
          values.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          /* Read-only render; refreshed in proxy. */
        }
      },
    },
  });
}
