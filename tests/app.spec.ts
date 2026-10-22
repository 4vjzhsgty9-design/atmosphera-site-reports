import { expect, test } from "@playwright/test";

test("dashboard and every first-stage screen render on mobile without page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [path, heading] of [
    ["/", "Site overview"],
    ["/projects", "Projects"],
    ["/daily-reports", "Daily reports"],
    ["/daily-reports/new", "Create daily report"],
    ["/approvals", "Review with confidence."],
    ["/preview/dsr-001", "Daily PDF preview"],
    ["/monthly-progress", "Monthly progress"],
    ["/monthly-builder", "Monthly report builder"],
    ["/monthly-preview", "Monthly PDF preview"],
    ["/archive", "Reports archive"],
    ["/settings", "Users & settings"],
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      path,
    ).toBeTruthy();
  }
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Dashboard" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Site overview" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("draft autosaves with a photo and can be submitted, returned and approved", async ({
  page,
}) => {
  await page.goto("/");
  const photo = await page.locator(".hero-visual img").screenshot();
  await page.getByRole("link", { name: "Create daily report" }).click();
  await page
    .getByRole("textbox", { name: "Site manager *", exact: true })
    .fill("Test Site Manager");
  await page.getByLabel("Work package", { exact: true }).fill("Reinforcement");
  await page
    .getByLabel("Work completed", { exact: true })
    .fill("Checked reinforcement in east wing.");
  await page.getByLabel("Workers 1", { exact: true }).fill("7");
  await page
    .getByLabel("Choose site photos", { exact: true })
    .setInputFiles({ name: "site.png", mimeType: "image/png", buffer: photo });
  await expect(page.getByLabel("Caption", { exact: true })).toHaveValue("site");
  await page
    .getByLabel("Caption", { exact: true })
    .fill("East wing reinforcement");
  await page.getByLabel("Related activity").selectOption("Reinforcement");
  const path = new URL(page.url()).pathname;
  expect(path).not.toBe("/daily-reports/new");
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Site manager *", exact: true })).toHaveValue(
    "Test Site Manager",
  );
  await expect(page.getByAltText("East wing reinforcement")).toBeVisible();
  await page.getByRole("button", { name: "Submit for approval" }).click();
  await expect(
    page.getByRole("textbox", { name: "Site manager *", exact: true }),
  ).toBeDisabled();
  await page.goto("/approvals");
  await page
    .getByRole("button", { name: "Approve report", exact: true })
    .waitFor();
  // New reports appear first in the queue.
  await page
    .getByRole("button", { name: "Request revision", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Add a comment");
  await page.getByLabel("PM review comment").fill("Please confirm quantities.");
  await page
    .getByRole("button", { name: "Request revision", exact: true })
    .click();
  await page.goto(path);
  await expect(
    page.getByRole("textbox", { name: "Site manager *", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByText("Please confirm quantities.", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Submit for approval" }).click();
  await page.goto("/approvals");
  await page
    .getByRole("button", { name: "Approve report", exact: true })
    .click();
  await page.goto(path);
  await expect(
    page.getByRole("textbox", { name: "Site manager *", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Create new revision" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "PDF preview", exact: true }).click();
  await expect(page.locator(".document")).toContainText(
    "East wing reinforcement",
  );
  await expect(page.locator(".document")).toContainText("Sarah Mitchell");
  await page.pdf({
    path: "/tmp/atmosphera-daily-report.pdf",
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
  });
});

test("approved reports create separate editable revisions without altering original", async ({
  page,
}) => {
  await page.goto("/daily-reports/dsr-001");
  await expect(
    page.getByRole("textbox", { name: "Site manager *", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Create new revision" }).click();
  await expect(
    page.getByRole("textbox", { name: "Site manager *", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByText("DAILY SITE REPORT / REVISION 2", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Site manager *", exact: true })
    .fill("Revision manager");
  await page.goto("/daily-reports/dsr-001");
  await expect(page.getByRole("textbox", { name: "Site manager *", exact: true })).toHaveValue(
    "Aditya Putra",
  );
  await expect(
    page.getByRole("textbox", { name: "Site manager *", exact: true }),
  ).toBeDisabled();
});

test("monthly progress requires PM confirmation and director approval", async ({
  page,
}) => {
  await page.goto("/monthly-builder");
  await page
    .getByLabel("Actual project progress (%)", { exact: true })
    .fill("61");
  await expect(
    page.getByRole("button", { name: "Request director approval" }),
  ).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Request director approval" }).click();
  await expect(
    page.getByRole("button", { name: "Approve monthly report" }),
  ).toBeDisabled();
  await page.getByLabel("Demo role").selectOption("Director / Admin");
  await page.getByRole("button", { name: "Approve monthly report" }).click();
  await expect(
    page.getByText(
      "Approved by Director / Admin. This monthly record is locked.",
    ),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open PDF preview" }).click();
  await expect(page.locator(".document")).toContainText("61%");
  await expect(page.locator(".draft-watermark")).toHaveCount(0);
  await page.pdf({
    path: "/tmp/atmosphera-monthly-report.pdf",
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
  });
});
