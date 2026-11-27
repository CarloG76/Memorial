/**
 * Compatibility entry point for the current commercial list.
 *
 * The 20 October Free/Pro pricing (€5.90/€9.90 and old Pro credit discounts)
 * is superseded by the November PAYG / monthly / annual commercial decision.
 * Do not activate memorials or debit money from a preview.
 *
 * Renewal, preservation durations and reactivation fees are intentionally
 * NOT quoted here until their current commercial terms are reconciled.
 */
export {
  COMMERCIAL_CATALOG,
  INITIAL_FREE_ACTIVATIONS,
  previewMemorialOrder,
  previewSubscription,
  formatEuro,
} from "./commercial-catalog";
export type { CommercialPlan, MemorialTier, MemorialQuote } from "./commercial-catalog";
