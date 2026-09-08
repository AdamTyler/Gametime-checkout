# Gametime Checkout

Expo React Native checkout screen with platform and cart aware express payment methods, a validated card form, and a mock payment service that survives the app being backgrounded or force-quit mid-payment.

## Running it

**Prerequisites:** Node 20+, Xcode simulator and/or Android Studio emulator.

```bash
npm install
npx expo start     # then `i` for iOS, `a` for Android
```

**Platforms tested:**

## Repo layout

| Path | What lives there |
| --- | --- |
| `src/domain/` | Pure logic for eligibility, card validation, payment state machine |
| `src/payments/` | Stubbed wallet SDKs and capability probes |
| `src/api/` | Shared contract types and the typed HTTP client |
| `src/devtools/` | Environment override sheet |
| `src/ui/` | Screens and components |
| `server/` | Mock payment API |


## Eligibility


## Mock API contract


## Payment state


## Tradeoffs


## What I'd do differently with more time


## AI usage

See [AI_USAGE.md](./AI_USAGE.md).