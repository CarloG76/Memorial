import { describe, expect, it } from "vitest";
import {
  previewInitialOrder,
  previewExpiredReactivation,
  subscriptionPriceCents,
} from "./pricing";

describe("Memorial — approved B2B catalog (euro cents)", () => {
  it("quotes Free Standard and Premium first year at €5.90/€9.90", () => {
    expect(previewInitialOrder({
      agencyPlan: "FREE", tier: "STANDARD", totalYears: 1, useProCredit: false,
    }).totalCents).toBe(590);
    expect(previewInitialOrder({
      agencyPlan: "FREE", tier: "PREMIUM", totalYears: 1, useProCredit: false,
    }).totalCents).toBe(990);
  });

  it("quotes Pro Standard/Premium €3.90/€5.90 without credit", () => {
    expect(previewInitialOrder({
      agencyPlan: "PRO", tier: "STANDARD", totalYears: 1, useProCredit: false,
    }).totalCents).toBe(390);
    expect(previewInitialOrder({
      agencyPlan: "PRO", tier: "PREMIUM", totalYears: 1, useProCredit: false,
    }).totalCents).toBe(590);
  });

  it("calculates a simulated Pro credit as €3.90 discount, without granting it", () => {
    const s = previewInitialOrder({
      agencyPlan: "PRO", tier: "STANDARD", totalYears: 1, useProCredit: true,
    });
    expect(s.totalCents).toBe(0);
    expect(s.creditReservationRequired).toBe(true);
    expect(s.isQuoteOnly).toBe(true);

    const p = previewInitialOrder({
      agencyPlan: "PRO", tier: "PREMIUM", totalYears: 1, useProCredit: true,
    });
    expect(p.totalCents).toBe(200);
  });

  it("refuses any attempt to use Pro credits with Free", () => {
    expect(() => previewInitialOrder({
      agencyPlan: "FREE", tier: "PREMIUM", totalYears: 1, useProCredit: true,
    })).toThrow();
  });

  it("uses TOTAL coverage from first publication, not extra years", () => {
    const totals = [
      { years: 1 as const, amount: 0 },
      { years: 3 as const, amount: 1200 },
      { years: 5 as const, amount: 1800 },
      { years: 10 as const, amount: 3000 },
    ];
    for (const { years, amount } of totals) {
      const preview = previewInitialOrder({
        agencyPlan: "FREE", tier: "STANDARD", totalYears: years, useProCredit: false,
      });
      expect(preview.totalCents).toBe(590 + amount);
      expect(preview.currency).toBe("EUR");
    }
  });

  it("adds exactly €10 to expired reactivation for 3/5/10 years", () => {
    expect(previewExpiredReactivation(3).totalCents).toBe(2200);
    expect(previewExpiredReactivation(5).totalCents).toBe(2800);
    expect(previewExpiredReactivation(10).totalCents).toBe(4000);
  });

  it("rejects undefined one-year reactivation and arbitrary duration", () => {
    expect(() => previewExpiredReactivation(1 as 3)).toThrow();
    expect(() => previewInitialOrder({
      agencyPlan: "FREE", tier: "STANDARD", totalYears: 2 as 3, useProCredit: false,
    })).toThrow();
  });

  it("quotes the approved subscription plan prices", () => {
    expect(subscriptionPriceCents("FREE", "MONTHLY")).toBe(0);
    expect(subscriptionPriceCents("PRO", "MONTHLY")).toBe(3990);
    expect(subscriptionPriceCents("PRO", "ANNUAL")).toBe(37900);
    expect(() => subscriptionPriceCents("PRO","WEEKLY" as "MONTHLY")).toThrow();
  });
});
