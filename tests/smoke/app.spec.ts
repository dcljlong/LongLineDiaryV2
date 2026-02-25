import { test, expect } from "@playwright/test";

test("authenticated user can load dashboard", async ({ page }) => {
  await page.goto("./dashboard");
  await page.waitForLoadState("domcontentloaded");
  expect(page.url()).toContain("/LongLineDiaryV2/");
  await expect(page.getByText(/dashboard/i).first()).toBeVisible();
});

test("settings route resolves under base path", async ({ page }) => {
  await page.goto("./settings");
  await page.waitForLoadState("domcontentloaded");
  expect(page.url()).toContain("/LongLineDiaryV2/");
  await expect(page.getByText(/settings/i).first()).toBeVisible();
});

test("core routes render (smoke)", async ({ page }) => {
  const routes = ["./dashboard", "./daily-logs", "./calendar", "./timesheets", "./reports"];
  for (const r of routes) {
    await page.goto(r);
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/LongLineDiaryV2/");
    await expect(page.locator("body")).toBeVisible();
  }
});
