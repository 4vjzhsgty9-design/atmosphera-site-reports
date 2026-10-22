import { test } from "node:test";
import assert from "node:assert/strict";
import {
  submitReport,
  reviewReport,
  reviseReport,
  officialReports,
} from "../src/lib/workflow.ts";
const draft = {
  id: "one",
  projectId: "villa",
  date: "2026-10-21",
  manager: "Site manager",
  status: "Draft",
  revision: 1,
  manpower: [{ count: 4 }],
  activities: [{ work: "Concrete", description: "Slab poured" }],
  quantities: [],
  photos: [],
  history: [],
};
const at = "2026-10-22T04:00:00Z";
test("submission validates content and rejects changes to approved records", () => {
  assert.throws(
    () => submitReport({ ...draft, activities: [] }, at),
    /activity/,
  );
  assert.equal(submitReport(draft, at).status, "Submitted");
  assert.throws(
    () => submitReport({ ...draft, status: "Approved" }, at),
    /editable/,
  );
});
test("only PM or director can approve; revision requests require a comment", () => {
  const submitted = submitReport(draft, at);
  assert.throws(
    () => reviewReport(submitted, "Site Manager", true, "", at),
    /Switch/,
  );
  assert.throws(
    () => reviewReport(submitted, "Project Manager", false, " ", at),
    /comment/,
  );
  assert.equal(
    reviewReport(submitted, "Project Manager", false, "Check quantities", at)
      .status,
    "Revision Required",
  );
  const approved = reviewReport(
    submitted,
    "Project Manager",
    true,
    "Checked",
    at,
  );
  assert.equal(approved.status, "Approved");
  assert.equal(approved.approvedBy, "Sarah Mitchell");
  assert.equal(submitted.status, "Submitted");
});
test("revisions preserve the approved original and source aggregation uses latest approved revision", () => {
  const approved = reviewReport(
    submitReport(draft, at),
    "Project Manager",
    true,
    "",
    at,
  );
  const revision = reviseReport(approved, "two", at);
  assert.equal(revision.status, "Draft");
  assert.equal(revision.previousId, "one");
  assert.equal(revision.revision, 2);
  assert.equal(approved.status, "Approved");
  assert.deepEqual(
    officialReports([approved, revision], "villa", "2026-10").map((r) => r.id),
    ["one"],
  );
  const replacement = reviewReport(
    submitReport(revision, at),
    "Project Manager",
    true,
    "",
    at,
  );
  assert.deepEqual(
    officialReports([approved, replacement], "villa", "2026-10").map(
      (r) => r.id,
    ),
    ["two"],
  );
  assert.equal(
    officialReports([approved, replacement], "villa", "2026-09").length,
    0,
  );
});
