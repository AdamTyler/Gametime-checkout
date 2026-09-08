import type { PaymentMethodId } from '../api/contract';

export type Device = {
  platform: 'ios' | 'android';
  hasApplePayCard: boolean;
  hasGooglePay: boolean;
};

export type Reason = 'wrong_platform' | 'not_provisioned' | 'below_minimum';

export type MethodEligibility = {
  method: PaymentMethodId;
  eligible: boolean;
  reason?: Reason;
};

// Spec says "over $100"... I'm ready that as strictly greater so $100.00 doesn't qualify
export const AFFIRM_MIN_CENTS = 10_000;

export function evaluateEligibility(
  device: Device,
  totalCents: number,
  affirmMinCents = AFFIRM_MIN_CENTS,
): MethodEligibility[] {
  return [
    result('apple_pay', applePayReason(device)),
    result('google_pay', googlePayReason(device)),
    result('affirm', totalCents > affirmMinCents ? null : 'below_minimum'),
    result('card', null),
  ];
}

function applePayReason(device: Device): Reason | null {
  if (device.platform !== 'ios') return 'wrong_platform';
  if (!device.hasApplePayCard) return 'not_provisioned';
  return null;
}

function googlePayReason(device: Device): Reason | null {
  if (device.platform !== 'android') return 'wrong_platform';
  if (!device.hasGooglePay) return 'not_provisioned';
  return null;
}

function result(method: PaymentMethodId, reason: Reason | null): MethodEligibility {
  return reason ? { method, eligible: false, reason } : { method, eligible: true };
}