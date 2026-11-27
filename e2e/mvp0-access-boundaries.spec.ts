import { expect, test } from "@playwright/test";

// These unauthenticated checks run automatically in all configured viewports.
// Authenticated tenant/delegation scenarios also require the UAT identities.
test("agency family delegation cannot be opened anonymously", async ({ page }) => {
  await page.goto("/console/agenzia/entra-come-famiglia/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee");
  await expect(page).toHaveURL(/\/accedi/);
});

test("private memorial preview requires authentication", async ({ page }) => {
  // This route validates identity through Supabase. Run only against an explicitly
  // configured staging environment; default CI has no Supabase credentials.
  test.skip(!process.env.MEMORIAL_E2E_BASE_URL, "Requires configured staging Supabase for auth integration");
  await page.goto("/memoriale/anteprima/cccccccc-cccc-4ccc-8ccc-cccccccccccc");
  await expect(page).toHaveURL(/\/accedi/);
});
