import { expect, test } from "@playwright/test";
test("connected mode without configuration never displays or persists demo data", async ({
  page,
}) => {
  for (const path of [
    "/",
    "/projects",
    "/daily-reports/new",
    "/settings",
    "/login",
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: "Configuration required" }),
    ).toBeVisible();
    await expect(page.getByText("Villa Uma Residence")).toHaveCount(0);
    await expect(page.getByLabel("Demo role")).toHaveCount(0);
  }
  expect(
    await page.evaluate(() => localStorage.getItem("atmosphera-demo-v1")),
  ).toBeNull();
});
