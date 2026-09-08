import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PaymentMethodId } from '../api/contract';

const KEY = 'checkout.inflight';

// written the moment an intent exists and cleared when it settles
// if we have this here on launch we may have charged someone and not heard back
export type Inflight = { intentId: string; method: PaymentMethodId };

export const inflight = {
  save: (v: Inflight) => AsyncStorage.setItem(KEY, JSON.stringify(v)),
  clear: () => AsyncStorage.removeItem(KEY),
  load: async (): Promise<Inflight | null> => {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  },
};