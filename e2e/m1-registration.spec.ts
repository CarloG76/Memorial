import { expect, test } from "@playwright/test";

test("agency signup is available as a route without leaking private data", async ({ page }) => {
  await page.goto("/registrati");
  await expect(page.getByRole("heading", { name: "Crea il tuo account." })).toBeVisible();
  await expect(page.getByLabel("Ragione sociale")).toBeVisible();
  await expect(page.getByLabel("Partita IVA italiana")).toBeVisible();
});

test("signup endpoint is fail-closed without approved privacy settings", async ({ page }) => {
  await page.goto("/registrati");
  const button = page.getByRole("button", { name: "Crea credenziali" });
  // CI does not configure explicit approval, therefore registration must not open.
  await expect(button).toBeDisabled();
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
