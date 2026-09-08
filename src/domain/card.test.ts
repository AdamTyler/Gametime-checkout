import { detectBrand, expiryInFuture, formatCardNumber, luhn, parseExpiry, validateCard } from './card';

// Stripe's test numbers
const visa = '4242424242424242';
const visaDeclines = '4000000000000002'; // luhn-valid, the server declines it
const amex = '378282246310005';
const mastercard = '5555555555554444';

describe('luhn', () => {
  it('passes real test numbers', () => {
    expect(luhn(visa)).toBe(true);
    expect(luhn(visaDeclines)).toBe(true);
    expect(luhn(amex)).toBe(true);
    expect(luhn(mastercard)).toBe(true);
  });

  it('fails a one-digit typo', () => {
    expect(luhn('4242424242424241')).toBe(false);
  });
});

describe('detectBrand', () => {
  it('knows the big four', () => {
    expect(detectBrand(visa)).toBe('visa');
    expect(detectBrand(amex)).toBe('amex');
    expect(detectBrand(mastercard)).toBe('mastercard');
    expect(detectBrand('6011111111111117')).toBe('discover');
    expect(detectBrand('9999')).toBe('unknown');
  });
});

describe('formatCardNumber', () => {
  it('groups 4-4-4-4 and 4-6-5 for amex', () => {
    expect(formatCardNumber(visa, 'visa')).toBe('4242 4242 4242 4242');
    expect(formatCardNumber(amex, 'amex')).toBe('3782 822463 10005');
    expect(formatCardNumber('42424', 'visa')).toBe('4242 4');
  });
});

describe('expiry', () => {
  const now = new Date(2026, 8, 15); // Sep 2026

  it('parses MM/YY and rejects bad months', () => {
    expect(parseExpiry('12/28')).toEqual({ month: 12, year: 2028 });
    expect(parseExpiry('13/28')).toBeNull();
    expect(parseExpiry('1/28')).toBeNull();
  });

  it('is valid through the end of the current month', () => {
    expect(expiryInFuture({ month: 9, year: 2026 }, now)).toBe(true);
    expect(expiryInFuture({ month: 8, year: 2026 }, now)).toBe(false);
    expect(expiryInFuture({ month: 1, year: 2027 }, now)).toBe(true);
  });
});

describe('validateCard', () => {
  it('is clean for a good card', () => {
    expect(validateCard({ number: '4242 4242 4242 4242', expiry: '12/28', cvc: '123' })).toEqual({});
  });

  it('wants 4 digits for amex', () => {
    expect(validateCard({ number: amex, expiry: '12/28', cvc: '123' }).cvc).toBeDefined();
    expect(validateCard({ number: amex, expiry: '12/28', cvc: '1234' }).cvc).toBeUndefined();
  });

  it('flags each field on its own', () => {
    const errors = validateCard({ number: '4242', expiry: '01/20', cvc: '' });
    expect(Object.keys(errors).sort()).toEqual(['cvc', 'expiry', 'number']);
  });
});