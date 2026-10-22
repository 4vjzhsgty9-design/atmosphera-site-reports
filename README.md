# Atmosphera Site Reports

Professional daily and monthly construction reporting application for PT Bali Atmosphera Construction.

Features:
- Daily site reports
- Manpower and work progress tracking
- Site photographs
- Project Manager approval
- Daily PDF reports
- Monthly reports with construction schedule and S-Curve

## First working prototype

Built with Next.js 16 App Router, React, TypeScript and Tailwind CSS 4. All assets
and application data are local. No paid services, API keys or Supabase account
are required. This application has not been deployed.

### Run locally

Use Node.js 24 LTS (minimum 22.18) and npm:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000` in your local browser. In a remote workspace, use a
supported port-forwarding facility for port 3000; this onboarding chat does not
provide a public preview. For a production-mode local check:

```sh
npm run build
npm run start
```

In this cloud machine, the normal home directory is read-only. If npm reports a
cache permission error, prefix dependency commands with
`npm_config_cache=/tmp/atmosphera-npm-cache`, for example:

```sh
npm_config_cache=/tmp/atmosphera-npm-cache npm ci
```

### Screens

| Route | Screen |
| --- | --- |
| `/` | Dashboard with portfolio and reporting overview |
| `/projects` | Construction projects and site manager directory |
| `/daily-reports` | Searchable, filterable daily reports |
| `/daily-reports/new` | Mobile form with all ten daily report sections |
| `/daily-reports/:id` | Saved report, status and revision history |
| `/approvals` | PM review, comments, approval and revision requests |
| `/preview/:id` | A4 daily report preview and Print / Save PDF |
| `/monthly-progress` | October 2026 example S-Curve and work package progress |
| `/monthly-builder` | Manual PM progress, narrative and director approval |
| `/monthly-preview` | Monthly A4 client report preview |
| `/archive` | Approved daily and monthly records |
| `/settings` | Demo team, storage information and demo reset |

Use the **Demo role** selector in the header to simulate Site Manager,
Project Manager and Director / Admin. It is not a login or security boundary.

### Try the workflow

1. Create a daily report. Enter a work package and completed work description.
2. Add manpower, quantities and a photo. Drafts save as you type, including a
   reloadable report URL. Files are compressed to JPEG and stored in the browser;
   the demo supports six photos per report, not production photo storage.
3. Submit the report. Open Approvals as Project Manager. Return it with a comment
   or approve it. Approved records are locked; creating a revision preserves the
   original and its history.
4. Open PDF preview and choose **Print / Save PDF**. Select A4, background
   graphics, and disable browser-added headers and footers. Print page numbers
   use CSS page margin boxes, supported by current Chromium. Other browsers may
   render page footers differently. Unapproved previews are labelled DRAFT.
5. In Monthly Report Builder, enter actual progress yourself, confirm it as PM,
   then submit it for Director / Admin approval. Switch the demo role to approve.
   Daily report counts never determine the overall project progress.

### Validation

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests use the production build and start a local server if needed. When
system Chromium is already installed, avoid downloading a second browser:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Tests cover report submission, approval permissions, required revision comments,
immutable approved revisions, latest-approved monthly aggregation, mobile screens,
autosave across reloads, photo upload, director approval, and PDF rendering.
PDF test artifacts are written to the system temporary directory.

### Prototype boundaries

- Sample projects, users and historical S-Curve data are fictional. Project
  cover images are bundled architectural concept illustrations, not site photos.
- Browser localStorage is the only persistence. Data is not shared between users,
  devices or browsers and is not backed up. Quota or access errors are shown;
  use non-confidential demonstration data. Concurrent tab editing is not supported.
- Roles and approval actions are browser simulations. No authentication, RLS,
  server audit trail, real staff/project administration or notifications yet.
- Monthly reporting is limited to the October 2026 demonstration period. The
  latest approved daily revisions are aggregated when the preview is opened.
  Immutable monthly release snapshots and scheduled generation are not implemented.
- PDFs are exported through the browser print dialog, not generated or sent on a
  background schedule. Schedules cannot yet be imported from Excel or attached as
  PDF; this is stated in the builder instead of silently accepting unchecked files.
- A web app manifest and app icon provide mobile metadata. Full PWA installability,
  offline caching, update handling and device testing are the next phase.

### Next stage

See [Architecture and integration plan](docs/architecture.md). Connect Supabase
Auth, PostgreSQL with row-level security, and private photo storage; move workflow
transitions to the server; freeze released monthly source data; add validated
Excel schedule imports with explicit PM confirmation and PDF appendices; implement
background PDF generation, actual user/project administration and an offline PWA.
Do not deploy or enable paid services without the owner's confirmation.

## Phase 2 / Stage 1: Supabase access foundation

The original demo remains the default (`APP_MODE=demo`). Stage 1 adds a separate
`connected` mode with server-verified employee sign-in, three database roles,
project RLS, private Storage policies, Director project/employee administration
and project assignment. No real data is seeded and no deployment is performed.

Start with the [beginner-friendly Supabase guide in Russian](docs/supabase-setup-ru.md).
The [security boundary and test commands](docs/stage-1-security.md) describe what
is verified and what remains deliberately disabled. Connected daily-report
persistence is **Stage 2**, which requires the owner's separate approval.

The legacy prototype limitations above describe **demo mode**. In connected mode,
roles cannot be selected by the user, records come only from Supabase, and missing
configuration does not load demo data. Original logo assets and PDF references
are still reserved for the later PDF/branding stage.
