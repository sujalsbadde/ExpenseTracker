/**
 * Converts integer cents to formatted currency string (e.g. 2500 -> "$25.00")
 */
export const formatCurrency = (amountInCents: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amountInCents / 100);
};

/**
 * Converts dollar decimal value to integer cents (e.g. 25.50 -> 2550)
 */
export const toCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};
