# Prototype architecture and Supabase integration plan

## Current application

- `src/lib/models.ts`: daily reports, photos, projects, monthly progress and the
  persistence interface. No Supabase SDK or credentials are bundled.
- `src/lib/repository.ts`: replaceable browser persistence adapter.
- `src/lib/demo-store.ts`: external React store, hydration and persistence errors.
- `src/lib/workflow.ts`: independently tested report transitions, validation,
  revision creation and latest-approved daily source selection.
- `src/components/`: responsive workspace and first-stage workflow screens.
- `src/app/`: App Router pages, metadata, manifest and global / print styles.
- `tests/`: domain and Chromium end-to-end tests against a production server.

All prototype role checks are presentation behaviour. They must not be treated
as authorisation. The browser is an untrusted client in production.

## Proposed connected data model

Use migrations for `profiles`, `projects`, `project_memberships`, `daily_reports`,
`daily_report_revisions`, `manpower_entries`, `work_activities`, `work_quantities`,
`site_photos`, `approval_events`, `monthly_reports`, `monthly_work_packages`,
`schedule_imports`, `schedule_attachments` and `monthly_release_sources`.

Use Supabase Auth identities for staff and project membership for row-level
security. Site Managers access assigned projects. PMs review assigned projects.
Directors administer the portfolio and approve final monthly releases. Keep
service-role credentials exclusively on the server; never expose them in client
bundles. Apply private Storage bucket policies and short-lived signed photo URLs.

## Transactions and audit history

Implement submission, return, approval and revision creation as server-validated
transactions with membership checks and optimistic version checks. Approved
revision rows are immutable. Keep append-only timestamped approval events with
actual authenticated user IDs, including revision comments. A new draft revision
must not remove the previous approved revision from official reporting. Once a
new revision is approved, aggregation uses it rather than double-counting both.

Persist draft changes per authenticated user and handle concurrent edits. Use
object storage for originals and thumbnails instead of localStorage. Apply file
size, MIME, content and access checks on the server. Remove orphaned uploads via
a controlled lifecycle job.

## Monthly source integrity

PMs enter and confirm overall actual progress directly. Do not derive overall
percentages from daily report counts, manpower or quantities. Validate all
percentages and preserve the confirming user and timestamp. Package percentages
need explicit weighting and approval before any weighted calculation is added.

At submission/release, freeze the selected approved daily revision IDs, narrative,
progress figures, curve points and attachment versions. Released documents must
not change when a later daily revision is approved. Schedule background monthly
assembly, require director release, and store generated PDF artifacts with hashes.
The current demo renders live approved source data and does not provide this
release-snapshot guarantee.

## Schedule imports and PDFs

Define a versioned Excel template before implementing import: project ID,
period, work package, baseline dates and planned cumulative percentages. Enforce
file/row/cell limits, reject unexpected formats and formulas, validate dates and
0–100 values, show a preview and require PM confirmation. Keep uploaded PDF
schedules as private appendices; do not infer progress from PDFs. Never treat an
uploaded spreadsheet as already approved progress.

For reliable downloadable PDFs, add server-side rendering with embedded local
fonts, deterministic image handling, pagination and A4 visual regression tests.
The prototype uses browser print layouts and current Chromium page margin boxes.

## Mobile and PWA

Add appropriately sized platform icons, offline app shell, authenticated offline
draft/photo queue, explicit synchronisation conflict handling, service-worker
update UX and device-level testing on iOS Safari and Android Chrome. Avoid caching
private reports across logout or users. The current manifest alone is not a
complete offline PWA.

## Commercial services and deployment

No external accounts were created and no paid services were enabled. Supabase can
be connected later using a user-approved project and secure environment settings.
Deployment and paid plan changes require the owner's explicit confirmation.
