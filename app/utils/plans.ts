/**
 * Greg AI plans — shared by server and client (display only). Prices include
 * VAT: EU consumer prices must be shown tax-inclusive.
 */

export type BillingInterval = "month" | "year";

export const GREG_PRO_PRICES: Record<BillingInterval, { amount: number; lookupKey: string }> = {
  month: { amount: 5.99, lookupKey: "greg_pro_monthly_eur" },
  year: { amount: 49, lookupKey: "greg_pro_yearly_eur" },
};

export const FREE_DAILY_MESSAGES = 5;
export const PRO_DAILY_MESSAGES = 40;

/** Days after the first payment in which a subscriber can withdraw for a full refund. */
export const WITHDRAWAL_DAYS = 14;

export function isBillingInterval(value: unknown): value is BillingInterval {
  return value === "month" || value === "year";
}
