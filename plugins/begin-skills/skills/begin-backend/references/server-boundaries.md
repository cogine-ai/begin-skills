# Server boundaries

## The action contract

Describe the caller, method, route, accepted content type, bounded fields, ownership, state change, and visible result. Separate business completion from an HTTP response: an enquiry may be stored while its notification remains pending. Choose response wording that reflects the state actually reached.

Reject unsupported fields when they could affect ownership or privileged state. Validate types and lengths after parsing; bound the body while reading it, including requests without a trustworthy `Content-Length`. Use parameterized SQL and structured arguments for external commands. Keep error responses useful without credentials, stack traces, provider payloads, or private records. Follow the project's distinction between invalid input, authentication failure, denied access, conflict, and an unavailable dependency.

## Identity and ownership

Authentication identifies a caller. Authorization decides whether that caller can perform this action on this record. Resolve the owner or workspace from verified identity and current access rules; a client-supplied owner ID is not authority. A public recipient slug may select which business receives an enquiry without granting access to that business's inbox.

Scope sensitive queries to the authorized owner or workspace. Check disabled accounts and changed membership where the project expects revocation to take effect. Use the project's deliberate response policy for a missing or inaccessible record, so private record existence does not leak accidentally.

Cookie-authenticated mutations need the project's CSRF protection and cookie settings. CORS alone does not authorize a caller. The included local example implements password hashing and sessions, but those checks do not establish hosted account recovery, organization membership, or production session behavior.

## Repeating an action safely

Choose a request identity before adding retries. Scope a durable deduplication key to the operation and authorized recipient, then associate it with the accepted payload and result. Reusing a key for different input should produce the project's conflict response. Enforce uniqueness in the database: checking for a previous request before inserting is vulnerable to concurrent submissions.

| Observed state | Useful recovery |
| --- | --- |
| Validation rejected the request before any effect | Preserve the caller's input and explain the correction |
| The database committed but the response was lost | Recover the stored result for the same request identity |
| The record exists but notification failed | Keep the record and expose the separate notification state |
| A provider timed out after receiving an operation | Inspect that operation using its retained ID or supported idempotency key before repeating it |

These are design choices for the feature, not extra states implemented by every sample. Use bounded retries only for safe operations. Keep database changes requiring atomicity in a transaction; avoid holding the transaction open during a remote email or payment request. When deferred processing is needed, persist the work and its state so a restart can recover it.

## Incoming provider events

Verify authenticity with the provider's official verifier before using an event to change business state. Preserve the raw body where signature verification requires it. Keep a unique provider event receipt and apply the corresponding local changes atomically, or durably enqueue processing before acknowledging acceptance. A failed handler must remain recoverable.

Do not assume delivery order. Decide whether an event can update the state directly or requires reconciling the provider's current resource. Duplicate events must not multiply records, emails, or entitlements. A browser success page does not establish a paid state.

## Files

Bound uploads while receiving them, validate the intended type, generate storage keys, and keep owner and processing state in trusted records. Treat filenames and file contents as untrusted. Private files need authorized access or bounded signed URLs issued after an ownership check. Active formats such as SVG or HTML need a deliberate sanitization or download policy. Define what happens when upload succeeds but metadata insertion fails, and how abandoned bodies are removed.

## Test the boundaries

Exercise the public interface with controlled records. Select checks for the feature's failure modes: malformed input, oversized content, anonymous access, a second owner, concurrent duplicate submission, a lost response, dependency failure, or restart. Inspect stored state as well as the response. Avoid tests that reproduce the implementation's private steps and cannot catch an incorrect business result.

Use a real controlled database when checking queries, migrations, constraints, or persistence. A mocked provider can establish the application's response to success or failure; it cannot establish that the account, credentials, webhook, or delivery path works. Report those observations separately.

Reference: [Stripe webhook behavior](https://docs.stripe.com/webhooks).
