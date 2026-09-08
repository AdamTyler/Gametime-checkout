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