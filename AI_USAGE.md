# AI usage

## Tools

Claude Code, in a side panel next to the editor. It could read the repo but I did not let it write to it. Every piece of code it produced came through the chat and I pasted what I wanted

## How I used it

As soon as I started, I told it the ask and told it to come up with a high level plan of attack with timestamps so I could try and keep on task in the 3 hour limit.

While coding the assignment, I tried to use it in places where I'd be saving time with boilerplate or for verification of my written code. I wanted to make sure all the actual design decisions were mine.

## Where it did the work, and what I changed

**Project setup.** It gave me a tsconfig with `baseUrl` for the path alias. TypeScript 6 rejects that as deprecated. Removed it, confirmed `paths` alone works for both tsc and Metro.

**Server runtime.** It suggested `tsx` to run the server. I asked whether I needed it at all and it tested Node 22's native type stripping on my machine instead of guessing: works, no flag, but no enums and no parameter properties. I took the constraint to skip a dependency. Then its first server draft used a parameter property and crashed on startup so I had to fix that.

**Mock API.** The thing I kept from its draft that I wouldn't have thought of on my own is the client treating 5xx and timeouts as "unknown outcome" rather than failure. A 500 means the server fell over mid-request and might have written.

**Eligibility.** I wrote out what the function should take and return. It filled in the body and the test table. I added the two cases at exactly $100.00 and $100.01 because that's where I'd expect the bug to be.

**Payment flow hook.** I knew what the states were. The wiring is tedious so I had it draft `usePayment`. The first version hit the server every time the app came back to the foreground. But FaceID/fingerprint would be why we got backgrounded and the sheet is still there when we come back. Reconciling there would reset a flow that still live so instead we only reconcile if a confirm request was in the air.

**Card validation.** I wrote the signatures and the brand prefixes I wanted. It filled in Luhn, the grouping, the expiry math, and a test suite using Stripe's published test numbers. I checked every number against Stripe's list.

**Native input props.** Used it as a lookup for the matching `textContentType` and `autoComplete` values instead of reading both platforms' docs.

**Card form review.** I asked it to poke holes in show-on-blur for errors in my Card Form. It found an issue with an autofilled four-digit year getting truncated to a wrong two-digit year which I fixed.

**Failure paths.** Had it list the failure cases and what the fan should see in each before I built the status UI, and used that as my manual test list.

**Docs.** The tables in the README were generated. I had it review everything after written to make sure I didn't miss anything.

## Where I didn't use it

Scope. Every decision about what to cut and how small each step should be was mine, and that was most of the work.

The UI. The look of the dev sheet, the status copy, the button treatment, the stepper. I have opinions about that and didn't want a tool's.

## What I'd watch for

It builds too much by default. If I had tried to use it extensively I would've ended up with a whole library instead of a take-home feature.

Payment edge cases look right and aren't. The foreground reconcile bug was plausible code that would have reset a live Apple Pay sheet.