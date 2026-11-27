import { describe, expect, it } from "vitest";
import {
  COMMERCIAL_CATALOG, INITIAL_FREE_ACTIVATIONS, formatEuro,
  previewMemorialOrder, previewSubscription,
} from "./commercial-catalog";

describe("MVP1 canonical commercial catalog", () => {
  it("uses the November-approved prices in integer euro cents", () => {
    expect(COMMERCIAL_CATALOG).toMatchObject({
      PAYG: { subscriptionCents: 0, standardCents: 1990, premiumCents: 2290 },
      MONTHLY: { subscriptionCents: 3990, standardCents: 1390, premiumCents: 1690 },
      YEARLY: { subscriptionCents: 37900, standardCents: 1190, premiumCents: 1490 },
    });
  });
  it("quotes zero for each of the first two free activations", () => {
    expect(INITIAL_FREE_ACTIVATIONS).toBe(2);
    for (const remaining of [2, 1]) {
      const quote = previewMemorialOrder({ plan: "PAYG", tier: "PREMIUM", freeActivationsRemaining: remaining });
      expect(quote).toMatchObject({ basePriceCents: 2290, totalCents: 0, freeActivationApplied: true, isQuoteOnly: true });
    }
  });
  it("quotes each post-free tier and plan correctly", () => {
    for (const plan of ["PAYG", "MONTHLY", "YEARLY"] as const) {
      for (const tier of ["STANDARD", "PREMIUM"] as const) {
        const quote = previewMemorialOrder({ plan, tier, freeActivationsRemaining: 0 });
        const expected = tier === "STANDARD" ? COMMERCIAL_CATALOG[plan].standardCents : COMMERCIAL_CATALOG[plan].premiumCents;
        expect(quote.totalCents).toBe(expected);
        expect(quote.freeActivationApplied).toBe(false);
      }
    }
  });
  it("quotes subscriptions without activating billing", () => {
    expect(previewSubscription("PAYG")).toMatchObject({ totalCents: 0, period: "NONE", isQuoteOnly: true });
    expect(previewSubscription("MONTHLY")).toMatchObject({ totalCents: 3990, period: "MONTH" });
    expect(previewSubscription("YEARLY")).toMatchObject({ totalCents: 37900, period: "YEAR" });
  });
  it("rejects invalid entitlements, plans and tier values", () => {
    for (const remaining of [-1, 0.5, 3, NaN, Infinity]) {
      expect(() => previewMemorialOrder({ plan: "PAYG", tier: "STANDARD", freeActivationsRemaining: remaining })).toThrow();
    }
    expect(() => previewSubscription("INVALID" as "PAYG")).toThrow();
    expect(() => previewMemorialOrder({ plan: "PAYG", tier: "INVALID" as "STANDARD", freeActivationsRemaining: 0 })).toThrow();
  });
  it("formats cents consistently without floating-point price configuration", () => {
    expect(formatEuro(1990)).toContain("19,90");
    expect(() => formatEuro(19.9)).toThrow();
  });
});
