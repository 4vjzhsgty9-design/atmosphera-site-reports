import Link from "next/link";
import { requireEmployee } from "@/lib/auth/session";
import { roleLabels, type Employee } from "@/lib/auth/roles";
import { signOut } from "@/lib/auth/actions";
import {
  ProjectForm,
  ProvisionForm,
  ArchiveForm,
  InviteForm,
  MembershipForm,
  EmployeeForm,
  type ConnectedProject,
} from "./admin-forms";
import { Icon, PageHeading } from "@/components/ui";
const links = [
  ["/", "Dashboard", "grid"],
  ["/projects", "Projects", "building"],
  ["/daily-reports", "Daily reports", "file"],
  ["/approvals", "Approvals", "check"],
  ["/monthly-progress", "Monthly progress", "chart"],
  ["/archive", "Reports archive", "archive"],
  ["/settings", "Users & settings", "settings"],
];
export async function ConnectedWorkspace({ screen }: { screen: string }) {
  const { client, profile } = await requireEmployee();
  const { data: projectRows, error } = await client
    .from("projects")
    .select("id,code,name,location,archived_at")
    .order("created_at");
  if (error)
    throw new Error(
      "Projects could not be loaded. Check the database migrations and access policies.",
    );
  const projects = (projectRows ?? []) as ConnectedProject[];
  const director = profile.role === "director_admin";
  const { data: employees, error: employeesError } =
    director && screen === "settings"
      ? await client
          .from("profiles")
          .select("id,display_name,role,active")
          .order("created_at")
      : { data: [], error: null };
  if (employeesError) throw new Error("Employee records could not be loaded.");
  const { data: memberships, error: membershipError } =
    director && screen === "settings"
      ? await client.from("project_memberships").select("project_id,user_id")
      : { data: [], error: null };
  if (membershipError)
    throw new Error("Project assignments could not be loaded.");
  const members = (employees ?? []) as Employee[];
  return (
    <div className="app-shell connected-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-symbol">
            A<span />
          </span>
          <span>
            ATMOSPHERA<small>CONSTRUCTION</small>
          </span>
        </Link>
        <div className="workspace-label">CONNECTED WORKSPACE</div>
        <nav aria-label="Main navigation">
          {links.map(([href, label, icon]) => (
            <Link
              href={href}
              key={href}
              className={`nav-item ${(href === "/" ? screen === "dashboard" : screen.startsWith(href.slice(1))) ? "active" : ""}`}
            >
              <Icon name={icon} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <p className="company-note">
            Stage 1 · Supabase foundation
            <br />
            No demonstration data is loaded.
          </p>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="breadcrumb">
            Workspace / <strong>Employee access</strong>
          </span>
          <div className="topbar-user">
            <span>{profile.display_name}</span>
            <span className="demo-pill">{roleLabels[profile.role]}</span>
            <form action={signOut}>
              <button className="button secondary">Sign out</button>
            </form>
          </div>
        </header>
        <nav className="connected-mobile-nav" aria-label="Mobile navigation">
          {links.map(([href, label]) => (
            <Link href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
        <main className="main-content" id="main-content">
          <PageHeading
            eyebrow="SECURE PROJECT FOUNDATION"
            title={
              screen === "settings"
                ? "Users & settings"
                : screen === "projects"
                  ? "Projects"
                  : "Employee workspace"
            }
            description="Stage 1 · Use synthetic test accounts and projects only."
          />
          {screen === "dashboard" && (
            <>
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-top">Accessible projects</div>
                  <strong>{projects.length}</strong>
                  <small>Enforced by database RLS</small>
                </div>
                <div className="stat-card">
                  <div className="stat-top">Your role</div>
                  <h3 className="mt-4">{roleLabels[profile.role]}</h3>
                  <small>Managed by Director / Admin</small>
                </div>
              </div>
              <div className="notice">
                Connected daily reports and monthly reporting are reserved for
                the next approved stage. The complete existing prototype remains
                available in the separate demo mode.
              </div>
            </>
          )}
          {(screen === "projects" || screen === "dashboard") && (
            <>
              <div className="project-grid">
                {projects.map((p) => (
                  <section key={p.id} className="panel padded">
                    <div className="eyebrow">
                      {p.code}
                      {p.archived_at ? " · ARCHIVED" : ""}
                    </div>
                    <h2>{p.name}</h2>
                    <p>{p.location || "No location recorded."}</p>
                    {director && screen === "projects" && (
                      <details>
                        <summary>Edit project</summary>
                        <ProjectForm project={p} />
                        <ArchiveForm project={p} />
                      </details>
                    )}
                  </section>
                ))}
              </div>
              {!projects.length && (
                <div className="panel empty">
                  <h2>No accessible projects</h2>
                  <p>
                    {director
                      ? "Create a synthetic test project below."
                      : "Your administrator can assign you to a test project."}
                  </p>
                </div>
              )}
              {director && screen === "projects" && (
                <section className="panel padded mt-6">
                  <h2>Create a test project</h2>
                  <p>No real project information during Stage 1.</p>
                  <ProjectForm />
                </section>
              )}
            </>
          )}
          {screen === "settings" &&
            (director ? (
              <>
                <div className="settings-grid">
                  <section className="panel padded">
                    <h2>Invite a test employee</h2>
                    <p>
                      Exactly three roles. Use test addresses only; local
                      Supabase captures email locally.
                    </p>
                    <InviteForm />
                  </section>
                  <section className="panel padded">
                    <h2>Project assignments</h2>
                    <p>
                      Unassigned employees cannot access project records or
                      private project files.
                    </p>
                    <MembershipForm projects={projects} employees={members} />
                  </section>
                </div>
                <section className="panel padded mt-6">
                  <h2>Employees</h2>
                  <details>
                    <summary>Provision an existing test Auth account</summary>
                    <p>
                      Use this only if an invitation created an Auth user but
                      profile provisioning failed. Find the UUID in your local
                      Auth administration.
                    </p>
                    <ProvisionForm />
                  </details>
                  <div className="project-grid mt-4">
                    {members.map((e) => (
                      <details className="panel padded" key={e.id}>
                        <summary>
                          {e.display_name} · {roleLabels[e.role]}
                          {!e.active ? " · inactive" : ""}
                        </summary>
                        <EmployeeForm employee={e} />
                      </details>
                    ))}
                  </div>
                </section>
                <section className="panel padded mt-6">
                  <h2>Current assignments</h2>
                  <ul className="source-list">
                    {memberships?.map((m) => (
                      <li key={`${m.project_id}-${m.user_id}`}>
                        {projects.find((p) => p.id === m.project_id)?.name ??
                          "Project"}{" "}
                        —{" "}
                        {members.find((e) => e.id === m.user_id)
                          ?.display_name ?? "Employee"}
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            ) : (
              <section className="panel padded">
                <h2>Your account</h2>
                <p>
                  {profile.display_name} · {roleLabels[profile.role]}
                </p>
                <p>
                  Only the Director / Admin can manage employees, roles and
                  project assignments.
                </p>
              </section>
            ))}
          {!["dashboard", "projects", "settings"].includes(screen) && (
            <section className="panel padded">
              <h2>Connected reporting is the next stage</h2>
              <p>
                Your session and project access are protected. Connecting the
                existing reporting forms to persistent data will begin only
                after Stage 2 approval.
              </p>
              <Link className="text-link" href="/projects">
                View your assigned projects →
              </Link>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
