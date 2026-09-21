/**
 * Bangladeshi Taka (BDT) Currency Utilities
 * Symbol: ৳ (Bangladeshi Taka / Taka sign)
 */

export const BDT_SYMBOL = '৳';
export const BDT_CODE = 'BDT';

export interface FormatBDTOptions {
  hideSymbol?: boolean;
  hideDecimals?: boolean;
  compact?: boolean;
  showSign?: boolean;
}

/**
 * Formats a numeric value into Bangladeshi Taka (৳ BDT)
 * Example: 14500 -> "৳14,500.00"
 */
export function formatBDT(amount: number | null | undefined, options?: FormatBDTOptions): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return options?.hideSymbol ? '0.00' : `${BDT_SYMBOL}0.00`;
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  if (options?.compact) {
    if (absAmount >= 10000000) { // 1 Crore (Cr)
      const val = (absAmount / 10000000).toFixed(2);
      return `${isNegative ? '-' : options?.showSign ? '+' : ''}${options?.hideSymbol ? '' : BDT_SYMBOL}${val} Cr`;
    }
    if (absAmount >= 100000) { // 1 Lakh (L)
      const val = (absAmount / 100000).toFixed(1);
      return `${isNegative ? '-' : options?.showSign ? '+' : ''}${options?.hideSymbol ? '' : BDT_SYMBOL}${val} L`;
    }
    if (absAmount >= 1000) { // 1 Thousand (k)
      const val = (absAmount / 1000).toFixed(1);
      return `${isNegative ? '-' : options?.showSign ? '+' : ''}${options?.hideSymbol ? '' : BDT_SYMBOL}${val}k`;
    }
  }

  const fractionDigits = options?.hideDecimals ? 0 : 2;
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(absAmount);

  const sign = isNegative ? '-' : options?.showSign ? '+' : '';
  const prefix = options?.hideSymbol ? '' : BDT_SYMBOL;

  return `${sign}${prefix}${formattedNumber}`;
}

/**
 * Parses a user input string that might contain "৳", "BDT", commas, or spaces into a number.
 */
export function parseBDT(input: string): number {
  if (!input) return 0;
  const cleaned = input.replace(/[৳BDT,\s]/gi, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
