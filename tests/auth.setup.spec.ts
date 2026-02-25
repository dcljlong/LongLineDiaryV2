import { test } from "@playwright/test";

test("auth setup (creates storageState)", async ({ page }) => {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing env vars: TEST_EMAIL and TEST_PASSWORD");
  }

  await page.goto("/");

  // open AuthModal via logo click
  await page.getByRole("img", { name: "Long Line Diary" }).click();

  // fill signin form (placeholders are stable)
  await page.getByPlaceholder("Email address").fill(email);
  await page.getByPlaceholder("Password").fill(password);

  // click submit (second Sign In is the submit inside the form)
  await page.locator("form").getByRole("button", { name: "Sign In" }).click();

  // wait for navigation off landing (either onboarding or dashboard)
  await page.waitForTimeout(1500);

  // save browser auth state
  await page.context().storageState({ path: "playwright/.auth/user.json" });
});
