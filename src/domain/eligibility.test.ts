import { evaluateEligibility, AFFIRM_MIN_CENTS, type Device } from './eligibility';

const iphone: Device = { platform: 'ios', hasApplePayCard: true, hasGooglePay: false };
const pixel: Device = { platform: 'android', hasApplePayCard: false, hasGooglePay: true };

function eligible(device: Device, totalCents: number) {
  return evaluateEligibility(device, totalCents)
    .filter((r) => r.eligible)
    .map((r) => r.method);
}

function reasonFor(device: Device, totalCents: number, method: string) {
  return evaluateEligibility(device, totalCents).find((r) => r.method === method)?.reason;
}

describe('evaluateEligibility', () => {
  it('iOS with a provisioned card: apple pay + card', () => {
    expect(eligible(iphone, 4_000)).toEqual(['apple_pay', 'card']);
  });

  it('iOS without a card falls back to card only', () => {
    expect(eligible({ ...iphone, hasApplePayCard: false }, 4_000)).toEqual(['card']);
    expect(reasonFor({ ...iphone, hasApplePayCard: false }, 4_000, 'apple_pay')).toBe('not_provisioned');
  });

  it('android with google pay over $100: google pay + affirm + card', () => {
    expect(eligible(pixel, 15_000)).toEqual(['google_pay', 'affirm', 'card']);
  });

  it('wallets never cross platforms', () => {
    expect(reasonFor(iphone, 4_000, 'google_pay')).toBe('wrong_platform');
    expect(reasonFor(pixel, 4_000, 'apple_pay')).toBe('wrong_platform');
  });

  it('affirm requires strictly more than $100', () => {
    expect(eligible(iphone, AFFIRM_MIN_CENTS - 1)).not.toContain('affirm');
    expect(eligible(iphone, AFFIRM_MIN_CENTS)).not.toContain('affirm');
    expect(eligible(iphone, AFFIRM_MIN_CENTS + 1)).toContain('affirm');
    expect(reasonFor(iphone, AFFIRM_MIN_CENTS, 'affirm')).toBe('below_minimum');
  });

  it('card is always there', () => {
    expect(eligible({ platform: 'android', hasApplePayCard: false, hasGooglePay: false }, 1)).toEqual(['card']);
  });
});