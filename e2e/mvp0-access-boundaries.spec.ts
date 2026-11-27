import { expect, test } from "@playwright/test";

// These unauthenticated checks run automatically in all configured viewports.
// Authenticated tenant/delegation scenarios also require the UAT identities.
test("agency family delegation cannot be opened anonymously", async ({ page }) => {
  await page.goto("/console/agenzia/entra-come-famiglia/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee");
  await expect(page).toHaveURL(/\/accedi/);
});

test("private memorial preview requires authentication", async ({ page }) => {
  await page.goto("/memoriale/anteprima/cccccccc-cccc-4ccc-8ccc-cccccccccccc");
  await expect(page).toHaveURL(/\/accedi/);
});
