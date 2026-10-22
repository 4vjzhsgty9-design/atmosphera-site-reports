// Creates only a synthetic local Auth account; never works against a hosted project.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const { SUPABASE_URL: url, SUPABASE_SECRET_KEY: key } = process.env;
if (!url || !["127.0.0.1", "localhost"].includes(new URL(url).hostname) || !key)
  throw new Error(
    "Local Supabase settings are required. Hosted projects are not allowed.",
  );
const password = readFileSync(0, "utf8").trim();
if (password.length < 12 || password.length > 128)
  throw new Error(
    "Provide a 12–128 character test password through standard input.",
  );
const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { count, error: checkError } = await client
  .from("profiles")
  .select("id", { count: "exact", head: true })
  .eq("role", "director_admin")
  .eq("active", true);
if (checkError || count)
  throw new Error(
    "Apply migrations first. An existing Director must manage additional accounts.",
  );
const { data, error } = await client.auth.admin.createUser({
  email: "director@example.test",
  password,
  email_confirm: true,
});
if (error || !data.user)
  throw new Error(
    "Synthetic Auth account creation failed. It may already exist; use bootstrap-director.mjs with its ID.",
  );
const { error: profileError } = await client.from("profiles").insert({
  id: data.user.id,
  display_name: "Test Director",
  role: "director_admin",
  active: true,
});
if (profileError)
  throw new Error(
    "Test identity was created but profile provisioning failed. Use bootstrap-director.mjs with its Auth ID.",
  );
console.log(
  "Local synthetic Director created: director@example.test. Use the password you supplied.",
);
