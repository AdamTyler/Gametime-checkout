export type Brand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

export const onlyDigits = (s: string) => s.replace(/\D/g, '');

// Just the common prefixes. Mastercard also has a 2221-2720 range I'm skipping for now.
export function detectBrand(digits: string): Brand {
  if (digits.startsWith('4')) return 'visa';
  if (digits.startsWith('34') || digits.startsWith('37')) return 'amex';
  if (digits.startsWith('6011') || digits.startsWith('65')) return 'discover';
  const two = Number(digits.slice(0, 2));
  if (two >= 51 && two <= 55) return 'mastercard';
  return 'unknown';
}

export const numberLength = (brand: Brand) => (brand === 'amex' ? 15 : 16);
export const cvcLength = (brand: Brand) => (brand === 'amex' ? 4 : 3);

export function luhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

// 4-4-4-4, or 4-6-5 for amex
export function formatCardNumber(digits: string, brand: Brand): string {
  const groups = brand === 'amex' ? [4, 6, 5] : [4, 4, 4, 4];
  const parts: string[] = [];
  let i = 0;
  for (const size of groups) {
    if (i >= digits.length) break;
    parts.push(digits.slice(i, i + size));
    i += size;
  }
  return parts.join(' ');
}

export function formatExpiry(digits: string): string {
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}` : digits;
}

export function parseExpiry(text: string): { month: number; year: number } | null {
  const digits = onlyDigits(text);
  if (digits.length !== 4) return null;
  const month = Number(digits.slice(0, 2));
  if (month < 1 || month > 12) return null;
  return { month, year: 2000 + Number(digits.slice(2)) };
}

// good through the end of the month printed on the card
export function expiryInFuture(exp: { month: number; year: number }, now = new Date()): boolean {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return exp.year > y || (exp.year === y && exp.month >= m);
}

export type CardFields = { number: string; expiry: string; cvc: string };
export type CardErrors = Partial<Record<keyof CardFields, string>>;

export function validateCard(fields: CardFields, now = new Date()): CardErrors {
  const errors: CardErrors = {};
  const digits = onlyDigits(fields.number);
  const brand = detectBrand(digits);

  if (digits.length !== numberLength(brand) || !luhn(digits)) {
    errors.number = 'Check your card number';
  }

  const exp = parseExpiry(fields.expiry);
  if (!exp) errors.expiry = 'Use MM/YY';
  else if (!expiryInFuture(exp, now)) errors.expiry = 'This card has expired';

  if (onlyDigits(fields.cvc).length !== cvcLength(brand)) {
    errors.cvc = brand === 'amex' ? 'Amex uses 4 digits' : '3 digits';
  }

  return errors;
}