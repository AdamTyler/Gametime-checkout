# Gametime Checkout

Expo React Native checkout screen. The payment methods you see depend on what platform you're on, what's set up on the device, and how much you're spending. There's a card form with real validation, and a mock payment API that the app can recover against if it gets backgrounded or killed mid-payment.

## Running it

You need Node 22.18 or newer and an iOS simulator or Android emulator.

```bash
npm install
npm run server      # mock payment API on :4000, leave it running
npx expo start     # then `i` for iOS, `a` for Android
```

`npm test` runs the domain tests and `npm run typecheck` checks both the app and the server.

Tested on the iOS simulator (iPhone 16, iOS 18). I ran a quick happy path test on an Android emulator.

If running on a physical device you may need to modify the HOST in `src/api/client.ts` to your machines IP.

**note: There is a secret Overrides menu that is accessed by longpressing the 'Checkout' title. This will allow you to test all platforms and payment types as well as a couple failure return states from the API**

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

The rules from the prompt:

| Method | Shows when |
| --- | --- |
| Apple Pay | iOS and a card is provisioned in Wallet |
| Google Pay | Android and Google Pay is set up |
| Affirm | Total is over $100 |
| Card | Always |

`evaluateEligibility(device, totalCents)` in `src/domain/eligibility.ts` is a pure function. It takes a `Device` (platform, has an Apple Pay card, has Google Pay) and the total, and returns all four methods with either `eligible: true` or a reason code: `wrong_platform`, `not_provisioned`, or `below_minimum`. I return the ineligible ones too instead of filtering, because hiding a method is a rendering decision and the reason is useful to show in the dev sheet.

"Over $100" I'm reading as strictly greater. $100.00 does not get Affirm, $100.01 does. There are tests on both sides of that line. The threshold is a constant right now with a default parameter so tests can change it. In a real app it'd come from merchant config.

Detection is in `useDevice`. Platform comes from `Platform.OS`. The wallet checks are stubs in `src/payments/stubs.ts` shaped like the real calls (`applePayCanMakePayments`, `googlePayIsReadyToPay`), async with a short delay so the "checking payment options" state is real. Since there's no actual wallet to ask, the stubs say yes whenever the platform matches. Overrides get spread on top of whatever was detected, so detection is always the default and an override only replaces the one key you set.

### The override sheet

Long press the "Checkout" title. You can force platform to iOS or Android, force the Apple Pay card and Google Pay checks to yes or no, and clear everything back to real detection. Below that it shows the effective device and each method with its reason, so you can watch a method disappear and see why.

The sheet also has a Simulate section for the wallet sheet: approve, cancel, or decline. Cancel makes the stub return nothing (like dismissing the sheet). Decline makes it return a token the server will refuse.

## Mock API

| Method | Route | What it does |
| --- | --- | --- |
| `POST` | `/v1/payment-intents` | Creates an intent. Needs an `idempotency-key` header. |
| `POST` | `/v1/payment-intents/:id/confirm` | Sends the authorization token, gets back the outcome |
| `GET` | `/v1/payment-intents/:id` | Reads the current state. This is how the app recovers. |

Everything is in memory with 400ms of fake latency and a one line log per request so you can watch it in the terminal.

### Why it's shaped this way

Create and confirm are two calls. That means the server has a record of the attempt before the native sheet ever opens, and that record is what the app reads back if something goes wrong later. If it was one call there'd be nothing to reconcile against.

Create takes an idempotency key. Same key again returns the same intent with a 200 instead of making a new one. Same key with a different amount is a 409. This is the double charge protection.

The amount is bound at create. Confirm re-sends it and the server refuses with `amount_mismatch` if the cart changed underneath. The UI also disables the quantity stepper while a payment is running, so this is the backstop, not the primary guard.

Confirm is safe to send twice. If the intent already settled, you get it back with a 200. If it's still processing, you get a 202. A client coming back from a timeout can just re-send and get the truth. The `processing` status exists specifically because there's a window between "confirm accepted" and "outcome decided", and if the app dies in that window I want the server to have something honest to say.

Card numbers never hit this API. `tokenizeCard` in `stubs.ts` stands in for the processor's tokenize call (the thing Stripe.js does) and hands back a token. The server only ever sees tokens.

The client (`src/api/client.ts`) classifies every failure as one of two things: the server answered and said no, or the server didn't answer. A 4xx is the first kind and is final. A timeout, a network error, or a 5xx is the second kind, and the request might have gone through. `ApiError.outcomeUnknown` is that flag and it's what decides whether the app retries or goes and checks.

### Failure paths

Cancelled wallet sheet: the stub returns null, the in-flight record is cleared, and you're back at idle with the buttons live. No error message because cancelling isn't an error.

Declined: the server declines any token containing `decline`. The wallet stubs produce one when the sim is set to decline, and `4000 0000 0000 0002` produces one through the card path. The UI shows the decline and lets you pick another method.

Unknown outcome: covered below.

## Payment state

```ts
type PaymentState =
  | { status: 'idle' }
  | { status: 'authorizing'; method }      // creating the intent, then the sheet is up
  | { status: 'confirming'; intent }       // confirm request is in the air
  | { status: 'reconciling'; intentId }    // we don't know, asking the server
  | { status: 'succeeded'; intent }
  | { status: 'declined'; intent }
  | { status: 'failed'; message };
```

It's a `useState` in `usePayment`, not a reducer. The states are the important part, and they're a type so the UI has to handle every one.

### Express, tap to confirmed

One tap. `pay('apple_pay', presentWalletSheet)`:

1. State goes to `authorizing`, the method buttons disable.
2. `POST /payment-intents` with a fresh idempotency key.
3. The intent id gets written to AsyncStorage. From here on, if the app dies we know to go check.
4. The stub sheet runs (two seconds, standing in for Face ID). If it comes back null, clear storage, back to idle.
5. State goes to `confirming`, `POST /confirm` with the token.
6. The result is `succeeded` or `declined`. Storage cleared, state set. There is no second submit anywhere in that path.

### Card, tap to confirmed

Same hook, same steps. The only difference is step 4: instead of a sheet, `tokenizeCard` runs on the validated number. The Pay button in the form won't enable until the number passes Luhn at the right length for its brand, the expiry parses and is this month or later, and the CVC is the right length (4 for Amex, 3 otherwise).

Validation runs on every keystroke but only shows once you've left a field. So nothing turns red while you're typing, and once you have seen an error it clears live as you fix it. Autofill from the keychain lands on a field you never blurred, so it can't trip an error, and the Pay button is gated on validity rather than on which fields you've touched, so an autofilled form is payable without tabbing through it. Focus moves to the next field when the current one becomes complete, and only on a change that completed it, so tapping back into a full field doesn't