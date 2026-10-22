"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useDemo } from "./demo-provider";
import { Badge, Empty, Field, Icon, PageHeading } from "./ui";
import { displayDate, projectName, workforce } from "@/lib/demo-data";
import { DailyReport } from "@/lib/models";
import { reviewReport } from "@/lib/workflow";

export function Approvals() {
  const { data, role, upsertReport } = useDemo();
  const [selected, setSelected] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const pending = data.reports.filter((r) => r.status === "Submitted");
  const report = pending.find((r) => r.id === selected) ?? pending[0];
  function review(approve: boolean) {
    if (!report) return;
    try {
      const reviewed = reviewReport(
        report,
        role,
        approve,
        comment,
        new Date().toISOString(),
      );
      upsertReport(reviewed);
      setComment("");
      setSelected(null);
      setMessage(
        approve
          ? "Report approved. The record is now locked and available for client reporting."
          : "Report returned to the Site Manager with your comments.",
      );
    } catch (error) {
      setMessage((error as Error).message);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="THE APPROVAL DESK"
        title="Review with confidence."
        description="A clear review today means a reliable record tomorrow."
      />
      <div className="notice">
        Demo workflow · Use the role selector to explore PM and director
        actions. These are not authenticated accounts.
      </div>
      {message && (
        <div className="notice success" role="status">
          {message}
        </div>
      )}
      {!report ? (
        <div className="panel">
          <Empty title="All caught up">
            <p>No submitted reports are waiting for approval.</p>
            <Link href="/daily-reports" className="text-link">
              Browse daily reports →
            </Link>
          </Empty>
        </div>
      ) : (
        <div className="approval-layout">
          <section className="approval-queue">
            <div className="eyebrow">AWAITING REVIEW · {pending.length}</div>
            {pending.map((r) => (
              <button
                key={r.id}
                className={`queue-card ${r.id === report.id ? "selected" : ""}`}
                onClick={() => {
                  setSelected(r.id);
                  setComment("");
                  setMessage("");
                }}
              >
                <Badge status={r.status} />
                <h3>{projectName(r.projectId)}</h3>
                <p>
                  {displayDate(r.date)} · Revision {r.revision}
                </p>
                <span>
                  {r.manager}
                  <Icon name="arrow" size={16} />
                </span>
              </button>
            ))}
          </section>
          <div>
            <section className="panel padded">
              <div className="panel-heading flush">
                <div>
                  <div className="eyebrow">DAILY SITE REPORT</div>
                  <h2>{projectName(report.projectId)}</h2>
                  <p>
                    {displayDate(report.date)} · {report.manager}
                  </p>
                </div>
                <Link
                  href={`/preview/${report.id}`}
                  className="button secondary"
                >
                  Full preview
                  <Icon name="arrow" size={16} />
                </Link>
              </div>
              <div className="summary-strip">
                <div>
                  <span>Personnel</span>
                  <strong>{workforce(report)}</strong>
                </div>
                <div>
                  <span>Activities</span>
                  <strong>{report.activities.length}</strong>
                </div>
                <div>
                  <span>Site photos</span>
                  <strong>{report.photos.length}</strong>
                </div>
              </div>
              <h3>Work completed</h3>
              {report.activities.map((a, i) => (
                <div className="review-activity" key={i}>
                  <strong>
                    {a.work}
                    <span>{a.zone}</span>
                  </strong>
                  <p>{a.description}</p>
                </div>
              ))}
              <h3>Issues & delays</h3>
              <p className="pre-line">
                {report.issues || "No issues recorded."}
              </p>
              <h3>Tomorrow’s plan</h3>
              <p className="pre-line">
                {report.tomorrow || "No plan recorded."}
              </p>
            </section>
            <section className="panel padded mt-4">
              <h2>Your decision</h2>
              <p>
                Check the full record before approving. A comment is required
                when requesting a revision.
              </p>
              <Field label="PM review comment">
                <textarea
                  rows={4}
                  maxLength={3000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a clear note for the site team…"
                />
              </Field>
              {role === "Site Manager" && (
                <div className="notice compact">
                  Switch to Project Manager or Director / Admin to make a
                  decision.
                </div>
              )}
              <div className="actions justify-end mt-4">
                <button
                  className="button secondary"
                  disabled={role === "Site Manager"}
                  onClick={() => review(false)}
                >
                  Request revision
                </button>
                <button
                  className="button primary"
                  disabled={role === "Site Manager"}
                  onClick={() => review(true)}
                >
                  <Icon name="check" size={17} />
                  Approve report
                </button>
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
export function DailyPreview({ id }: { id: string }) {
  const { data } = useDemo();
  const report = data.reports.find((r) => r.id === id);
  if (!report)
    return (
      <Empty title="Report not found">
        <Link href="/daily-reports">Back to reports</Link>
      </Empty>
    );
  return (
    <>
      <div className="no-print">
        <PageHeading
          eyebrow="DOCUMENT STUDIO"
          title="Daily PDF preview"
          description="A4 layout · Use your browser’s Save as PDF option to export."
        >
          <Link href={`/daily-reports/${id}`} className="button secondary">
            Back to report
          </Link>
          <button className="button primary" onClick={() => window.print()}>
            <Icon name="download" size={17} />
            Print / Save PDF
          </button>
        </PageHeading>
        <div className="notice">
          {report.status === "Approved"
            ? "Approved demo report. Ready for a client-format export."
            : "DRAFT PREVIEW — this report is not approved for client release."}{" "}
          Select A4, enable background graphics and disable browser headers /
          footers for the best result.
        </div>
      </div>
      <DailyDocument report={report} />
    </>
  );
}
export function DocumentBrand() {
  return (
    <div className="document-brand">
      <div>
        <strong>ATMOSPHERA</strong>
        <span>CONSTRUCTION</span>
      </div>
      <p>
        PT Bali Atmosphera Construction
        <br />
        Project reporting · Bali, Indonesia
      </p>
    </div>
  );
}
export function DailyDocument({ report }: { report: DailyReport }) {
  return (
    <article className="document daily-document">
      <DocumentBrand />
      <div className="document-kicker">
        DAILY SITE REPORT · REVISION {report.revision}
      </div>
      <div className="document-title">
        <h1>{projectName(report.projectId)}</h1>
        <Badge status={report.status} />
      </div>
      {report.status !== "Approved" && (
        <div className="draft-watermark">DRAFT — NOT FOR CLIENT RELEASE</div>
      )}
      <div className="document-meta">
        <div>
          <span>Report date</span>
          <strong>{displayDate(report.date)}</strong>
        </div>
        <div>
          <span>Prepared by</span>
          <strong>{report.manager}</strong>
        </div>
        <div>
          <span>Weather</span>
          <strong>{report.weather || "Not recorded"}</strong>
        </div>
        <div>
          <span>Total manpower</span>
          <strong>{workforce(report)} personnel</strong>
        </div>
      </div>
      <h2>01 / Manpower</h2>
      <table>
        <thead>
          <tr>
            <th>Contractor</th>
            <th>Trade</th>
            <th>Workers</th>
          </tr>
        </thead>
        <tbody>
          {report.manpower.map((m, i) => (
            <tr key={i}>
              <td>{m.contractor || "—"}</td>
              <td>{m.trade || "—"}</td>
              <td>{m.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>02 / Work completed</h2>
      <table>
        <thead>
          <tr>
            <th>Activity / area</th>
            <th>Work completed</th>
          </tr>
        </thead>
        <tbody>
          {report.activities.map((a, i) => (
            <tr key={i}>
              <td>
                <strong>{a.work || "—"}</strong>
                <small>{a.zone}</small>
              </td>
              <td className="pre-line">{a.description || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>03 / Work quantities</h2>
      {report.quantities.length ? (
        <table>
          <thead>
            <tr>
              <th>Work item</th>
              <th>Quantity</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            {report.quantities.map((q, i) => (
              <tr key={i}>
                <td>{q.work}</td>
                <td>{q.quantity}</td>
                <td>{q.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No quantities recorded.</p>
      )}
      <h2>04 / Photo progress record</h2>
      {report.photos.length ? (
        <div className="document-photos">
          {report.photos.map((p, i) => (
            <figure key={p.id}>
              <Image
                unoptimized
                width={1100}
                height={720}
                src={p.src}
                alt={p.caption || `Site photo ${i + 1}`}
              />
              <figcaption>
                <strong>
                  {String(i + 1).padStart(2, "0")} /{" "}
                  {p.caption || "Site progress"}
                </strong>
                <span>{p.activity || "General site progress"}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p>No site photographs attached to this demonstration record.</p>
      )}
      {[
        ["05 / Materials", report.materials],
        ["06 / Equipment", report.equipment],
        ["07 / Issues & delays", report.issues],
        ["08 / Safety observations", report.safety],
        ["09 / Tomorrow’s plan", report.tomorrow],
      ].map(([title, text]) => (
        <section className="document-section" key={title}>
          <h2>{title}</h2>
          <p className="pre-line">{text || "Nothing recorded."}</p>
        </section>
      ))}
      <div className="signature-grid">
        <div>
          <span>Prepared by</span>
          <strong>{report.manager}</strong>
          <small>Site Manager</small>
        </div>
        <div>
          <span>Approved by</span>
          <strong>{report.approvedBy ?? "Awaiting approval"}</strong>
          <small>Project Manager / Director</small>
        </div>
      </div>
      <footer className="document-footer">
        ATMOSPHERA SITE REPORTS{" "}
        <span>
          DEMONSTRATION DOCUMENT · {report.date} · REV {report.revision}
        </span>
      </footer>
    </article>
  );
}
