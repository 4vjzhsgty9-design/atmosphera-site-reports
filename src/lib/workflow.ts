import type { DailyReport, Role } from "./models";

export function validateReport(report: DailyReport): string | null {
  if (
    !report.projectId ||
    !/^\d{4}-\d{2}-\d{2}$/.test(report.date) ||
    !report.manager.trim()
  )
    return "Complete the project, date and site manager.";
  if (!report.activities.some((a) => a.work.trim() && a.description.trim()))
    return "Add at least one work activity with a description.";
  if (report.manpower.some((m) => !Number.isInteger(m.count) || m.count < 0))
    return "Manpower must contain whole, non-negative numbers.";
  if (
    report.quantities.some(
      (q) => !Number.isFinite(q.quantity) || q.quantity < 0,
    )
  )
    return "Quantities cannot be negative.";
  return null;
}
export function submitReport(report: DailyReport, at: string): DailyReport {
  if (!["Draft", "Revision Required"].includes(report.status))
    throw new Error("Only editable reports can be submitted.");
  const error = validateReport(report);
  if (error) throw new Error(error);
  return {
    ...report,
    status: "Submitted",
    history: [
      ...report.history,
      { at, action: "Submitted", by: report.manager },
    ],
  };
}
export function reviewReport(
  report: DailyReport,
  role: Role,
  approve: boolean,
  comment: string,
  at: string,
): DailyReport {
  if (role === "Site Manager")
    throw new Error(
      "Switch to Project Manager or Director / Admin to review reports.",
    );
  if (report.status !== "Submitted")
    throw new Error("Only submitted reports can be reviewed.");
  if (!approve && !comment.trim())
    throw new Error("Add a comment explaining the changes needed.");
  const by = role === "Project Manager" ? "Sarah Mitchell" : "Director / Admin";
  return {
    ...report,
    status: approve ? "Approved" : "Revision Required",
    comment,
    approvedBy: approve ? by : undefined,
    history: [
      ...report.history,
      {
        at,
        action: approve ? "Approved" : `Revision requested: ${comment}`,
        by,
      },
    ],
  };
}
export function reviseReport(
  report: DailyReport,
  id: string,
  at: string,
): DailyReport {
  if (report.status !== "Approved")
    throw new Error("Only approved reports need a new revision.");
  return {
    ...structuredClone(report),
    id,
    previousId: report.id,
    revision: report.revision + 1,
    status: "Draft",
    approvedBy: undefined,
    comment: "",
    history: [
      ...report.history,
      {
        at,
        action: `Revision ${report.revision + 1} created from ${report.id}`,
        by: report.manager,
      },
    ],
  };
}
// Use the latest approved revision only; a draft revision must not replace an approved record.
export function officialReports(
  reports: DailyReport[],
  projectId: string,
  month: string,
): DailyReport[] {
  const approved = reports.filter(
    (r) =>
      r.projectId === projectId &&
      r.date.startsWith(month) &&
      r.status === "Approved",
  );
  return approved.filter(
    (r) =>
      !approved.some((other) => {
        let parent = other.previousId;
        const visited = new Set<string>();
        while (parent && !visited.has(parent)) {
          if (parent === r.id) return true;
          visited.add(parent);
          parent = reports.find((p) => p.id === parent)?.previousId;
        }
        return false;
      }),
  );
}
