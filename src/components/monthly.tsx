"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MonthlyProgress } from "@/lib/models";
import { displayDate, projects, projectName, workforce } from "@/lib/demo-data";
import { officialReports } from "@/lib/workflow";
import { useDemo } from "./demo-provider";
import { Badge, Field, Icon, PageHeading, Section } from "./ui";
import { DocumentBrand } from "./report-views";

export function SCurve({ report }: { report: MonthlyProgress }) {
  const x = (i: number) => 52 + i * 84;
  const y = (v: number) => 228 - v * 1.9;
  const planned = report.curve
    .map((p, i) => `${x(i)},${y(p.planned)}`)
    .join(" ");
  const actual = report.curve
    .map((p, i) => (p.actual === null ? null : `${x(i)},${y(p.actual)}`))
    .filter(Boolean)
    .join(" ");
  return (
    <div className="curve">
      <div className="curve-legend">
        <span>
          <i className="planned" />
          Planned progress
        </span>
        <span>
          <i />
          Actual progress
        </span>
      </div>
      <svg
        viewBox="0 0 690 270"
        role="img"
        aria-label="Planned versus actual cumulative project progress from June to January"
      >
        <title>Project S-Curve: planned versus actual progress</title>
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line
              x1="52"
              y1={y(v)}
              x2="640"
              y2={y(v)}
              stroke="#e8ece9"
              strokeDasharray="4 5"
            />
            <text x="35" y={y(v) + 4} textAnchor="end">
              {v}%
            </text>
          </g>
        ))}
        <polygon points={`52,228 ${planned} 640,228`} fill="#eff5f2" />
        <polyline
          points={planned}
          fill="none"
          stroke="#a2b2a8"
          strokeWidth="2.5"
          strokeDasharray="6 5"
        />
        <polyline
          points={actual}
          fill="none"
          stroke="#355c4b"
          strokeWidth="3"
        />
        {report.curve.map((p, i) => (
          <g key={p.month}>
            {p.actual !== null && (
              <circle
                cx={x(i)}
                cy={y(p.actual)}
                r="4.5"
                fill="#355c4b"
                stroke="white"
                strokeWidth="2"
              />
            )}
            <text x={x(i)} y="253" textAnchor="middle">
              {p.month}
            </text>
          </g>
        ))}
      </svg>
      <details className="curve-data no-print">
        <summary>View chart data</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Planned</th>
                <th>Actual</th>
              </tr>
            </thead>
            <tbody>
              {report.curve.map((p) => (
                <tr key={p.month}>
                  <td>{p.month}</td>
                  <td>{p.planned}%</td>
                  <td>
                    {p.actual === null ? "Not yet reported" : `${p.actual}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export function Monthly({ mode }: { mode: string }) {
  const { data, role, upsertMonthly } = useDemo();
  const [projectId, setProjectId] = useState(() =>
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("project") ??
        projects[0].id)
      : projects[0].id,
  );
  const [message, setMessage] = useState("");
  const report =
    data.monthly.find(
      (m) => m.projectId === projectId && m.month === "2026-10",
    ) ?? data.monthly[0];
  const approved = officialReports(
    data.reports,
    report.projectId,
    report.month,
  );
  const preview = mode === "monthly-preview";
  const builder = mode === "monthly-builder";
  const editable = role !== "Site Manager" && report.status === "Draft";
  function update(patch: Partial<MonthlyProgress>) {
    if (!editable) return;
    upsertMonthly({ ...report, ...patch });
    setMessage("");
  }
  function changeProgress(key: "planned" | "actual", value: number) {
    const bounded = Math.max(
      0,
      Math.min(100, Number.isFinite(value) ? value : 0),
    );
    update({
      [key]: bounded,
      confirmed: false,
      curve: report.curve.map((p) =>
        p.month === "Oct" ? { ...p, [key]: bounded } : p,
      ),
    });
  }
  function submit() {
    if (!editable || !report.confirmed) {
      setMessage(
        "A Project Manager must confirm the actual progress before requesting director approval.",
      );
      return;
    }
    upsertMonthly({ ...report, status: "Submitted" });
    setMessage("Monthly report submitted for Director / Admin approval.");
  }
  return (
    <>
      <div className="no-print">
        <PageHeading
          eyebrow="PROGRESS, WITH PERSPECTIVE"
          title={
            preview
              ? "Monthly PDF preview"
              : builder
                ? "Monthly report builder"
                : "Monthly progress"
          }
          description={
            preview
              ? "Client-format A4 report · Export using your browser’s Save as PDF option."
              : "The full month, brought together in one considered report."
          }
        >
          <Link
            className="button secondary"
            href={`${builder ? "/monthly-preview" : "/monthly-builder"}?project=${report.projectId}`}
          >
            {builder ? "PDF preview" : "Report builder"}
            <Icon name="arrow" size={16} />
          </Link>
          {preview && (
            <button className="button primary" onClick={() => window.print()}>
              <Icon name="download" size={17} />
              Print / Save PDF
            </button>
          )}
        </PageHeading>
        <div className="monthly-toolbar panel">
          <Field label="Project">
            <select
              value={report.projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setMessage("");
              }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reporting period">
            <select
              aria-label="Reporting period"
              value="2026-10"
              onChange={() => {}}
            >
              <option value="2026-10">October 2026 · demo period</option>
            </select>
          </Field>
          <Badge status={report.status} />
        </div>
        {message && (
          <div className="notice" role="status">
            {message}
          </div>
        )}
        <div className="notice">
          Actual project progress is entered and confirmed by the PM. It is
          never calculated from the number of daily reports. The historical
          S-Curve values are illustrative.
        </div>
      </div>
      {preview ? (
        <MonthlyDocument report={report} />
      ) : (
        <>
          <div className="stat-grid monthly-stats">
            {[
              {
                title: "Planned progress",
                value: `${report.planned}%`,
                note: "Baseline · PM entered",
              },
              {
                title: "Actual progress",
                value: `${report.actual}%`,
                note: report.confirmed
                  ? "Confirmed by PM"
                  : "Awaiting PM confirmation",
              },
              {
                title: "Schedule variance",
                value: `${report.actual - report.planned > 0 ? "+" : ""}${(report.actual - report.planned).toFixed(1).replace(/\.0$/, "")} pp`,
                note: "Actual less planned",
              },
              {
                title: "Approved daily reports",
                value: String(approved.length).padStart(2, "0"),
                note: "Latest approved revisions only",
              },
            ].map((s) => (
              <div className="stat-card" key={s.title}>
                <div className="stat-top">{s.title}</div>
                <strong>{s.value}</strong>
                <small>{s.note}</small>
              </div>
            ))}
          </div>
          <div className="monthly-chart-layout">
            <section className="panel padded">
              <div className="panel-heading flush">
                <div>
                  <h2>Planned vs actual progress</h2>
                  <p>Cumulative project S-Curve · demo baseline</p>
                </div>
                <span className="demo-pill">OCT 2026</span>
              </div>
              <SCurve report={report} />
            </section>
            <section className="panel padded">
              <div className="eyebrow">THE ROAD AHEAD</div>
              <h2>Key milestones</h2>
              <p className="pre-line milestone-text">{report.milestones}</p>
              <div className="review-rule" />
              <span className="muted text-sm">Forecast completion</span>
              <h3 className="mt-2">{displayDate(report.forecast)}</h3>
              <p>PM forecast, based on the current delivery plan.</p>
            </section>
          </div>
          <section className="panel padded mt-6">
            <div className="panel-heading flush">
              <div>
                <h2>Progress by work package</h2>
                <p>Percentages entered by the Project Manager</p>
              </div>
            </div>
            <div className="package-grid">
              {report.packages.map((p) => (
                <div key={p.name}>
                  <div className="progress-label">
                    <strong>{p.name}</strong>
                    <strong>{p.actual}%</strong>
                  </div>
                  <div className="progress-track">
                    <span style={{ width: `${p.actual}%` }} />
                  </div>
                  <small className="muted">Planned {p.planned}%</small>
                </div>
              ))}
            </div>
          </section>
          {builder && (
            <>
              <Section
                number="01"
                title="PM progress confirmation"
                description="Save changes automatically in this browser."
              >
                <fieldset disabled={!editable}>
                  <div className="form-grid">
                    <Field label="Planned project progress (%)">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={report.planned}
                        onChange={(e) =>
                          changeProgress("planned", Number(e.target.value))
                        }
                      />
                    </Field>
                    <Field label="Actual project progress (%)">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={report.actual}
                        onChange={(e) =>
                          changeProgress("actual", Number(e.target.value))
                        }
                      />
                    </Field>
                  </div>
                  <div className="row-list mt-4">
                    {report.packages.map((p, i) => (
                      <div className="package-input" key={p.name}>
                        <strong>{p.name}</strong>
                        <Field label="Planned %">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={p.planned}
                            onChange={(e) =>
                              update({
                                confirmed: false,
                                packages: report.packages.map((v, j) =>
                                  i === j
                                    ? {
                                        ...v,
                                        planned: Math.max(
                                          0,
                                          Math.min(100, Number(e.target.value)),
                                        ),
                                      }
                                    : v,
                                ),
                              })
                            }
                          />
                        </Field>
                        <Field label="Actual %">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={p.actual}
                            onChange={(e) =>
                              update({
                                confirmed: false,
                                packages: report.packages.map((v, j) =>
                                  i === j
                                    ? {
                                        ...v,
                                        actual: Math.max(
                                          0,
                                          Math.min(100, Number(e.target.value)),
                                        ),
                                      }
                                    : v,
                                ),
                              })
                            }
                          />
                        </Field>
                      </div>
                    ))}
                  </div>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={report.confirmed}
                      onChange={(e) => update({ confirmed: e.target.checked })}
                    />
                    <span>
                      I confirm the actual project progress and work package
                      figures for October 2026.
                    </span>
                  </label>
                </fieldset>
              </Section>
              <Section number="02" title="Monthly narrative">
                <fieldset disabled={!editable} className="row-list">
                  {(
                    [
                      ["Executive summary", "summary"],
                      ["Key milestones", "milestones"],
                      ["Schedule delays & reasons", "delays"],
                      ["Corrective actions", "corrective"],
                      ["Next month’s work plan", "nextPlan"],
                    ] as const
                  ).map(([label, key]) => (
                    <Field key={key} label={label}>
                      <textarea
                        rows={3}
                        maxLength={10000}
                        value={report[key]}
                        onChange={(e) => update({ [key]: e.target.value })}
                      />
                    </Field>
                  ))}
                  <Field label="Forecast completion date">
                    <input
                      type="date"
                      required
                      value={report.forecast}
                      onChange={(e) => {
                        if (e.target.value)
                          update({ forecast: e.target.value });
                      }}
                    />
                  </Field>
                </fieldset>
              </Section>
              <Section number="03" title="Construction schedule & appendices">
                <div className="notice compact">
                  This first prototype uses a sample baseline. Validated Excel
                  import with PM confirmation and PDF schedule attachments are
                  planned for the next phase. No unverified file data is
                  imported.
                </div>
                <h3>Report source data</h3>
                <p>
                  {approved.length} approved daily reports for{" "}
                  {projectName(report.projectId)} in October 2026. Drafts,
                  submissions and superseded approved revisions are excluded.
                </p>
                <ul className="source-list">
                  {approved.map((r) => (
                    <li key={r.id}>
                      <Link href={`/preview/${r.id}`}>
                        {displayDate(r.date)} · {r.manager} · Revision{" "}
                        {r.revision}
                        <Icon name="arrow" size={15} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
              <section className="panel padded mt-4">
                <h2>Release workflow</h2>
                <p>
                  {report.status === "Approved"
                    ? `Approved by ${report.approvedBy}. This monthly record is locked.`
                    : report.status === "Submitted"
                      ? "Awaiting Director / Admin approval. Submitted values are locked."
                      : "PM confirms the progress, then requests director approval before client release."}
                </p>
                <div className="actions">
                  {report.status === "Draft" && (
                    <button
                      disabled={!editable || !report.confirmed}
                      className="button primary"
                      onClick={submit}
                    >
                      Request director approval
                      <Icon name="arrow" size={16} />
                    </button>
                  )}
                  {report.status === "Submitted" && (
                    <>
                      <button
                        className="button secondary"
                        disabled={role !== "Director / Admin"}
                        onClick={() =>
                          upsertMonthly({
                            ...report,
                            status: "Draft",
                            confirmed: false,
                          })
                        }
                      >
                        Return to PM
                      </button>
                      <button
                        className="button primary"
                        disabled={role !== "Director / Admin"}
                        onClick={() => {
                          upsertMonthly({
                            ...report,
                            status: "Approved",
                            approvedBy: "Director / Admin",
                          });
                          setMessage(
                            "Monthly report approved for client-format export.",
                          );
                        }}
                      >
                        <Icon name="check" size={16} />
                        Approve monthly report
                      </button>
                    </>
                  )}
                  <Link
                    className="button secondary"
                    href={`/monthly-preview?project=${report.projectId}`}
                  >
                    Open PDF preview
                  </Link>
                </div>
                {role === "Site Manager" && (
                  <p className="muted">
                    Switch to Project Manager to edit monthly progress.
                  </p>
                )}
                {report.status === "Submitted" &&
                  role !== "Director / Admin" && (
                    <p className="muted">
                      Switch to Director / Admin to approve the monthly report.
                    </p>
                  )}
              </section>
            </>
          )}
        </>
      )}
    </>
  );
}

function MonthlyDocument({ report }: { report: MonthlyProgress }) {
  const { data } = useDemo();
  const approved = officialReports(
    data.reports,
    report.projectId,
    report.month,
  );
  return (
    <article className="document monthly-document">
      <div className="monthly-cover">
        <DocumentBrand />
        <div className="document-kicker">
          MONTHLY PROGRESS REPORT / OCTOBER 2026
        </div>
        <h1>{projectName(report.projectId)}</h1>
        <p className="cover-subtitle">
          A considered view of progress.
          <br />A clear path to completion.
        </p>
        <Image
          unoptimized
          width={1100}
          height={720}
          className="cover-image"
          src={`/project-${
            Math.max(
              0,
              projects.findIndex((p) => p.id === report.projectId),
            ) + 1
          }.svg`}
          alt="Architectural concept illustration"
        />
        <div className="cover-meta">
          <Badge status={report.status} />
          <span>
            Prepared by Project Manager
            <br />
            Approved by {report.approvedBy ?? "Awaiting director approval"}
          </span>
        </div>
        {report.status !== "Approved" && (
          <div className="draft-watermark">DRAFT — NOT FOR CLIENT RELEASE</div>
        )}
        <p className="muted text-sm">
          Demonstration document · Architectural images are concept
          illustrations.
        </p>
      </div>
      <h2>01 / Executive summary</h2>
      <p className="pre-line">{report.summary}</p>
      <h2>02 / Overall project progress</h2>
      <div className="summary-strip">
        <div>
          <span>Planned</span>
          <strong>{report.planned}%</strong>
        </div>
        <div>
          <span>Actual · PM entered</span>
          <strong>{report.actual}%</strong>
        </div>
        <div>
          <span>PM confirmation</span>
          <strong className="text-base!">
            {report.confirmed ? "Confirmed" : "Pending"}
          </strong>
        </div>
      </div>
      <h2>03 / Planned vs actual — S-Curve</h2>
      <SCurve report={report} />
      <h2>04 / Progress by work package</h2>
      <table>
        <thead>
          <tr>
            <th>Work package</th>
            <th>Planned</th>
            <th>Actual</th>
          </tr>
        </thead>
        <tbody>
          {report.packages.map((p) => (
            <tr key={p.name}>
              <td>{p.name}</td>
              <td>{p.planned}%</td>
              <td>{p.actual}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>05 / Manpower statistics</h2>
      <p>
        {approved.length} approved daily records. Total recorded personnel-days:{" "}
        {approved.reduce((n, r) => n + workforce(r), 0)}. This is a sum of daily
        headcounts, not unique workers.
      </p>
      <h2>06 / Work completed during the month</h2>
      {approved.length ? (
        approved.map((r) => (
          <section key={r.id}>
            <h3>
              {displayDate(r.date)} · Revision {r.revision}
            </h3>
            <ul>
              {r.activities.map((a, i) => (
                <li key={i}>
                  <strong>
                    {a.work} / {a.zone}
                  </strong>
                  <p>{a.description}</p>
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <p>No approved daily reports for this period.</p>
      )}
      <h2>07 / Photo progress gallery</h2>
      {approved.some((r) => r.photos.length) ? (
        <div className="document-photos">
          {approved.flatMap((r) =>
            r.photos.map((p) => (
              <figure key={`${r.id}-${p.id}`}>
                <Image
                  unoptimized
                  width={1100}
                  height={720}
                  src={p.src}
                  alt={p.caption}
                />
                <figcaption>
                  {displayDate(r.date)} · {p.caption}
                  <span>{p.activity}</span>
                </figcaption>
              </figure>
            )),
          )}
        </div>
      ) : (
        <p>No photos in the approved source records.</p>
      )}
      <h2>08 / Issues, risks & delays</h2>
      <p className="pre-line">{report.delays}</p>
      {approved
        .filter((r) => r.issues)
        .map((r) => (
          <p key={r.id}>
            <strong>{displayDate(r.date)}: </strong>
            {r.issues}
          </p>
        ))}
      <h2>09 / Corrective actions</h2>
      <p className="pre-line">{report.corrective}</p>
      <h2>10 / Construction schedule</h2>
      <p className="pre-line">{report.milestones}</p>
      <p>
        Forecast completion: {displayDate(report.forecast)}. Baseline S-Curve is
        illustrative; verified Excel schedules and PDF attachments are not
        included in this prototype.
      </p>
      <h2>11 / Next month’s work plan</h2>
      <p className="pre-line">{report.nextPlan}</p>
      <h2>12 / Appendices & source register</h2>
      <ul>
        {approved.map((r) => (
          <li key={r.id}>
            {r.date} · {r.manager} · {r.id} · Revision {r.revision}
          </li>
        ))}
      </ul>
      <h2>13 / Release authorisation</h2>
      <p>
        {report.status === "Approved"
          ? `Approved by ${report.approvedBy}.`
          : "Awaiting Director / Admin approval. This preview is not for client release."}
      </p>
      <footer className="document-footer">
        ATMOSPHERA SITE REPORTS{" "}
        <span>DEMONSTRATION DOCUMENT · OCTOBER 2026</span>
      </footer>
    </article>
  );
}
