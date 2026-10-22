"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useDemo } from "./demo-provider";
import { Icon, Badge, PageHeading, ActionLink, Empty } from "./ui";
import { projects, projectName, workforce, displayDate } from "@/lib/demo-data";
import { Role } from "@/lib/models";
import { DailyForm } from "./daily-form";
import { Approvals, DailyPreview } from "./report-views";
import { Monthly } from "./monthly";

const navigation = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/projects", label: "Projects", icon: "building" },
  { href: "/daily-reports", label: "Daily reports", icon: "file" },
  { href: "/approvals", label: "Approvals", icon: "check" },
  { href: "/monthly-progress", label: "Monthly progress", icon: "chart" },
  { href: "/archive", label: "Reports archive", icon: "archive" },
];
export function Workspace({ screen }: { screen: string }) {
  const { role, setRole, ready, storageError, data } = useDemo();
  const [menu, setMenu] = useState(false);
  const active = (href: string) =>
    href === "/" ? screen === "dashboard" : screen.startsWith(href.slice(1));
  const title =
    navigation.find((n) => active(n.href))?.label ??
    (screen.startsWith("monthly") ? "Monthly reports" : "Workspace");
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {menu && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? "is-open" : ""}`}>
        <Link href="/" className="brand" onClick={() => setMenu(false)}>
          <span className="brand-symbol">
            A<span />
          </span>
          <span>
            ATMOSPHERA<small>CONSTRUCTION</small>
          </span>
        </Link>
        <div className="workspace-label">PROJECT WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setMenu(false)}
              aria-current={active(n.href) ? "page" : undefined}
              className={`nav-item ${active(n.href) ? "active" : ""}`}
            >
              <Icon name={n.icon} />
              <span>{n.label}</span>
              {n.icon === "check" &&
                data.reports.some((r) => r.status === "Submitted") && (
                  <b>
                    {
                      data.reports.filter((r) => r.status === "Submitted")
                        .length
                    }
                  </b>
                )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-note">
            <span className="live-dot" /> DEMO WORKSPACE
            <p>
              Explore the workflow.
              <br />
              Your changes stay in this browser.
            </p>
          </div>
          <Link
            className={`nav-item ${screen === "settings" ? "active" : ""}`}
            href="/settings"
            onClick={() => setMenu(false)}
          >
            <Icon name="settings" />
            Users & settings
          </Link>
          <div className="company-note">
            PT Bali Atmosphera Construction
            <br />
            <span>Built on attention to detail.</span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Icon name="menu" />
            </button>
            <span className="breadcrumb">
              Workspace <span>/</span> <strong>{title}</strong>
            </span>
          </div>
          <div className="topbar-user">
            <span className="demo-pill">DEMO</span>
            <label className="role-switch">
              <span className="sr-only">Demo role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option>Site Manager</option>
                <option>Project Manager</option>
                <option>Director / Admin</option>
              </select>
            </label>
            <div className="avatar">
              {role === "Site Manager"
                ? "AP"
                : role === "Project Manager"
                  ? "SM"
                  : "DA"}
            </div>
          </div>
        </header>
        <main id="main-content" className="main-content">
          {storageError && (
            <div className="notice error" role="alert">
              {storageError}
            </div>
          )}
          {!ready ? (
            <div className="empty" role="status">
              Loading your workspace…
            </div>
          ) : (
            <>
              {screen === "dashboard" && <Dashboard />}
              {screen === "projects" && <Projects />}
              {screen === "daily-reports" && <Reports />}
              {screen === "archive" && <Reports archive />}
              {screen.startsWith("daily-reports/") && (
                <DailyForm key={screen} id={screen.split("/")[1]} />
              )}
              {screen === "approvals" && <Approvals />}
              {screen.startsWith("preview/") && (
                <DailyPreview id={screen.split("/")[1]} />
              )}
              {screen.startsWith("monthly") && (
                <Monthly key={screen} mode={screen} />
              )}
              {screen === "settings" && <Settings />}
            </>
          )}
        </main>
        <footer className="workspace-footer">
          <span>
            ATMOSPHERA <span className="muted">/ Site Reports</span>
          </span>
          <span>Demo prototype · All data is illustrative</span>
        </footer>
      </div>
    </div>
  );
}

function Dashboard() {
  const { data } = useDemo();
  const pending = data.reports.filter((r) => r.status === "Submitted").length;
  const approved = data.reports.filter((r) => r.status === "Approved").length;
  return (
    <>
      <PageHeading
        eyebrow="THE BIG PICTURE"
        title="Site overview"
        description="Every site. Every detail. One clear picture."
      >
        <ActionLink href="/daily-reports/new">
          <Icon name="plus" size={18} />
          Create daily report
        </ActionLink>
      </PageHeading>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">PRECISION IN EVERY STEP</div>
          <h2>
            Good projects start
            <br />
            with clear reporting.
          </h2>
          <p>
            Bring your site teams, progress and decisions
            <br className="desktop-only" /> together — from the first pour to
            the final detail.
          </p>
          <Link href="/projects" className="hero-link">
            Explore your projects <Icon name="arrow" size={18} />
          </Link>
          <div className="hero-caption">
            <span />
            PT BALI ATMOSPHERA CONSTRUCTION
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="visual-label">
            ATM—001 <span>UMALAS, BALI</span>
          </div>
          <Image
            unoptimized
            width={1100}
            height={720}
            src="/villa-uma.svg"
            alt=""
          />
          <div className="visual-bottom">
            Villa Uma Residence <span>ARCHITECTURAL STUDY / DEMO</span>
          </div>
        </div>
      </section>
      <div className="stat-grid">
        {[
          {
            label: "Active projects",
            value: projects.length,
            icon: "building",
            note: "Across Bali",
          },
          {
            label: "Daily reports",
            value: data.reports.length,
            icon: "file",
            note: "All reporting dates",
          },
          {
            label: "Awaiting approval",
            value: pending,
            icon: "clock",
            note: "Ready for PM review",
          },
          {
            label: "Approved reports",
            value: approved,
            icon: "check",
            note: "Available for client reporting",
          },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-top">
              {s.label}
              <Icon name={s.icon} />
            </div>
            <strong>{String(s.value).padStart(2, "0")}</strong>
            <small>{s.note}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recent site reports</h2>
              <p>Latest updates from the field</p>
            </div>
            <Link className="text-link" href="/daily-reports">
              View all <Icon name="arrow" size={16} />
            </Link>
          </div>
          <ReportTable reports={data.reports.slice(0, 4)} />
        </section>
        <section className="panel review-panel">
          <div className="round-icon">
            <Icon name="check" size={24} />
          </div>
          <div className="eyebrow">KEEP THINGS MOVING</div>
          <h2>
            {pending
              ? `${pending} report${pending > 1 ? "s" : ""} ready for your review.`
              : "You’re all caught up."}
          </h2>
          <p>
            Review site updates, leave clear feedback and keep client reporting
            on track.
          </p>
          <ActionLink href="/approvals" secondary>
            Open approval desk
          </ActionLink>
          <div className="review-rule" />
          <small>
            Only approved daily reports are included in official monthly
            reporting.
          </small>
        </section>
      </div>
      <section>
        <div className="panel-heading standalone">
          <div>
            <h2>On site, in focus</h2>
            <p>A closer look at your active projects</p>
          </div>
          <Link href="/projects" className="text-link">
            All projects <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="project-grid">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} id={p.id} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}

function ProjectCard({ id, index }: { id: string; index: number }) {
  const { data } = useDemo();
  const project = projects.find((p) => p.id === id)!;
  const monthly = data.monthly.find(
    (m) => m.projectId === id && m.month === "2026-10",
  );
  return (
    <article className="project-card">
      <div className="project-image">
        <Image
          unoptimized
          width={1100}
          height={720}
          src={`/project-${index + 1}.svg`}
          alt={`Architectural concept illustration for ${project.name}`}
        />
        <span className="project-code">{project.code}</span>
        <span className="concept-label">CONCEPT / DEMO</span>
      </div>
      <div className="project-info">
        <div className="flex justify-between items-start gap-3">
          <h3>{project.name}</h3>
          <span className="live-dot" />
        </div>
        <p className="location">
          <Icon name="pin" size={14} />
          {project.location}
        </p>
        <div className="progress-label">
          <span>PM-entered progress · Oct 2026</span>
          <strong>{monthly?.actual ?? 0}%</strong>
        </div>
        <div className="progress-track">
          <span style={{ width: `${monthly?.actual ?? 0}%` }} />
        </div>
        <div className="project-bottom">
          <span>{project.manager}</span>
          <Link
            href={`/daily-reports?project=${id}`}
            aria-label={`View reports for ${project.name}`}
          >
            <Icon name="arrow" size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
}
function Projects() {
  return (
    <>
      <PageHeading
        eyebrow="YOUR PORTFOLIO"
        title="Projects"
        description="A shared view of the sites you’re bringing to life."
      />
      <div className="notice">
        Demonstration portfolio · Project and team administration will connect
        to Supabase in the next phase.
      </div>
      <div className="project-grid">
        {projects.map((p, i) => (
          <ProjectCard id={p.id} index={i} key={p.id} />
        ))}
      </div>
      <section className="panel mt-6">
        <div className="panel-heading">
          <h2>Project directory</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Site manager</th>
                <th>Work package</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <small>{p.code}</small>
                  </td>
                  <td>{p.manager}</td>
                  <td>{p.package}</td>
                  <td>{p.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export function ReportTable({
  reports,
}: {
  reports: ReturnType<typeof useDemo>["data"]["reports"];
}) {
  if (!reports.length)
    return (
      <Empty title="No reports to show">
        <p>Create a report or adjust your filters.</p>
      </Empty>
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Project / report</th>
            <th>Report date</th>
            <th>Status</th>
            <th>
              <span className="sr-only">Open report</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td>
                <strong>{projectName(r.projectId)}</strong>
                <small>
                  {r.manager} · Revision {r.revision}
                </small>
              </td>
              <td>
                {displayDate(r.date)}
                <small>{workforce(r)} personnel</small>
              </td>
              <td>
                <Badge status={r.status} />
              </td>
              <td>
                <Link
                  className="table-open"
                  href={`/daily-reports/${r.id}`}
                  aria-label={`Open ${projectName(r.projectId)} report for ${r.date}`}
                >
                  <Icon name="arrow" size={18} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Reports({ archive = false }: { archive?: boolean }) {
  const { data } = useDemo();
  const [project, setProject] = useState(() =>
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("project") ?? "")
      : "",
  );
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const reports = data.reports
    .filter(
      (r) =>
        (!archive || r.status === "Approved") &&
        (!project || r.projectId === project) &&
        (!status || r.status === status) &&
        `${projectName(r.projectId)} ${r.manager} ${r.date}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <PageHeading
        eyebrow={archive ? "CLIENT-READY RECORDS" : "FROM THE FIELD"}
        title={archive ? "Reports archive" : "Daily reports"}
        description={
          archive
            ? "Approved records, preserved for a clear project history."
            : "Capture the day. Keep everyone on the same page."
        }
      >
        <ActionLink href="/daily-reports/new">
          <Icon name="plus" size={18} />
          Create daily report
        </ActionLink>
      </PageHeading>
      <div className="panel">
        <div className="filters">
          <label className="search-field">
            <span className="sr-only">Search reports</span>
            <input
              placeholder="Search project, manager or date…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            <span className="sr-only">Filter project</span>
            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          {!archive && (
            <label>
              <span className="sr-only">Filter status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                {["Draft", "Submitted", "Revision Required", "Approved"].map(
                  (s) => (
                    <option key={s}>{s}</option>
                  ),
                )}
              </select>
            </label>
          )}
          <span className="muted text-sm">{reports.length} reports</span>
        </div>
        <ReportTable reports={reports} />
      </div>
      {archive && (
        <div className="panel mt-6">
          <div className="panel-heading">
            <h2>Approved monthly reports</h2>
          </div>
          {data.monthly.filter((m) => m.status === "Approved").length ? (
            data.monthly
              .filter((m) => m.status === "Approved")
              .map((m) => (
                <div className="archive-row" key={`${m.projectId}-${m.month}`}>
                  <span>
                    {projectName(m.projectId)} · {m.month}
                  </span>
                  <Link
                    className="text-link"
                    href={`/monthly-preview?project=${m.projectId}`}
                  >
                    View report <Icon name="arrow" size={16} />
                  </Link>
                </div>
              ))
          ) : (
            <Empty title="No monthly reports approved yet">
              <p>Build a monthly report and request director approval.</p>
            </Empty>
          )}
        </div>
      )}
    </>
  );
}
function Settings() {
  const { reset } = useDemo();
  const [message, setMessage] = useState("");
  return (
    <>
      <PageHeading
        eyebrow="WORKSPACE ADMINISTRATION"
        title="Users & settings"
        description="A foundation for your connected reporting workspace."
      />
      <div className="notice">
        Demo roles simulate the workflow only. There is no authentication or
        secure access control in this prototype.
      </div>
      <section className="panel">
        <div className="panel-heading">
          <h2>Demonstration team</h2>
          <span className="demo-pill">SAMPLE USERS</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Team member</th>
                <th>Role</th>
                <th>Scope</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Aditya Putra", "Site Manager", "Villa Uma Residence"],
                ["Made Wijaya", "Site Manager", "Canggu Coastal Retreat"],
                ["Dewi Lestari", "Site Manager", "Ubud Garden Villas"],
                ["Sarah Mitchell", "Project Manager", "All demo projects"],
                [
                  "Director / Admin",
                  "Director / Admin",
                  "All projects & monthly approvals",
                ],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => (
                    <td key={cell}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="settings-grid">
        <section className="panel padded">
          <h2>Data & privacy</h2>
          <p>
            Reports and compressed photos are stored in this browser only. They
            are not synchronised or backed up. Use demonstration information
            rather than confidential project data.
          </p>
          <button
            className="button secondary"
            onClick={() => {
              if (
                window.confirm(
                  "Reset all demo reports and photos? This removes your local changes.",
                )
              ) {
                reset();
                setMessage("Demo data reset.");
              }
            }}
          >
            Reset demo data
          </button>
          {message && <p role="status">{message}</p>}
        </section>
        <section className="panel padded">
          <h2>Next: connected reporting</h2>
          <p>
            The repository adapter and typed models are ready for a Supabase
            integration. Authentication, database policies, photo storage and
            audited server-side approvals are the next stage.
          </p>
          <p>
            Mobile installation metadata is included. Offline caching and an
            installable offline PWA remain for the next phase.
          </p>
        </section>
      </div>
    </>
  );
}
