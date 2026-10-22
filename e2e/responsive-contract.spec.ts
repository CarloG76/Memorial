import { test, expect } from "@playwright/test";

test.describe("Responsive design baseline: desktop, tablet, smartphone", () => {
  test("landing and login do not overflow horizontally", async ({ page }) => {
    for (const route of ["/", "/accedi"]) {
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scroll, `Overflow on ${route} at ${dimensions.width}px`)
        .toBeLessThanOrEqual(dimensions.width + 1);
    }
    await expect(page.getByRole("heading", {name:"Bentornato."})).toBeVisible();
  });
});

test.describe("Authenticated responsive workspace UAT", () => {
  test.skip(
    !process.env.MEMORIAL_E2E_EMAIL || !process.env.MEMORIAL_E2E_PASSWORD,
    "Requires explicitly supplied nonproduction UAT credentials and a Supabase-connected environment.",
  );
  test("navigation, filter and card layout on each viewport", async ({ page }) => {
    await page.goto("/accedi");
    await page.getByLabel("Indirizzo email").fill(process.env.MEMORIAL_E2E_EMAIL!);
    await page.getByLabel("Password").fill(process.env.MEMORIAL_E2E_PASSWORD!);
    await page.getByRole("button", {name:"Accedi in sicurezza"}).click();
    await expect(page).toHaveURL(/\/console/);
    await page.goto("/console/piattaforma?sezione=agenzie");
    await expect(page.getByRole("heading", {name:"Agenzie"})).toBeVisible();
    const width = page.viewportSize()?.width ?? 1280;
    if(width <= 1100) {
      const trigger=page.getByRole("button",{name:"Apri menu di navigazione"});
      await expect(trigger).toBeVisible();
      await trigger.click();
      await expect(page.getByRole("dialog",{name:"Menu SuperAdmin"})).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog",{name:"Menu SuperAdmin"})).toHaveCount(0);
      await expect(trigger).toBeFocused();
      const cards=page.locator(".catalog-table tbody tr");
      expect(await cards.count()).toBeGreaterThan(0);
      await expect(cards.first()).toBeVisible();
    } else {
      await expect(page.getByRole("navigation",{name:"Sezioni SuperAdmin"})).toBeVisible();
    }
    const dimensions=await page.evaluate(()=>({
      width:document.documentElement.clientWidth,
      scroll:document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width+1);
  });
});
