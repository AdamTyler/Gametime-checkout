import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Device } from '../domain/eligibility';

// If there is no key, use what we get from the device instead
export type Overrides = Partial<Device>;

const Ctx = createContext<{ overrides: Overrides; setOverrides: (o: Overrides) => void }>({
  overrides: {},
  setOverrides: () => {},
});

export function OverridesProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Overrides>({});
  return <Ctx.Provider value={{ overrides, setOverrides }}>{children}</Ctx.Provider>;
}

export const useOverrides = () => useContext(Ctx);