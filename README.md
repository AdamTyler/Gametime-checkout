# Gametime Checkout

Expo React Native checkout screen with platform and cart aware express payment methods, a validated card form, and a mock payment service that survives the app being backgrounded or force-quit mid-payment.

## Running it

**Prerequisites:** Node 22.18+, Xcode simulator and/or Android Studio emulator.

```bash
npm install
npm run server
npx expo start     # then `i` for iOS, `a` for Android
```

If running on a physical device you may need to modify the HOST in `src/api/client.ts` to your machines IP.

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

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/v1/payment-intents` | Create an attempt. Requires `Idempotency-Key`. |
| `POST` | `/v1/payment-intents/:id/confirm` | Submit authorization, get a terminal status |
| `GET` | `/v1/payment-intents/:id` | Read current status with reconciliation after an interruption |

### Why this shape

1. Idempotency-Key on create so replaying a key returns the same intent.
2. Amount is bound at creation so we guard against cart changes in-flight.
3. Confirm is replay safe

### Failure Paths



## Payment state


## Tradeoffs


## What I'd do differently with more time


## AI usage

See [AI_USAGE.md](./AI_USAGE.md).