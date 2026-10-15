# One-time checkout: a worked integration method

Use this example when the owner requests a one-time purchase. Adapt it to the current website and selected provider. Read the current official SDK documentation before implementation. This resource specifies a useful path and its checks; it is not an executable payment integration.

## Example task and actors

A fictional independent tutor sells one fixed-price recorded workshop. A customer pays the tutor and receives access to the recording. The tutor is the merchant and payment receiver. Begin supplies website-making resources; it is not the merchant in this example. Multi-seller payouts, subscriptions, taxes, refunds, and regional commercial terms need their own decisions when requested.

The offer, price, currency, recording, access duration, purchaser identity, and cancellation terms must come from the owner. Do not invent them. Resolve whether the recording needs a signed-in account or another supported private-access path. An email address supplied by a browser is not verified ownership.

Completion: the correct purchase becomes durable, and its verified purchaser can access the intended recording. An unpaid visitor and a different purchaser cannot obtain that private access. The return page can show a pending outcome while the server finishes checking it.

## Provider behavior to inspect

For Stripe-hosted Checkout, create the session on the server with the selected payment mode, server-owned price/quantity, and return destinations. Retain its ID and your purchase reference. [Session creation](https://docs.stripe.com/api/checkout/sessions/create).

Stripe recommends webhook-based fulfillment because a customer may never reach the return page. Delayed payments need their later success/failure outcomes. Fulfillment must tolerate repeated and concurrent calls for the same session. [Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment?payment-ui=stripe-hosted).

Verify incoming events with the supported SDK, exact request bytes, signature, and the correct endpoint secret. Do not print secret values while diagnosing failures. [Webhook endpoints and signatures](https://docs.stripe.com/events/manage-webhook-endpoints).

Retrieve the referenced session and compare the relevant state with your purchase. Use supported idempotency when retrying an uncertain creation; it complements your own durable operation identity. [Session retrieval](https://docs.stripe.com/api/checkout/sessions/retrieve), [idempotent requests](https://docs.stripe.com/api/idempotent_requests).

These references were inspected on 2026-10-09. They describe provider behavior; they do not establish a connected merchant account or completed payment.

## Original application contract

Keep the smallest records the actual feature needs:

| Record | Meaning and important boundary |
| --- | --- |
| Offer/version | The recording and terms the tutor actually agreed to sell; server-owned price and currency |
| Purchase | Verified purchaser, selected offer, amount/currency, intended merchant/environment, and stable local ID |
| Checkout attempt | The purchase, retained creation-operation identity, and provider session ID when known |
| Access grant | One grant for this purchase, recording/version, and verified purchaser; a database uniqueness constraint prevents repeated grants |
| Processing state | Enough durable progress to retry an incomplete purchase safely and explain a pending result |

Use the existing database and transaction approach. These are meanings, not mandatory table names or a requirement to add a shared billing platform. Establish the purchaser's identity at the relevant server boundary. Do not accept an arbitrary owner, recording ID, amount, or paid flag from the browser.

One possible processing sequence:

1. Load the accepted offer and verified purchaser. Establish the purchase and creation-operation identity before the external call.
2. Create or recover the corresponding checkout attempt. Save the provider ID. If the call times out, keep the same operation identity while resolving its outcome.
3. After an authentic notification or an authorized status refresh, load the matching purchase and retrieve the provider state in the intended merchant/environment.
4. Compare the purchase relationship, mode, amount, currency, environment, and required successful payment state. Handle discounted or zero-cost offers only under an explicit owner-approved rule.
5. Apply the durable purchase transition and unique access grant together. Competing processors must arrive at the same result. A processed event ID alone cannot prevent two different events from granting the same purchase twice.
6. Return an appropriate acknowledgment after durable processing. If processing fails, preserve recoverable state and use the actual provider/runtime retry mechanism.
7. Check private access using the purchaser's verified identity. The return page presents the durable result; it cannot create a paid state from a URL parameter.

This is original illustrative application logic. The project's schema, framework, actual SDK, and runtime determine the implementation. Avoid hand-written signature validation and do not turn this sequence into untested copy-paste code.

## Checks for the integrated feature

Use the provider's controlled environment with permitted test identities. Check the website and its durable records together:

- Correct offer, purchaser, receiver, amount, currency, and environment reach checkout.
- Browser price/identity tampering is rejected or ignored as specified by the server contract.
- Cancelled, unpaid, or failed attempts do not grant access. Delayed payment remains pending until its actual successful outcome.
- Invalid signatures fail without changing business records. A valid event cannot attach another merchant/environment or purchase to this one.
- Duplicate and concurrent notifications create one grant. Different event IDs for the same purchase have the same protection.
- A timeout during creation resumes the existing operation. A crash between receipt and processing can recover without creating another purchase or grant.
- Returning early, closing the browser, or visiting the return URL directly does not falsely mark the purchase paid.
- The verified purchaser can open the recording; anonymous and other-purchaser requests are denied. Restart retains the purchase and grant.

Record actual provider IDs in an appropriate private evidence artifact, with public summaries stripped of identifiers and secrets. Distinguish local simulation, controlled provider execution, and the intended hosted environment. Document any unfinished credentials, offer setup, private storage, event delivery, reconciliation, and recovery. This edition supplies the method; those execution checks remain unperformed.
