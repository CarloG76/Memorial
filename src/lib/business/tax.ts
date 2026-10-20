/**
 * Memorial VAT arithmetic ONLY.
 *
 * No default rate, jurisdiction, tax category or list-price VAT basis:
 * those are explicitly unresolved in 02_APERTI.md (20 October 2026).
 * Callers MUST get an approved tax decision before using this for a checkout,
 * an invoice, a receipt or a tax return.
 *
 * All monetary amounts are integer EUR cents, rates integer basis points:
 * 2200 basis points = 22%.
 */
export type VatAmountBasis = "EXCLUDING_VAT" | "INCLUDING_VAT";

export type VatBreakdown = Readonly<{
  currency: "EUR";
  rateBasisPoints: number;
  basis: VatAmountBasis;
  netCents: number;
  vatCents: number;
  grossCents: number;
  preliminary: true;
}>;

function assertCents(cents: number): void {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new RangeError("L'importo deve essere un numero intero non negativo di centesimi.");
  }
}

function assertRate(rateBasisPoints: number): void {
  if (!Number.isInteger(rateBasisPoints) ||
      rateBasisPoints < 0 || rateBasisPoints > 10000) {
    throw new RangeError("Aliquota IVA non valida: fornire basis points espliciti.");
  }
}

/**
 * This is NOT a tax-rule engine: for reverse charge, non-taxability, exempt
 * invoices and cross-border transactions, a qualified tax decision is needed.
 * Discounted final taxable consideration should be passed here, not a
 * fictional undiscounted price or a separate unqualified credit amount.
 */
export function calculateVatPreview(input: Readonly<{
  listAmountCents: number;
  rateBasisPoints: number;
  basis: VatAmountBasis;
}>): VatBreakdown {
  const { listAmountCents, rateBasisPoints, basis } = input;
  assertCents(listAmountCents);
  assertRate(rateBasisPoints);

  if (basis !== "EXCLUDING_VAT" && basis !== "INCLUDING_VAT") {
    throw new RangeError("Specificare se il prezzo di listino include l'IVA.");
  }

  let netCents: number;
  let grossCents: number;

  if (basis === "EXCLUDING_VAT") {
    const rawVat = listAmountCents * rateBasisPoints;
    if (!Number.isSafeInteger(rawVat)) throw new RangeError("Importo oltre i limiti numerici.");
    const vatCents = Math.round(rawVat / 10000);
    netCents = listAmountCents;
    grossCents = listAmountCents + vatCents;
  } else {
    const rawNet = listAmountCents * 10000;
    if (!Number.isSafeInteger(rawNet)) throw new RangeError("Importo oltre i limiti numerici.");
    netCents = Math.round(rawNet / (10000 + rateBasisPoints));
    grossCents = listAmountCents;
  }

  if (!Number.isSafeInteger(grossCents) || !Number.isSafeInteger(netCents)) {
    throw new RangeError("Importo oltre i limiti numerici.");
  }
  return {
    currency: "EUR",
    rateBasisPoints,
    basis,
    netCents,
    vatCents: grossCents - netCents,
    grossCents,
    preliminary: true,
  };
}
