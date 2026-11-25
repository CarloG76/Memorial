import { expect, test } from "@playwright/test";

test("legacy onboarding redirects to invitation-only registration", async ({ page }) => {
  await page.goto("/console/onboarding");
  await expect(page).toHaveURL(/\/registrati/);
  await expect(page.getByRole("heading", { name: "La tua agenzia entra su invito." })).toBeVisible();
});
