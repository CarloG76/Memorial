import { test, expect } from "@playwright/test";

test("unverified visitor cannot open staff console", async ({ page }) => {
  await page.goto("/console/piattaforma");
  await expect(page).toHaveURL(/\/accedi/);
});

test("unverified visitor cannot obtain membership list", async ({ request }) => {
  const res = await request.get("/api/v1/me");
  expect(res.status()).toBe(401);
  const payload = await res.json();
  expect(payload.error.code).toBe("UNAUTHENTICATED");
});

test("public route never advertises members", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(JSON.stringify(await res.json())).not.toMatch(/memberships|service_role|jwt/i);
});
