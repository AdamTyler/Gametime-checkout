import { Platform } from 'react-native';
import { onlyDigits } from '../domain/card';
import { sim } from '../devtools/sim';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// These stubs answer "yes" whenever the platform matches since we don't have a real wallet

export async function applePayCanMakePayments(): Promise<boolean> {
  await sleep(300);
  return Platform.OS === 'ios';
}

export async function googlePayIsReadyToPay(): Promise<boolean> {
  await sleep(300);
  return Platform.OS === 'android';
}

export async function presentWalletSheet(): Promise<string | null> {
  // add delay for faceId/fingerprint (long enough to background)
  await sleep(2000);
  if (sim.wallet === 'cancel') return null;
  return sim.wallet === 'decline' ? `tok_wallet_decline_${Date.now()}` : `tok_wallet_${Date.now()}`;
}

// Affirm is a browser redirect in real life. Same shape here, longer wait.
export async function presentAffirm(): Promise<string | null> {
  // add delay for faceId/fingerprint (long enough to background)
  await sleep(3000);
  if (sim.wallet === 'cancel') return null;
  return sim.wallet === 'decline' ? `tok_affirm_decline_${Date.now()}` : `tok_affirm_${Date.now()}`;
}

export async function tokenizeCard(number: string): Promise<string> {
  await sleep(400);
  const digits = onlyDigits(number);
  const last4 = digits.slice(-4);
  return digits === '4000000000000002' ? `tok_card_decline_${last4}` : `tok_card_${last4}`;
}