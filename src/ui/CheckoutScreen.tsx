import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { evaluateEligibility } from '../domain/eligibility';
import { useDevice } from '../payments/useDevice';
import { usePayment } from '../payments/usePayment';
import {
  presentAffirm,
  presentWalletSheet,
  tokenizeCard,
} from '../payments/stubs';
import { DevSheet } from '../devtools/DevSheet';
import { CardForm } from './CardForm';

const order = {
  id: 'ord_1',
  seats: 'Sec 112 Row F',
  qty: 2,
  unitCents: 5500,
  feeCents: 1200,
};
const totalCents = order.qty * order.unitCents + order.feeCents;

export function CheckoutScreen() {
  const device = useDevice();
  const [devOpen, setDevOpen] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const { state, pay, reset, retry } = usePayment(order.id, totalCents);

  const eligibility = device ? evaluateEligibility(device, totalCents) : [];
  const canUse = (method: string) =>
    eligibility.some((e) => e.method === method && e.eligible);

  const busy = state.status !== 'idle';
  const done = ['succeeded', 'declined', 'failed'].includes(state.status);

  console.log('Checkout Screen: eligibility', eligibility);
  console.log('Checkout Screen: state', state);

  return (
    <View style={styles.screen}>
      <Pressable onLongPress={() => setDevOpen(true)}>
        <Text style={styles.title}>Checkout</Text>
      </Pressable>

      <View style={styles.summary}>
        <Text>
          {order.qty} x {order.seats}
        </Text>
        <Text>Fees ${(order.feeCents / 100).toFixed(2)}</Text>
        <Text style={styles.total}>Total ${(totalCents / 100).toFixed(2)}</Text>
      </View>

      {!device && <Text style={styles.muted}>Checking payment options...</Text>}

      {canUse('apple_pay') && (
        <Pressable
          style={styles.method}
          disabled={busy}
          onPress={() => pay('apple_pay', presentWalletSheet)}
        >
          <Text style={styles.methodText}>Apple Pay</Text>
        </Pressable>
      )}

      {canUse('google_pay') && (
        <Pressable
          style={styles.method}
          disabled={busy}
          onPress={() => pay('google_pay', presentWalletSheet)}
        >
          <Text style={styles.methodText}>Google Pay</Text>
        </Pressable>
      )}

      {canUse('affirm') && (
        <Pressable
          style={styles.method}
          disabled={busy}
          onPress={() => pay('affirm', presentAffirm)}
        >
          <Text style={styles.methodText}>Affirm</Text>
        </Pressable>
      )}

      {canUse('card') && (
        <Pressable
          style={styles.method}
          disabled={busy}
          onPress={() => setShowCard((v) => !v)}
        >
          <Text style={styles.methodText}>Credit card</Text>
        </Pressable>
      )}

      {showCard && (
        <CardForm
          disabled={busy}
          onPay={(fields) => pay('card', () => tokenizeCard(fields.number))}
        />
      )}

      <View style={styles.status}>
        {state.status === 'authorizing' && (
          <Text>Waiting on {state.method}...</Text>
        )}
        {state.status === 'confirming' && <Text>Confirming...</Text>}
        {state.status === 'reconciling' && (
          <>
            <Text>Checking on your payment...</Text>
            <Pressable onPress={retry}>
              <Text style={styles.link}>check again</Text>
            </Pressable>
          </>
        )}
        {state.status === 'succeeded' && (
          <Text>Paid. Receipt {state.intent.receiptId}</Text>
        )}
        {state.status === 'declined' && (
          <Text>Declined ({state.intent.declineCode})</Text>
        )}
        {state.status === 'failed' && <Text>{state.message}</Text>}
        {done && (
          <Pressable onPress={reset}>
            <Text style={styles.link}>start over</Text>
          </Pressable>
        )}
      </View>

      <DevSheet
        visible={devOpen}
        onClose={() => setDevOpen(false)}
        device={device}
        eligibility={eligibility}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    gap: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  summary: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    gap: 4,
  },
  total: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  muted: {
    color: '#888',
  },
  method: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#222',
    alignItems: 'center',
  },
  methodText: {
    color: '#fff',
    fontWeight: '600',
  },
  status: {
    marginTop: 16,
    gap: 8,
  },
  link: {
    color: '#0066cc',
  },
});
