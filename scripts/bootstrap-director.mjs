// Explicit one-time provisioning of an EXISTING test Auth account, no passwords in CLI args.
import { createClient } from "@supabase/supabase-js";
const { SUPABASE_URL: url, SUPABASE_SECRET_KEY: key } = process.env;
const id = process.argv[2];
if (!url || !key || !id || !/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id))
  throw new Error(
    "Set server-only settings and provide an existing test Auth user UUID.",
  );
const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { count, error: countError } = await client
  .from("profiles")
  .select("id", { count: "exact", head: true })
  .eq("role", "director_admin")
  .eq("active", true);
if (countError)
  throw new Error("Could not check directors. Apply the migration first.");
if (count)
  throw new Error(
    "An active Director already exists. Use the authorised admin UI.",
  );
const { data: user, error: userError } =
  await client.auth.admin.getUserById(id);
if (userError || !user.user) throw new Error("Auth user not found.");
const { error } = await client.from("profiles").insert({
  id,
  display_name: "Test Director",
  role: "director_admin",
  active: true,
});
if (error)
  throw new Error(
    "Director provisioning failed. Check the schema and test user.",
  );
console.log(
  "Test Director provisioned. No project or real employee data created.",
);
