# AI Usage

## Tools

Claude Code

## Approach

I tried to use it in places where I'd be saving time with boilerplate or for verification of my written code. I wanted to make sure 
all the actual design decisions were mine.

## Where I used it

- Verification of my API routes and their return values
- To create test suites that cover my code
- Used to reason about my payments state machine and the states that I should account for
- usePayment first pass. I knew the states but wiring is tedious. I had to make a change because the first versions wanted to hit the server every time the app came back to the foreground. But FaceID/fingerprint would be why we got backgrounded and the sheet is still there when we come back. Reconciling there would reset a flow that still live so instead we only reconcile if a confirm request was in the air.
- Wrote the signatures and the brand prefixes I wanted, had it fill in Luhn, the grouping, and the expiry math. Had it create the test suite using Stripes published test card numbers
- Used for lookup on TextInput contentType and autocomplete props rather than searching google
- Asked it to poke holes in show-on-blur for errors in my Card Form. It found an issue with an autofilled four-digit year getting truncated to a wrong two-digit year which I fixed.

## Where I deliberately didn't use it

## What I'd watch for