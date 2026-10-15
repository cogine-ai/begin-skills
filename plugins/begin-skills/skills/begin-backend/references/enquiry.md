# Using the enquiry example

Resolve [the included example](../assets/enquiry/README.md) relative to this installed Skill. Read its run/setup instructions and inspect its supported commands before executing it. Copy it into the working project when the task needs changes; installed resources are the reference copy.

The example demonstrates a visitor submission, server validation, persistence, and restricted owner access. Its local credentials and storage are teaching configuration, not a hosted identity system. Use controlled fictitious submissions for checks. The supported runtime is Node 24; its scripts are `npm ci`, `npm run setup`, `npm test`, and `npm start`. Follow the README's synthetic-password stdin path when an interactive terminal is unavailable. Keep setup data out of arguments and shared logs.

## Connect the actual contract

| Action | Included endpoint and boundary |
| --- | --- |
| Submit an enquiry | `POST /api/sites/:slug/enquiries` with JSON `name`, `email`, `message`; the server resolves the recipient from the slug and rejects other fields |
| Sign in locally | `POST /api/auth/login` with synthetic local `username` and `password`; the session is carried by an HttpOnly cookie |
| Resume owner view | `GET /api/session`; use the actual verified session response |
| List or read enquiries | `GET /api/owner/enquiries` or `GET /api/owner/enquiries/:id`; server scopes records to the session's owner |
| Sign out | `POST /api/auth/logout` with the current session's `x-csrf-token` |

The browser and API share the example's local origin. Do not copy a client-supplied owner ID into the contract. Public submission supports a UUID `Idempotency-Key`; retain the same key while retrying the same unresolved submission. Read current source and README for validation limits, response details, and supported behavior.

The example is a complete small application, not a remote endpoint provided by the pack. For an existing website, decide whether to adapt its routes into the existing server or run the copied application as the chosen local prototype. Resolve that integration before attaching a form. A separate static preview origin cannot simply post to this server: its mutation checks require the configured origin. Do not weaken those checks to make a preview work.

## Verify the implemented outcomes

Confirm these outcomes with the actual implementation:

1. A valid submission receives its documented response and creates a record.
2. Invalid and oversized input is rejected without a record.
3. A visitor cannot list private enquiries.
4. Owner access requires the configured credential; a wrong credential is denied.
5. Another owner cannot retrieve a record outside their scope.
6. Restarting with the same data location preserves records.

Keep persistence, email delivery, and booking separate in the website's wording. Attach a form only after its destination and API contract are connected. Preserve submitted text if the network request fails.

For hosting, implement and check the intended durable storage, verified owner identity, request limits, TLS, retention/deletion, and runtime configuration. A local database file cannot be assumed durable on a stateless deployment. The synthetic local credentials and teaching session adapter need an explicit production replacement before collecting real visitor content. The example does not implement email, hosted identity, or a managed database connection.
