/**
 * B2B Memorial price previews only. Never use these functions to authorize
 * payment, reserve a Pro credit, activate a skeleton, or determine tax.
 *
 * Source of truth: Memorial 01_DECISIONI.md and 04_BUSINESS.md (20/10/2026).
 */
export type AgencyPlan = "FREE" | "PRO";
export type MemorialTier = "STANDARD" | "PREMIUM";
export type CoverageYears = 1 | 3 | 5 | 10;
export type SubscriptionInterval = "MONTHLY" | "ANNUAL";

export type PriceLine = Readonly<{
  code: "STANDARD" | "PREMIUM" | "CONSERVATION" | "PRO_CREDIT" | "REACTIVATION";
  amountCents: number;
}>;

export type PricePreview = Readonly<{
  currency: "EUR";
  lines: readonly PriceLine[];
  totalCents: number;
  creditReservationRequired: boolean;
  isQuoteOnly: true;
}>;

const creationPrices: Readonly<Record<AgencyPlan, Record<MemorialTier, number>>> = {
  FREE: { STANDARD: 590, PREMIUM: 990 },
  PRO: { STANDARD: 390, PREMIUM: 590 },
};

const coveragePrices: Readonly<Record<CoverageYears, number>> = {
  1: 0,
  3: 1200,
  5: 1800,
  10: 3000,
};

const PRO_CREDIT_CENTS = 390;
const REACTIVATION_FEE_CENTS = 1000;

function coverageAmount(years: number, initialCreation: boolean): number {
  if (!Object.prototype.hasOwnProperty.call(coveragePrices, years)) {
    throw new RangeError("Durata non prevista dal listino approvato.");
  }
  if (!initialCreation && years === 1) {
    throw new RangeError("Riattivazione per un solo anno: tariffa non approvata.");
  }
  return coveragePrices[years as CoverageYears];
}

function assemble(lines: PriceLine[], reservationRequired: boolean): PricePreview {
  const totalCents = lines.reduce((sum, item) => sum + item.amountCents, 0);
  if (!Number.isSafeInteger(totalCents) || totalCents < 0) {
    throw new Error("Importo non valido.");
  }
  return {
    currency: "EUR",
    lines,
    totalCents,
    creditReservationRequired: reservationRequired,
    isQuoteOnly: true,
  };
}

/**
 * A Pro credit is NOT granted by this calculation: the ledger must reserve
 * it atomically after authorization, idempotency checks and concurrency lock.
 * totalYears is the TOTAL from first publication, never an extension.
 */
export function previewInitialOrder(input: Readonly<{
  agencyPlan: AgencyPlan;
  tier: MemorialTier;
  totalYears: CoverageYears;
  useProCredit: boolean;
}>): PricePreview {
  if (!Object.prototype.hasOwnProperty.call(creationPrices, input.agencyPlan)) {
    throw new RangeError("Piano non previsto.");
  }
  if (!Object.prototype.hasOwnProperty.call(creationPrices[input.agencyPlan], input.tier)) {
    throw new RangeError("Tipologia di memoriale non prevista.");
  }
  if (input.useProCredit && input.agencyPlan !== "PRO") {
    throw new RangeError("Crediti disponibili soltanto con il piano Pro.");
  }

  const amount = creationPrices[input.agencyPlan][input.tier];
  const duration = coverageAmount(input.totalYears, true);
  const lines: PriceLine[] = [
    { code: input.tier, amountCents: amount },
    { code: "CONSERVATION", amountCents: duration },
  ];

  if (input.useProCredit) {
    lines.push({ code: "PRO_CREDIT", amountCents: -PRO_CREDIT_CENTS });
  }

  return assemble(lines, input.useProCredit);
}

/** Pricing ONLY: state/payment/archive checks are mandatory elsewhere. */
export function previewExpiredReactivation(totalYears: 3 | 5 | 10): PricePreview {
  return assemble(
    [
      { code: "REACTIVATION", amountCents: REACTIVATION_FEE_CENTS },
      { code: "CONSERVATION", amountCents: coverageAmount(totalYears, false) },
    ],
    false,
  );
}

export function subscriptionPriceCents(
  plan: AgencyPlan,
  interval: SubscriptionInterval,
): number {
  if (plan === "FREE") return 0;
  if (plan !== "PRO") throw new RangeError("Piano non previsto.");
  if (interval === "MONTHLY") return 3990;
  if (interval === "ANNUAL") return 37900;
  throw new RangeError("Cadenza di pagamento non prevista.");
}
