/**
 * Memorial MVP1 commercial catalog, 27 Nov 2026.
 * Amounts are EUR cents; values are preliminary commercial quotes and DO NOT
 * include a VAT determination. No payment, storage contract or entitlement is
 * authorized by this client-side module.
 *
 * Source: docs/roadmap/2026-11-20-mvp-mvpplus.md (25 Nov update).
 */
export type CommercialPlan = "PAYG" | "MONTHLY" | "YEARLY";
export type MemorialTier = "STANDARD" | "PREMIUM";
export type CommercialCatalogEntry = Readonly<{
  label: string;
  subscriptionCents: number;
  standardCents: number;
  premiumCents: number;
  period: "NONE" | "MONTH" | "YEAR";
}>;
export const INITIAL_FREE_ACTIVATIONS = 2 as const;
export const COMMERCIAL_CATALOG: Readonly<Record<CommercialPlan, CommercialCatalogEntry>> = {
  PAYG: { label: "Senza abbonamento", subscriptionCents: 0, standardCents: 1990, premiumCents: 2290, period: "NONE" },
  MONTHLY: { label: "Pro mensile", subscriptionCents: 3990, standardCents: 1390, premiumCents: 1690, period: "MONTH" },
  YEARLY: { label: "Pro annuale", subscriptionCents: 37900, standardCents: 1190, premiumCents: 1490, period: "YEAR" },
} as const;

export type MemorialQuote = Readonly<{
  currency: "EUR";
  plan: CommercialPlan;
  tier: MemorialTier;
  basePriceCents: number;
  freeActivationApplied: boolean;
  totalCents: number;
  isQuoteOnly: true;
}>;

function catalogEntry(plan: CommercialPlan): CommercialCatalogEntry {
  if (!Object.prototype.hasOwnProperty.call(COMMERCIAL_CATALOG, plan)) {
    throw new RangeError("Piano commerciale non previsto.");
  }
  return COMMERCIAL_CATALOG[plan];
}

/** No price authorizes a checkout: the server must check tenancy and eligibility. */
export function previewMemorialOrder(input: Readonly<{
  plan: CommercialPlan;
  tier: MemorialTier;
  freeActivationsRemaining: number;
}>): MemorialQuote {
  const product = catalogEntry(input.plan);
  if (input.tier !== "STANDARD" && input.tier !== "PREMIUM") {
    throw new RangeError("Tipologia non prevista.");
  }
  if (!Number.isSafeInteger(input.freeActivationsRemaining) ||
      input.freeActivationsRemaining < 0 ||
      input.freeActivationsRemaining > INITIAL_FREE_ACTIVATIONS) {
    throw new RangeError("Saldo attivazioni gratuite non valido.");
  }
  const basePriceCents = input.tier === "STANDARD" ? product.standardCents : product.premiumCents;
  const freeActivationApplied = input.freeActivationsRemaining > 0;
  return {
    currency: "EUR",
    plan: input.plan,
    tier: input.tier,
    basePriceCents,
    freeActivationApplied,
    totalCents: freeActivationApplied ? 0 : basePriceCents,
    isQuoteOnly: true,
  };
}

export function previewSubscription(plan: CommercialPlan): Readonly<{
  currency: "EUR";
  totalCents: number;
  period: CommercialCatalogEntry["period"];
  isQuoteOnly: true;
}> {
  const entry = catalogEntry(plan);
  return { currency: "EUR", totalCents: entry.subscriptionCents, period: entry.period, isQuoteOnly: true };
}

export function formatEuro(cents: number): string {
  if (!Number.isSafeInteger(cents)) throw new RangeError("Importo non valido.");
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}
