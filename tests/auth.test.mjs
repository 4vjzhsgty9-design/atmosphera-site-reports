import { test } from "node:test";
import assert from "node:assert/strict";
import { appMode, supabaseConfig } from "../src/lib/auth/config.ts";
import { isEmployee, employeeRoles } from "../src/lib/auth/roles.ts";
test("only exactly three trusted employee roles are accepted", () => {
  assert.equal(employeeRoles.length, 3);
  assert.equal(
    isEmployee({
      id: "id",
      display_name: "Synthetic",
      role: "owner",
      active: true,
    }),
    false,
  );
  assert.equal(
    isEmployee({
      id: "id",
      display_name: "Synthetic",
      role: "director_admin",
      active: true,
    }),
    true,
  );
});
test("connected mode fails closed for invalid configuration and service keys", () => {
  const names = [
    "APP_MODE",
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "APP_ORIGIN",
  ];
  const before = Object.fromEntries(names.map((n) => [n, process.env[n]]));
  try {
    process.env.APP_MODE = "invalid";
    assert.throws(() => appMode());
    process.env.APP_MODE = "connected";
    process.env.SUPABASE_URL = "http://untrusted.example";
    process.env.APP_ORIGIN = "http://127.0.0.1:3000";
    process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    assert.equal(supabaseConfig(), null);
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "sb_secret_do_not_use";
    assert.equal(supabaseConfig(), null);
    process.env.SUPABASE_PUBLISHABLE_KEY = `e30.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.not-a-signature`;
    assert.equal(supabaseConfig(), null);
    process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_example";
    assert.ok(supabaseConfig());
    process.env.APP_ORIGIN = "https://attacker.example/path";
    assert.equal(supabaseConfig(), null);
  } finally {
    for (const name of names) {
      if (before[name] === undefined) delete process.env[name];
      else process.env[name] = before[name];
    }
  }
});
