import { StatusBar } from 'expo-status-bar';
import { OverridesProvider } from '@/devtools/overrides';
import { CheckoutScreen } from '@/ui/CheckoutScreen';

export default function App() {
  return (
    <OverridesProvider>
      <CheckoutScreen />
      <StatusBar style='auto' />
    </OverridesProvider>
  );
}
