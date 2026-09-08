import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { api, ApiError } from '../api/client';
import type { PaymentIntent, PaymentMethodId } from '../api/contract';
import type { PaymentState } from '../domain/payment';
import { inflight } from './inflight';

const newKey = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function usePayment(orderId: string, amountCents: number) {
  const [state, setState] = useState<PaymentState>({ status: 'idle' });

  // cold start: did we die with a payment in the air?
  useEffect(() => {
    inflight.load().then((saved) => {
      if (saved) reconcile(saved.intentId);
    });
  }, []);

  // Coming back to the foreground. Only matters if the confirm request was in flight —
  // if the native sheet was up, it's still up, the SDK owns that.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' && state.status === 'confirming') {
        reconcile(state.intent.id);
      }
    });
    return () => sub.remove();
  }, [state]);

  async function reconcile(intentId: string) {
    console.log('usePayments: reconcile intent: ', intentId);
    setState({ status: 'reconciling', intentId });
    try {
      settle(await api.getIntent(intentId));
    } catch {
      // stay in reconciling, they can hit "check again"
    }
  }

  function settle(intent: PaymentIntent) {
    console.log('usePayments: settle intent: ', intent);
    if (intent.status === 'succeeded' || intent.status === 'declined') {
      inflight.clear();
      setState({ status: intent.status, intent });
    } else if (intent.status === 'requires_authorization') {
      // never confirmed, nothing charged
      inflight.clear();
      setState({ status: 'idle' });
    }
    // processing: still don't know, leave it
  }

  async function pay(method: PaymentMethodId, authorize: () => Promise<string | null>) {
    let intentId: string | null = null;
    setState({ status: 'authorizing', method });
    console.log('usePayments: pay', method)
    try {
      const intent = await api.createIntent({ orderId, method, amountCents }, newKey());
      intentId = intent.id;
      await inflight.save({ intentId, method });

      const token = await authorize();
      if (!token) {
        inflight.clear();
        setState({ status: 'idle' });
        return;
      }

      setState({ status: 'confirming', intent });
      const result = await api.confirmIntent(intentId, {
        amountCents,
        authorization: { provider: method, token },
      });
      if (result.pending) reconcile(intentId);
      else settle(result.intent);
    } catch (e) {
      if (e instanceof ApiError && e.outcomeUnknown && intentId) {
        reconcile(intentId);
      } else {
        inflight.clear();
        setState({ status: 'failed', message: e instanceof Error ? e.message : 'something went wrong' });
      }
    }
  }

  function reset() {
    inflight.clear();
    setState({ status: 'idle' });
  }

  return {
    state,
    pay,
    reset,
    retry: () => state.status === 'reconciling' && reconcile(state.intentId),
  };
}