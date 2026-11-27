import { describe, expect, it } from "vitest";
import { previewMemorialOrder, previewSubscription, COMMERCIAL_CATALOG } from "./pricing";

describe("pricing compatibility entrypoint", () => {
  it("uses the current shared November catalog instead of the superseded October amounts", () => {
    expect(COMMERCIAL_CATALOG.PAYG.standardCents).toBe(1990);
    expect(COMMERCIAL_CATALOG.PAYG.premiumCents).toBe(2290);
    expect(previewMemorialOrder({ plan: "MONTHLY", tier: "PREMIUM", freeActivationsRemaining: 0 }).totalCents).toBe(1690);
    expect(previewMemorialOrder({ plan: "YEARLY", tier: "STANDARD", freeActivationsRemaining: 0 }).totalCents).toBe(1190);
    expect(previewSubscription("MONTHLY").totalCents).toBe(3990);
    expect(previewSubscription("YEARLY").totalCents).toBe(37900);
  });
  it("never treats a price preview as payment fulfilment", () => {
    const preview = previewMemorialOrder({ plan: "PAYG", tier: "STANDARD", freeActivationsRemaining: 2 });
    expect(preview).toMatchObject({ totalCents: 0, isQuoteOnly: true, freeActivationApplied: true });
  });
});
