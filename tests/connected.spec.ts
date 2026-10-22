import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID, randomBytes } from "node:crypto";
const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SECRET_KEY!;
const anon = process.env.SUPABASE_PUBLISHABLE_KEY!;
const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const suffix = randomUUID().slice(0, 8);
const password = randomBytes(24).toString("base64url");
const users: { id: string; email: string; role: string }[] = [];
const projects: string[] = [];
const projectA = `Synthetic A ${suffix}`;
const projectB = `Synthetic B ${suffix}`;
const projectC = `Synthetic C ${suffix}`;
let directorId: string;
test.beforeAll(async () => {
  for (const role of ["director_admin", "project_manager", "site_manager"]) {
    const email = `${role}-${suffix}@example.test`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user)
      throw new Error("Could not provision synthetic Auth fixture.");
    users.push({ id: data.user.id, email, role });
    const { error: profileError } = await admin.from("profiles").insert({
      id: data.user.id,
      display_name: `Test ${role} ${suffix}`,
      role,
      active: true,
    });
    if (profileError) throw new Error("Could not provision synthetic profile.");
  }
  directorId = users[0].id;
  const { data, error } = await admin
    .from("projects")
    .insert([
      { name: projectA, code: `A-${suffix}` },
      { name: projectB, code: `B-${suffix}` },
    ])
    .select("id");
  if (error || !data) throw new Error("Could not provision test projects.");
  projects.push(...data.map((p) => p.id));
  const { error: membershipError } = await admin
    .from("project_memberships")
    .insert([
      { project_id: projects[0], user_id: users[1].id },
      { project_id: projects[1], user_id: users[2].id },
    ]);
  if (membershipError) throw new Error("Could not provision test memberships.");
});
test.afterAll(async () => {
  // Clean only IDs created by this test, never the whole database.
  const { data: extra } = await admin
    .from("projects")
    .select("id")
    .eq("code", `C-${suffix}`);
  for (const p of extra ?? [])
    if (!projects.includes(p.id)) projects.push(p.id);
  const { data: inviteUsers } = await admin.auth.admin.listUsers();
  const invites =
    inviteUsers?.users.filter(
      (u) => u.email === `invite-${suffix}@example.test`,
    ) ?? [];
  const ids = [...users.map((u) => u.id), ...invites.map((u) => u.id)];
  if (ids.length) {
    await admin.from("audit_events").delete().in("actor_id", ids);
    await admin.from("project_memberships").delete().in("user_id", ids);
  }
  if (projects.length)
    await admin.from("project_memberships").delete().in("project_id", projects);
  if (projects[1])
    await admin.storage
      .from("site-photos")
      .remove([`${projects[1]}/${suffix}.png`]);
  if (projects.length) await admin.from("projects").delete().in("id", projects);
  if (ids.length) await admin.from("profiles").delete().in("id", ids);
  for (const id of ids) await admin.auth.admin.deleteUser(id);
});
test("sign in, admin projects, invitation, membership, recovery and logout work without demo data", async ({
  page,
}) => {
  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await page.getByLabel("Email address").fill(users[0].email);
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Sign-in failed");
  await page.getByLabel("Email address").fill(users[0].email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Employee workspace" }),
  ).toBeVisible();
  await expect(page.getByLabel("Demo role")).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("atmosphera-demo-v1")),
  ).toBeNull();
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "Projects", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: projectA, exact: true }),
  ).toBeVisible();
  const create = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Create a test project",
      exact: true,
    }),
  });
  await create.getByLabel("Project code").fill(`C-${suffix}`);
  await create.getByLabel("Project name").fill(projectC);
  await create
    .getByLabel("Location", { exact: true })
    .fill("Synthetic location");
  await create
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: projectC, exact: true }),
  ).toBeVisible();
  const card = page.locator("section").filter({
    has: page.getByRole("heading", { name: projectC, exact: true }),
  });
  await card.getByText("Edit project", { exact: true }).click();
  await card
    .getByRole("button", { name: "Archive project", exact: true })
    .click();
  await expect(
    card.getByRole("button", { name: "Restore project", exact: true }),
  ).toBeVisible();
  await page.goto("/settings");
  const invite = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Invite a test employee",
      exact: true,
    }),
  });
  await invite.getByLabel("Test employee name").fill(`Test invite ${suffix}`);
  await invite
    .getByLabel("Test employee email")
    .fill(`invite-${suffix}@example.test`);
  await invite
    .getByRole("combobox", { name: /^Role/ })
    .selectOption("site_manager");
  await invite
    .getByRole("button", { name: "Invite employee", exact: true })
    .click();
  await expect(invite.getByRole("status")).toContainText("Employee invited");
  const assignment = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Project assignments",
      exact: true,
    }),
  });
  await assignment
    .getByRole("combobox", { name: /^Project/ })
    .selectOption(projects[1]);
  await assignment
    .getByRole("combobox", { name: /^Employee/ })
    .selectOption(users[1].id);
  await assignment.getByRole("button", { name: "Update assignment" }).click();
  await expect(assignment.getByRole("status")).toContainText(
    "Project assignment updated",
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await page.getByLabel("Email address").fill(users[2].email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Employee workspace", exact: true }),
  ).toBeVisible();
  await page.goto("/projects");
  await expect(
    page.getByRole("heading", { name: projectB, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: projectA, exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: projectC, exact: true }),
  ).toHaveCount(0);
  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { name: "Your account" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Invite employee" }),
  ).toHaveCount(0);
  const { data: link, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: users[2].email,
  });
  if (error || !link.properties?.hashed_token)
    throw new Error("Local recovery link generation failed.");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.goto(
    `/auth/confirm?type=recovery&token_hash=${encodeURIComponent(link.properties.hashed_token)}`,
  );
  await expect(
    page.getByRole("heading", { name: "Set your password" }),
  ).toBeVisible();
  const replacement = randomBytes(24).toString("base64url");
  await page.getByLabel("New password", { exact: true }).fill(replacement);
  await page.getByLabel("Confirm password", { exact: true }).fill(replacement);
  await page.getByRole("button", { name: "Set password", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Employee workspace" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  const memberClient = createClient(url, anon, {
    auth: { persistSession: false },
  });
  expect(
    (
      await memberClient.auth.signInWithPassword({
        email: users[2].email,
        password: replacement,
      })
    ).error,
  ).toBeNull();
});
test("REST and RPC requests cannot bypass roles or project assignment", async () => {
  const anonymous = createClient(url, anon, {
    auth: { persistSession: false },
  });
  expect((await anonymous.from("projects").select("id")).error).not.toBeNull();
  expect(
    (
      await anonymous.auth.signUp({
        email: `signup-${suffix}@example.test`,
        password,
      })
    ).error,
  ).not.toBeNull();
  const pm = createClient(url, anon, { auth: { persistSession: false } });
  expect(
    (await pm.auth.signInWithPassword({ email: users[1].email, password }))
      .error,
  ).toBeNull();
  const { data, error } = await pm
    .from("projects")
    .select("id")
    .eq("id", projects[0]);
  expect(error).toBeNull();
  expect(data).toHaveLength(1);
  expect(
    (
      await pm
        .from("profiles")
        .update({ role: "director_admin" })
        .eq("id", users[1].id)
    ).error,
  ).not.toBeNull();
  expect(
    (
      await pm.rpc("save_project", {
        target: null,
        project_code: "NO",
        project_name: "Forbidden",
        project_location: "",
      })
    ).error,
  ).not.toBeNull();
  const sm = createClient(url, anon, { auth: { persistSession: false } });
  // Password may have changed in the previous UI test. Use another session issued by the admin recovery flow.
  const { data: link } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: users[2].email,
  });
  if (!link.properties?.hashed_token)
    throw new Error("Local test session setup failed.");
  expect(
    (
      await sm.auth.verifyOtp({
        token_hash: link.properties.hashed_token,
        type: "magiclink",
      })
    ).error,
  ).toBeNull();
  expect(
    (await sm.from("projects").select("id").eq("id", projects[0])).data,
  ).toHaveLength(0);
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMyoAAAAASUVORK5CYII=",
    "base64",
  );
  expect(
    (
      await sm.storage
        .from("site-photos")
        .upload(`${projects[0]}/${suffix}.png`, png, {
          contentType: "image/png",
        })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await sm.storage
        .from("site-photos")
        .upload(`${projects[1]}/${suffix}.png`, png, {
          contentType: "image/png",
        })
    ).error,
  ).toBeNull();
  const signed = await sm.storage
    .from("site-photos")
    .createSignedUrl(`${projects[1]}/${suffix}.png`, 60);
  expect(signed.error).toBeNull();
  if (!signed.data?.signedUrl)
    throw new Error("Signed test file URL was not created.");
  expect((await fetch(signed.data.signedUrl)).ok).toBeTruthy();
  expect(
    (
      await anonymous.storage
        .from("site-photos")
        .download(`${projects[1]}/${suffix}.png`)
    ).error,
  ).not.toBeNull();
  expect(
    (
      await sm.storage
        .from("site-photos")
        .upload(`${projects[1]}/${suffix}.png`, png, {
          contentType: "image/png",
          upsert: true,
        })
    ).error,
  ).not.toBeNull();
  const { error: inactiveError } = await admin
    .from("profiles")
    .update({ active: false })
    .eq("id", users[2].id);
  expect(inactiveError).toBeNull();
  expect((await sm.from("projects").select("id")).data).toHaveLength(0);
  // Role changes in the DB take effect even for an already issued Auth session.
  expect(
    (
      await sm.rpc("save_project", {
        target: null,
        project_code: "NO2",
        project_name: "Forbidden",
        project_location: "",
      })
    ).error,
  ).not.toBeNull();
  expect(directorId).toBeTruthy();
});
