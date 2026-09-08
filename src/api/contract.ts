// Shared by the app and the mock server. Types only for now

export type PaymentMethodId = 'apple_pay' | 'google_pay' | 'affirm' | 'card';

export type IntentStatus =
  | 'requires_authorization'
  | 'processing'
  | 'succeeded'
  | 'declined'
  | 'canceled';

export type DeclineCode = 'insufficient_funds' | 'expired_card' | 'do_not_honor';

export interface PaymentIntent {
  id: string;
  orderId: string;
  method: PaymentMethodId;
  amountCents: number;
  status: IntentStatus;
  declineCode: DeclineCode | null;
  receiptId: string | null;
}

export interface CreateIntentRequest {
  orderId: string;
  method: PaymentMethodId;
  amountCents: number;
}

// Token comes from the (stubbed) SDK. Card numbers never hit this API.
export interface ConfirmIntentRequest {
  amountCents: number;
  authorization: { provider: PaymentMethodId; token: string };
}

export type ApiErrorCode =
  | 'invalid_request'
  | 'not_found'
  | 'amount_mismatch'
  | 'idempotency_key_reuse';

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string };
}