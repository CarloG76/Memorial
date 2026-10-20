import { expect, test } from "@playwright/test";

test("onboarding is protected from anonymous users", async ({ page }) => {
  await page.goto("/console/onboarding");
  await expect(page).toHaveURL(/\/accedi/);
});
