// Capture local CLI output privately; never print authentication keys.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const status = JSON.parse(
  execFileSync(".tools/supabase", ["status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
const url = status.API_URL;
if (
  !url ||
  !["127.0.0.1", "localhost"].includes(new URL(url).hostname) ||
  !status.ANON_KEY ||
  !status.SERVICE_ROLE_KEY
)
  throw new Error("A running local Supabase stack is required.");
const content =
  [
    ["SUPABASE_URL", url],
    ["SUPABASE_PUBLISHABLE_KEY", status.ANON_KEY],
    ["SUPABASE_SECRET_KEY", status.SERVICE_ROLE_KEY],
  ]
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join("\n") + "\n";
writeFileSync(".env.test.local", content, { mode: 0o600, flag: "wx" });
console.log(
  "Local test settings written to ignored .env.test.local with owner-only permissions. No keys printed. An existing file is never overwritten.",
);
