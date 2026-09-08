import { Platform } from 'react-native';

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
  return `tok_wallet_${Date.now()}`;
}

// Affirm is a browser redirect in real life. Same shape here, longer wait.
export async function presentAffirm(): Promise<string | null> {
  // add delay for faceId/fingerprint (long enough to background)
  await sleep(3000);
  return `tok_affirm_${Date.now()}`;
}