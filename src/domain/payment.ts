import type { PaymentIntent, PaymentMethodId } from '../api/contract';

export type PaymentState =
  | { status: 'idle' }
  | { status: 'authorizing'; method: PaymentMethodId } // creating the intent
  | { status: 'confirming'; intent: PaymentIntent } // confirm request is in the air
  | { status: 'reconciling'; intentId: string } // we don't know, asking the server
  | { status: 'succeeded'; intent: PaymentIntent }
  | { status: 'declined'; intent: PaymentIntent }
  | { status: 'failed'; message: string };