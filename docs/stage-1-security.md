# Stage 1 security boundary and verification

## What is implemented

- Explicit server-runtime `APP_MODE`: demo is preserved, connected never falls
  back to demo data on a configuration/auth/database error.
- Supabase server-side cookie sessions with `getUser()` verification, HttpOnly,
  SameSite=Lax cookies (Secure on HTTPS), refresh in Next.js proxy, and an active
  employee lookup for every protected page/action. No client role selector in
  connected mode. Auth responses use private/no-store handling.
- Exactly three database roles: director_admin, project_manager, site_manager.
  Roles are read from profiles, not writable Auth metadata or client input.
- Invite-only accounts; no signup UI. Public email signup and anonymous Auth are
  disabled by the supplied local config and must also be disabled in hosted settings.
- A server-only admin client is used only after director authentication to invite
  Auth users; normal queries and admin RPC use the user's identity and RLS.
- Database-authorised project create/edit/archive, employee profile/role/activation
  changes, membership changes and append-only user-facing administration audit.
- Profile/role changes serialize the last-director check with an advisory lock.
  A deactivated user loses project/file access through DB role helpers without
  waiting for an existing token to expire.
- Private project-scoped buckets. Authenticated users cannot overwrite/delete
  files or insert official PDF artifacts. Malformed object paths fail closed.
- Report tables are provisioned with project-scoped SELECT policies. All ordinary
  report writes are intentionally disabled until Stage 2 implements transactional
  submission/approval/revision mutations. This is a Stage 1 foundation, not a claim
  that connected daily reporting is complete.

## Current database foundation

Tables: profiles, projects, project_memberships, daily_reports, report_entries,
monthly_reports, audit_events. Only role-authorised RPCs mutate administration
records. JSON content fields reserve a versionable report payload; structured
reporting constraints/entry schemas, canonical site-day rules and report workflow
RPCs will be added in Stage 2, not enabled prematurely.

Protected report rows and files are not physically deleted through the UI.
Archiving projects retains assignments and read access for historical records;
new uploads into archived projects are denied. Storage policies identify projects
by the first UUID segment in object paths. Company branding uses `company/...`;
project branding uses `<project_uuid>/...`. Only active employees can read company
branding and only directors may create it. Upload finalisation/content validation
belongs to the next approved upload workflow; bucket MIME and size constraints
alone are not full content validation.

## Verification commands

```sh
npm run db:install
SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io npm run db:start
npm run db:test
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run test:boundary
```

Use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` when using system
Chromium. No TLS verification or artifact checksum bypass is used.

`supabase/tests/access.test.sql` runs inside a transaction and rolls back all
synthetic fixtures. It checks exactly three roles, anonymous denial, cross-project
RLS on parent and child tables, metadata privilege escalation, direct writes/RPC
bypasses, inactive users, private file policies, no overwrite/official PDF forgery,
archiving and the last-director guard. No real employee/project seed is shipped.

### Connected Auth / browser integration tests

Run `npm run db:test-env` to capture **local** credentials into an ignored,
owner-readable `.env.test.local` without printing them. It never overwrites an
existing file. Alternatively create the file in your editor from `.tools/supabase status`. The file is ignored by Git. It needs:

```dotenv
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_PUBLISHABLE_KEY=<local anon key>
SUPABASE_SECRET_KEY=<local service_role key>
```

Then, after a production build:

```sh
npm run test:connected
```

`SUPABASE_TEST_ENV` may point to a different private env file. The connected test
configuration refuses non-loopback databases. It starts an independent connected
server on port 3102, uses synthetic `example.test` accounts and cleans up only its
own IDs. It covers unauthenticated redirects, bad credentials, login/logout,
admin project creation/archiving, invitation, project assignments, SM visibility,
recovery/password changes, REST/RPC privilege denial and immediate deactivation.
It does not send real employee email; local Mailpit captures invitations.

Keep automated tests off hosted production databases. Failing cleanup requires
review of the temporary test accounts, not deleting arbitrary database rows.

## Operational boundaries

No public deployment, hosted project creation, paid feature activation, real
employee accounts, production data migration or Stage 2 report persistence is
performed by these files. SUPABASE_SECRET_KEY must remain outside browser code
and version control. Never expose it through NEXT_PUBLIC_ variables, logs or a
client-side SDK. A server-only key can bypass RLS and is not suitable for routine
user data access.

Hosted email limits, exact auth redirect URLs, custom invite/recovery templates,
first-director bootstrap and local setup are documented in supabase-setup-ru.md.
Production hardening such as MFA, operational backups, delivery monitoring and
release deployment is a separate review; this local foundation is not a public
production readiness claim.

## Stage 1 validation record (22 October 2026)

The implementation was validated locally, without a hosted project or real data:

- Clean `npm ci`, ESLint, TypeScript, five unit tests and production build passed.
- Four original demo browser scenarios passed; one connected-without-config
  boundary scenario passed. The original demo workflow remains available.
- All **37 pgTAP database assertions** passed against the migration.
- Both connected integration scenarios passed: real Auth login/logout/recovery,
  director project/archive/invite/membership UI, REST/RPC denial, deactivation,
  and private Storage upload/read/signing/no-overwrite behaviour.
- Cleanup verified **zero profiles, projects, Auth users and Storage objects**.
  The local test stack was stopped afterwards; schema/bucket definitions remain
  in its local development volume. No application or Supabase instance was
  deployed publicly and no paid service was enabled.

The cloud Docker daemon uses `vfs` on a 32 GB root filesystem. Current full
PostgreSQL images exceeded that storage budget during layer extraction. Local
verification therefore used the official Supabase **PostgreSQL 15.1.0.117** image
via an ignored CLI version cache, with Auth 2.186.0 and Storage 1.35.3. This is a
resource-limited compatibility test, **not a recommendation to deploy that old
PostgreSQL patch release**. No old patch pin is committed to the app configuration;
`config.toml` requests major version 15. Before any hosted/production use, choose
an adequately provisioned current patched development database and rerun the
migration/security/integration suites against that target. Prefer Docker Desktop
or an environment with a suitable storage driver and more disk space for a full
local stack. No signature, TLS, checksum or database assertion was disabled.
