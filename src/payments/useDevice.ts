import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import type { Device } from '../domain/eligibility';
import { useOverrides } from '../devtools/overrides';
import { applePayCanMakePayments, googlePayIsReadyToPay } from './wallets';

// real detection with dev overrides on top
export function useDevice(): Device | null {
  const { overrides } = useOverrides();
  const [detected, setDetected] = useState<Device | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([applePayCanMakePayments(), googlePayIsReadyToPay()]).then(([apple, google]) => {
      if (cancelled) return;
      setDetected({
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        hasApplePayCard: apple,
        hasGooglePay: google,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return detected && { ...detected, ...overrides };
}