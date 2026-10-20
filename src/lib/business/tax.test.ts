import { describe, expect, it } from "vitest";
import { calculateVatPreview } from "./tax";
import { previewInitialOrder } from "./pricing";

describe("VAT arithmetic without unapproved fiscal defaults", () => {
  it("computes net prices with an explicitly provided 22% rate", () => {
    expect(calculateVatPreview({ listAmountCents: 590, rateBasisPoints: 2200, basis: "EXCLUDING_VAT" }))
      .toMatchObject({ netCents: 590, vatCents: 130, grossCents: 720, preliminary: true });
    expect(calculateVatPreview({ listAmountCents: 990, rateBasisPoints: 2200, basis: "EXCLUDING_VAT" }))
      .toMatchObject({ netCents: 990, vatCents: 218, grossCents: 1208 });
    expect(calculateVatPreview({ listAmountCents: 3990, rateBasisPoints: 2200, basis: "EXCLUDING_VAT" }))
      .toMatchObject({ netCents: 3990, vatCents: 878, grossCents: 4868 });
  });

  it("extracts included 22% VAT from the same catalog prices, without changing the gross", () => {
    expect(calculateVatPreview({ listAmountCents: 590, rateBasisPoints: 2200, basis: "INCLUDING_VAT" }))
      .toMatchObject({ netCents: 484, vatCents: 106, grossCents: 590 });
    expect(calculateVatPreview({ listAmountCents: 990, rateBasisPoints: 2200, basis: "INCLUDING_VAT" }))
      .toMatchObject({ netCents: 811, vatCents: 179, grossCents: 990 });
    expect(calculateVatPreview({ listAmountCents: 3990, rateBasisPoints: 2200, basis: "INCLUDING_VAT" }))
      .toMatchObject({ netCents: 3270, vatCents: 720, grossCents: 3990 });
  });

  it("can illustrate the discounted Pro quote only after a server-approved tax selection", () => {
    const quote = previewInitialOrder({
      agencyPlan: "PRO", tier: "PREMIUM", totalYears: 1, useProCredit: true,
    });
    expect(quote.creditReservationRequired).toBe(true);
    const vat = calculateVatPreview({
      listAmountCents: quote.totalCents, rateBasisPoints: 2200, basis: "EXCLUDING_VAT",
    });
    expect(vat).toMatchObject({ netCents: 200, vatCents: 44, grossCents: 244 });
  });

  it("handles 0 euro orders and zero-rate arithmetic without treating it as fiscal authorization", () => {
    expect(calculateVatPreview({ listAmountCents: 0, rateBasisPoints: 2200, basis: "EXCLUDING_VAT" }))
      .toMatchObject({ netCents: 0, vatCents: 0, grossCents: 0, preliminary: true });
    expect(calculateVatPreview({ listAmountCents: 590, rateBasisPoints: 0, basis: "INCLUDING_VAT" }))
      .toMatchObject({ netCents: 590, vatCents: 0, grossCents: 590, preliminary: true });
  });

  it("rejects missing or invalid choices: there is no implicit 22% or tax-inclusive assumption", () => {
    expect(() => calculateVatPreview({
      listAmountCents: 590, rateBasisPoints: undefined as unknown as number, basis: "EXCLUDING_VAT",
    })).toThrow();
    expect(() => calculateVatPreview({
      listAmountCents: 590, rateBasisPoints: 2200, basis: undefined as unknown as "EXCLUDING_VAT",
    })).toThrow();
    expect(() => calculateVatPreview({ listAmountCents: -1, rateBasisPoints: 2200, basis: "EXCLUDING_VAT" })).toThrow();
    expect(() => calculateVatPreview({ listAmountCents: 1.99, rateBasisPoints: 2200, basis: "EXCLUDING_VAT" })).toThrow();
    expect(() => calculateVatPreview({ listAmountCents: 590, rateBasisPoints: -1, basis: "EXCLUDING_VAT" })).toThrow();
    expect(() => calculateVatPreview({ listAmountCents: 590, rateBasisPoints: 10001, basis: "EXCLUDING_VAT" })).toThrow();
    expect(() => calculateVatPreview({ listAmountCents: Number.MAX_SAFE_INTEGER, rateBasisPoints: 2200, basis: "EXCLUDING_VAT" })).toThrow();
  });
});
