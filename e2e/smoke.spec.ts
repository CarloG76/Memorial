import { test, expect } from "@playwright/test";

test("public landing works on desktop and mobile", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ogni vita");
  await expect(page.getByRole("link", { name: /accedi al tuo spazio/i })).toBeVisible();
});

test("health route returns public minimal response", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({ data: { status: "ok", service: "memorial" } });
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test("console is inaccessible without an authenticated session", async ({ page }) => {
  await page.goto("/console/piattaforma");
  await expect(page).toHaveURL(/\/accedi/);
});
