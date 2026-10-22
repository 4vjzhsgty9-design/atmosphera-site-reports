"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useDemo } from "./demo-provider";
import { DailyReport, Photo } from "@/lib/models";
import { newReport, projects, workforce } from "@/lib/demo-data";
import { reviseReport, submitReport } from "@/lib/workflow";
import { compressPhoto } from "@/lib/photos";
import { Badge, Empty, Field, Icon, PageHeading, Section } from "./ui";

export function DailyForm({ id }: { id: string }) {
  const { data, upsertReport, storageError } = useDemo();
  const router = useRouter();
  const existing = data.reports.find((r) => r.id === id);
  const [report, setReport] = useState<DailyReport>(() =>
    existing ? structuredClone(existing) : newReport(),
  );
  const current = useRef(report);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const locked = report.status === "Approved" || report.status === "Submitted";
  if (id !== "new" && !existing)
    return (
      <Empty title="Report not found">
        <Link className="text-link" href="/daily-reports">
          Back to daily reports
        </Link>
      </Empty>
    );
  function update(patch: Partial<DailyReport>) {
    const next = { ...current.current, ...patch };
    current.current = next;
    setReport(next);
    upsertReport(next);
    setSaved(true);
    setMessage("");
    // Keep the autosaved draft addressable across reloads without remounting the form.
    if (window.location.pathname.endsWith("/new"))
      window.history.replaceState(null, "", `/daily-reports/${next.id}`);
  }
  function save() {
    upsertReport(current.current);
    setSaved(true);
    setMessage("Draft saved in this browser.");
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const next = submitReport(current.current, new Date().toISOString());
      current.current = next;
      setReport(next);
      upsertReport(next);
      router.push(`/daily-reports/${next.id}`);
    } catch (error) {
      setMessage((error as Error).message);
    }
  }
  async function photos(files: FileList | null) {
    if (!files) return;
    setUploading(true);
    setMessage("");
    try {
      const selected = Array.from(files);
      if (selected.length + current.current.photos.length > 6)
        throw new Error("The demo supports up to 6 photos per report.");
      const additions: Photo[] = [];
      for (const file of selected)
        additions.push({
          id: crypto.randomUUID(),
          src: await compressPhoto(file),
          caption: file.name.replace(/\.[^.]+$/, ""),
          activity: "",
        });
      update({ photos: [...current.current.photos, ...additions] });
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setUploading(false);
    }
  }
  function revise() {
    const next = reviseReport(
      report,
      crypto.randomUUID(),
      new Date().toISOString(),
    );
    upsertReport(next);
    router.push(`/daily-reports/${next.id}`);
  }
  return (
    <>
      <PageHeading
        eyebrow={`DAILY SITE REPORT / REVISION ${report.revision}`}
        title={id === "new" ? "Create daily report" : "Daily site report"}
        description="A clear record of the people, progress and details on site."
      >
        <Badge status={report.status} />
        {id !== "new" && (
          <Link href={`/preview/${report.id}`} className="button secondary">
            <Icon name="file" size={17} />
            PDF preview
          </Link>
        )}
      </PageHeading>
      <div className="form-layout">
        <form onSubmit={submit} className="report-form">
          {report.comment && (
            <div className="notice">
              <strong>Project Manager feedback</strong>
              <p>{report.comment}</p>
            </div>
          )}
          {locked && (
            <div className="notice">
              {report.status === "Approved"
                ? "This approved record is locked. Create a new revision to make changes; the original is preserved."
                : "Submitted for PM review. Editing is locked until a revision is requested."}
              <div className="actions mt-3">
                {report.status === "Approved" ? (
                  <button
                    className="button secondary"
                    type="button"
                    onClick={revise}
                  >
                    Create new revision
                  </button>
                ) : (
                  <Link className="text-link" href="/approvals">
                    Open approval desk →
                  </Link>
                )}
              </div>
            </div>
          )}
          <fieldset disabled={locked || uploading} className="form-fieldset">
            <Section
              number="01"
              title="Project information"
              description="Start with the essentials."
            >
              <div className="form-grid">
                <Field label="Project *">
                  <select
                    required
                    value={report.projectId}
                    onChange={(e) =>
                      update({
                        projectId: e.target.value,
                        manager: projects.find((p) => p.id === e.target.value)!
                          .manager,
                      })
                    }
                  >
                    {projects.map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Report date *">
                  <input
                    required
                    type="date"
                    value={report.date}
                    onChange={(e) => update({ date: e.target.value })}
                  />
                </Field>
                <Field label="Site manager *">
                  <input
                    required
                    maxLength={120}
                    value={report.manager}
                    onChange={(e) => update({ manager: e.target.value })}
                  />
                </Field>
                <Field label="Weather">
                  <input
                    maxLength={200}
                    value={report.weather}
                    onChange={(e) => update({ weather: e.target.value })}
                    placeholder="Sunny, 29°C"
                  />
                </Field>
              </div>
            </Section>
            <Section
              number="02"
              title="Manpower"
              description={`Total on site: ${workforce(report)} personnel`}
            >
              <div className="row-list">
                {report.manpower.map((row, i) => (
                  <div className="entry-row manpower-row" key={i}>
                    <Field label="Contractor">
                      <input
                        aria-label={`Contractor ${i + 1}`}
                        value={row.contractor}
                        maxLength={120}
                        onChange={(e) =>
                          update({
                            manpower: report.manpower.map((r, j) =>
                              i === j
                                ? { ...r, contractor: e.target.value }
                                : r,
                            ),
                          })
                        }
                      />
                    </Field>
                    <Field label="Trade">
                      <input
                        aria-label={`Trade ${i + 1}`}
                        value={row.trade}
                        maxLength={120}
                        onChange={(e) =>
                          update({
                            manpower: report.manpower.map((r, j) =>
                              i === j ? { ...r, trade: e.target.value } : r,
                            ),
                          })
                        }
                      />
                    </Field>
                    <Field label="Workers">
                      <input
                        aria-label={`Workers ${i + 1}`}
                        type="number"
                        min="0"
                        max="10000"
                        step="1"
                        value={row.count}
                        onChange={(e) =>
                          update({
                            manpower: report.manpower.map((r, j) =>
                              i === j
                                ? {
                                    ...r,
                                    count: Math.max(
                                      0,
                                      Math.floor(Number(e.target.value)),
                                    ),
                                  }
                                : r,
                            ),
                          })
                        }
                      />
                    </Field>
                    <button
                      type="button"
                      className="icon-button remove-row"
                      aria-label={`Remove manpower row ${i + 1}`}
                      onClick={() =>
                        update({
                          manpower: report.manpower.filter((_, j) => i !== j),
                        })
                      }
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="add-button"
                onClick={() =>
                  update({
                    manpower: [
                      ...report.manpower,
                      { contractor: "", trade: "", count: 0 },
                    ],
                  })
                }
              >
                <Icon name="plus" size={16} />
                Add team
              </button>
            </Section>
            <Section
              number="03"
              title="Work activities"
              description="What moved forward today?"
            >
              <div className="row-list">
                {report.activities.map((row, i) => (
                  <div className="activity-entry" key={i}>
                    <div className="entry-top">
                      <span>ACTIVITY {String(i + 1).padStart(2, "0")}</span>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Remove activity ${i + 1}`}
                        onClick={() =>
                          update({
                            activities: report.activities.filter(
                              (_, j) => i !== j,
                            ),
                          })
                        }
                      >
                        <Icon name="close" size={16} />
                      </button>
                    </div>
                    <div className="form-grid">
                      <Field label="Work package">
                        <input
                          value={row.work}
                          maxLength={160}
                          placeholder="e.g. Concrete works"
                          onChange={(e) =>
                            update({
                              activities: report.activities.map((r, j) =>
                                i === j ? { ...r, work: e.target.value } : r,
                              ),
                            })
                          }
                        />
                      </Field>
                      <Field label="Area / zone">
                        <input
                          value={row.zone}
                          maxLength={160}
                          placeholder="e.g. Level 01, east wing"
                          onChange={(e) =>
                            update({
                              activities: report.activities.map((r, j) =>
                                i === j ? { ...r, zone: e.target.value } : r,
                              ),
                            })
                          }
                        />
                      </Field>
                    </div>
                    <Field label="Work completed">
                      <textarea
                        maxLength={5000}
                        rows={3}
                        placeholder="Describe the completed works…"
                        value={row.description}
                        onChange={(e) =>
                          update({
                            activities: report.activities.map((r, j) =>
                              i === j
                                ? { ...r, description: e.target.value }
                                : r,
                            ),
                          })
                        }
                      />
                    </Field>
                  </div>
                ))}
              </div>
              <button
                className="add-button"
                type="button"
                onClick={() =>
                  update({
                    activities: [
                      ...report.activities,
                      { work: "", zone: "", description: "" },
                    ],
                  })
                }
              >
                <Icon name="plus" size={16} />
                Add activity
              </button>
            </Section>
            <Section number="04" title="Work quantities">
              <div className="row-list">
                {report.quantities.map((row, i) => (
                  <div className="entry-row quantity-row" key={i}>
                    <Field label="Work item">
                      <input
                        value={row.work}
                        onChange={(e) =>
                          update({
                            quantities: report.quantities.map((r, j) =>
                              i === j ? { ...r, work: e.target.value } : r,
                            ),
                          })
                        }
                      />
                    </Field>
                    <Field label="Quantity">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={row.quantity}
                        onChange={(e) =>
                          update({
                            quantities: report.quantities.map((r, j) =>
                              i === j
                                ? {
                                    ...r,
                                    quantity: Math.max(
                                      0,
                                      Number(e.target.value),
                                    ),
                                  }
                                : r,
                            ),
                          })
                        }
                      />
                    </Field>
                    <Field label="Unit">
                      <select
                        value={row.unit}
                        onChange={(e) =>
                          update({
                            quantities: report.quantities.map((r, j) =>
                              i === j ? { ...r, unit: e.target.value } : r,
                            ),
                          })
                        }
                      >
                        {["m²", "m³", "m", "kg", "tonnes", "pcs", "sets"].map(
                          (u) => (
                            <option key={u}>{u}</option>
                          ),
                        )}
                      </select>
                    </Field>
                    <button
                      className="icon-button remove-row"
                      type="button"
                      aria-label={`Remove quantity ${i + 1}`}
                      onClick={() =>
                        update({
                          quantities: report.quantities.filter(
                            (_, j) => i !== j,
                          ),
                        })
                      }
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="add-button"
                type="button"
                onClick={() =>
                  update({
                    quantities: [
                      ...report.quantities,
                      { work: "", quantity: 0, unit: "m²" },
                    ],
                  })
                }
              >
                <Icon name="plus" size={16} />
                Add quantity
              </button>
            </Section>
            <Section
              number="05"
              title="Site photos"
              description="Up to 6 photos. JPG, PNG or WebP; compressed for local demo storage."
            >
              <div className="upload-zone">
                <Icon name="camera" size={30} />
                <strong>
                  {uploading
                    ? "Preparing your photos…"
                    : "Bring the day’s progress into focus"}
                </strong>
                <p>Choose photos from your library or take a photo on site.</p>
                <div className="actions">
                  <label className="button secondary upload-button">
                    Choose photos
                    <input
                      aria-label="Choose site photos"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={locked || uploading}
                      onChange={(e) => {
                        void photos(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <label className="button secondary upload-button">
                    Use camera
                    <input
                      aria-label="Take site photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      disabled={locked || uploading}
                      onChange={(e) => {
                        void photos(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="photo-grid">
                {report.photos.map((photo, i) => (
                  <div className="photo-card" key={photo.id}>
                    <Image
                      unoptimized
                      width={1100}
                      height={720}
                      src={photo.src}
                      alt={photo.caption || `Site photo ${i + 1}`}
                    />
                    <div className="photo-fields">
                      <Field label="Caption">
                        <input
                          maxLength={200}
                          value={photo.caption}
                          onChange={(e) =>
                            update({
                              photos: report.photos.map((p) =>
                                p.id === photo.id
                                  ? { ...p, caption: e.target.value }
                                  : p,
                              ),
                            })
                          }
                        />
                      </Field>
                      <Field label="Related activity">
                        <select
                          value={photo.activity}
                          onChange={(e) =>
                            update({
                              photos: report.photos.map((p) =>
                                p.id === photo.id
                                  ? { ...p, activity: e.target.value }
                                  : p,
                              ),
                            })
                          }
                        >
                          <option value="">General site progress</option>
                          {report.activities.map((a, j) => (
                            <option value={a.work} key={j}>
                              {a.work || `Activity ${j + 1}`}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <button
                        className="text-link danger"
                        type="button"
                        onClick={() =>
                          update({
                            photos: report.photos.filter(
                              (p) => p.id !== photo.id,
                            ),
                          })
                        }
                      >
                        Remove photo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
            {(
              [
                [
                  "06",
                  "Materials",
                  "Record deliveries, quantities and inspections.",
                  "materials",
                ],
                [
                  "07",
                  "Equipment",
                  "Equipment in use and any downtime.",
                  "equipment",
                ],
                [
                  "08",
                  "Issues & delays",
                  "Identify the issue, cause and impact.",
                  "issues",
                ],
                [
                  "09",
                  "Safety observations",
                  "Toolbox talks, observations and incidents.",
                  "safety",
                ],
                [
                  "10",
                  "Tomorrow’s plan",
                  "Give the next shift a clear starting point.",
                  "tomorrow",
                ],
              ] as const
            ).map(([number, title, description, key]) => (
              <Section
                key={key}
                number={number}
                title={title}
                description={description}
              >
                <Field label={title}>
                  <textarea
                    rows={3}
                    maxLength={10000}
                    value={report[key]}
                    onChange={(e) => update({ [key]: e.target.value })}
                  />
                </Field>
              </Section>
            ))}
          </fieldset>
          {message && (
            <div className="notice" role="status">
              {message}
            </div>
          )}
          {!locked && (
            <div className="form-actions">
              <span className="save-indicator">
                {storageError
                  ? "Not saved to browser"
                  : saved
                    ? "✓ Changes saved in this browser"
                    : "Draft saves as you type"}
              </span>
              <div className="actions">
                <button
                  type="button"
                  className="button secondary"
                  disabled={uploading}
                  onClick={save}
                >
                  Save draft
                </button>
                <button
                  type="submit"
                  className="button primary"
                  disabled={uploading}
                >
                  Submit for approval
                  <Icon name="arrow" size={16} />
                </button>
              </div>
            </div>
          )}
        </form>
        <aside className="form-sidebar">
          <div className="panel padded">
            <div className="eyebrow">A COMPLETE SITE RECORD</div>
            <h3>
              The details make
              <br />
              the difference.
            </h3>
            <p>
              Be specific about work areas, quantities and anything that needs a
              decision.
            </p>
            <ol>
              {[
                "Project information",
                "Manpower",
                "Work activities",
                "Work quantities",
                "Site photos",
                "Materials",
                "Equipment",
                "Issues & delays",
                "Safety observations",
                "Tomorrow’s plan",
              ].map((s, i) => (
                <li key={s}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {s}
                </li>
              ))}
            </ol>
            <div className="notice compact">
              Submitted reports are reviewed by your Project Manager before
              client release.
            </div>
          </div>
          {report.history.length > 0 && (
            <div className="panel padded mt-4">
              <h3>Report history</h3>
              <ul className="history-list">
                {report.history.map((h, i) => (
                  <li key={i}>
                    <strong>{h.action}</strong>
                    <span>{h.by}</span>
                    <small>{new Date(h.at).toLocaleString("en-GB")}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
