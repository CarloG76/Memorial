import { expect, test } from "@playwright/test";

test("agency registration route explains invitation-only access", async ({ page }) => {
  await page.goto("/registrati");
  await expect(page.getByRole("heading", { name: "La tua agenzia entra su invito." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Accedi a Memorial" })).toBeVisible();
});

test("registration cannot be submitted without a private invitation", async ({ page }) => {
  await page.goto("/registrati");
  await expect(page.getByRole("button", { name: "Crea credenziali" })).toHaveCount(0);
  await expect(page.getByLabel("Partita IVA italiana")).toHaveCount(0);
});

test("unverified or missing email token does not create a session", async ({ page }) => {
  await page.goto("/auth/confirm?token_hash=invalid&type=email");
  await expect(page).toHaveURL(/\/accedi/);
});

test("visitor may navigate from login to agency registration", async ({ page }) => {
  await page.goto("/accedi");
  await page.getByRole("link", { name: /registrati come agenzia/i }).click();
  await expect(page).toHaveURL(/\/registrati/);
});
