# A real local enquiry flow

A visitor submits an enquiry. The server validates and saves it in PostgreSQL through PGlite. The signed-in website owner can read only their own enquiries. This small, runnable example includes the form, private inbox, schema, migrations, authentication adapter, and actual HTTP integration tests.

Use synthetic names, addresses, messages, and passwords. This local teaching example does not send email, connect to Clerk or Neon, deploy anything, or collect telemetry.

## Start in four steps

Work from this directory with Node.js 24.x and npm installed:

```sh
npm ci
npm run setup
npm test
npm start
```

`npm ci` downloads the one pinned dependency. The other commands run locally. Setup asks for two local passwords in your terminal with input hidden. Choose a different synthetic password for each account, between 12 and 256 characters. Setup creates password hashes, refuses to overwrite existing accounts, and does not print or save passwords in plaintext.

Open **http://127.0.0.1:4317**. Submit a synthetic enquiry to Northstar Studio, then open **http://127.0.0.1:4317/owner** and sign in as `northstar`. Sign out and sign in as `fieldwork` to verify that the other owner's message is absent. Both accounts can receive enquiries; the second recipient is available in the visitor form.

Direct recipient pages are **/s/northstar** and **/s/fieldwork**. Stop the server with `Ctrl+C`. Restarting it keeps saved enquiries and unexpired sessions. Use the printed `127.0.0.1` address; `localhost` and another machine are deliberately outside this example's origin policy.

### Setup from an Agent or other noninteractive runner

A noninteractive process cannot answer the hidden terminal prompts. Run `npm run setup -- --passwords-stdin` and provide one JSON object on standard input:

```json
{
  "northstar": "a unique synthetic phrase of at least 12 characters",
  "fieldwork": "a different synthetic phrase of at least 12 characters"
}
```

Have the runner generate both values in memory and pass them to the child process through its stdin pipe. Keep them in memory only for the local browser sign-in. Do not put account passwords in command-line arguments, URLs, committed files, task reports, or diagnostic output. This option accepts at most 4,096 bytes and stores only salted hashes. The JSON shown above illustrates the format; choose your own synthetic phrases for a walkthrough. No external account or API key is needed.

### Port or controlled storage overrides

```sh
npm start -- --port 4318
npm start -- --port 4318 --data-dir /your/local-test/pgdata --owners-file /your/local-test/owners.json
```

The server always binds to `127.0.0.1`. `--data-dir` and `--owners-file` must point to local files you intend to use for this example. Run one server per database directory. This embedded database is not a shared database server and should not be opened by several processes at once.

## Files and local data

| Path                           | What it contains                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| `public/`                      | Readable HTML, CSS, and browser JavaScript; no external scripts, fonts, or images           |
| `src/application.mjs`          | HTTP routes, validation, access checks, response handling, and local rate limits            |
| `src/auth.mjs`                 | Password hashing, opaque session tokens, and cookie helpers                                 |
| `src/database.mjs`             | Migration runner and reconciliation of the allowed local owners                             |
| `migrations/001_enquiries.sql` | Versioned PostgreSQL schema, constraints, and indexes                                       |
| `scripts/setup.mjs`            | Explicit creation of synthetic local accounts                                               |
| `test/enquiry.test.mjs`        | Real HTTP tests against temporary disk-backed databases                                     |
| `.local/owners.json`           | Generated local owner IDs and salted password hashes; not distributed                       |
| `.local/pgdata/`               | Generated enquiries, account hashes, session-token hashes, and CSRF tokens; not distributed |

The account configuration is the current allowed-owner list. On restart, an omitted owner becomes inactive, their sessions are revoked, their recipient page is unavailable, and their enquiry records are retained. Changing a password hash also revokes that owner's sessions. Restoring an owner with the same ID makes their retained records available after a new sign-in. Preserve the generated ID when restoring that owner; a new ID represents a different owner. Retained inactive owners keep their unique username and site slug reserved.

Configuration reconciliation happens on startup. Editing a file while the server is running does not immediately change access. There is no account administration interface or password-recovery service. If you adapt account management, use the production identity provider rather than turning this teaching adapter into your customer account system.

The process uses filesystem persistence, not an in-memory mock. `.local` is excluded from the bundle and Git. Local database files contain enquiry text and contact addresses without application-level encryption. Stop the server before making a controlled backup. This example has no retention job, deletion API, audit history, pagination beyond the latest 50 records, or hosted backup service. For a fresh walkthrough, use a new owned test directory rather than deleting an existing database casually.

## API contract

All API responses are JSON with a `requestId`. Error responses have an `error` object containing a stable `code`, a bounded `message`, and optional field guidance. Database errors, SQL, passwords, cookies, and visitor text are excluded from diagnostics.

| Method and path                   | Contract                                                                                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/health`                 | Checks the database; returns `200` with `status: "ok"`                                                                              |
| `GET /api/sites`                  | Public active recipient names and slugs; no owner IDs or credentials                                                                |
| `POST /api/sites/:slug/enquiries` | Accepts exactly `name`, `email`, `message`; resolves the owner on the server; returns `201` with an enquiry ID                      |
| `POST /api/auth/login`            | Accepts exactly `username`, `password`; sets the session cookie and returns owner display information, `csrfToken`, and `expiresAt` |
| `GET /api/session`                | Requires a valid unexpired session; returns owner display information, `csrfToken`, and `expiresAt`                                 |
| `GET /api/owner/enquiries`        | Requires a valid session; returns only its owner's latest 50 enquiries; query parameters are rejected                               |
| `GET /api/owner/enquiries/:id`    | Requires a valid session; returns an owned record or `404`; another owner's record has the same response as a missing record        |
| `POST /api/auth/logout`           | Requires the session and matching `X-CSRF-Token`; revokes that session and clears the cookie                                        |

Every request must use the server's exact Host. Every state-changing request must send the exact same `Origin` as the server; browsers supply it for the included forms. Cross-site Fetch Metadata and foreign or null origins are rejected. A scripted API test must supply this origin explicitly. API requests do not accept an owner ID from the browser. A recipient slug selects a public business, and the server maps that slug to its stored owner.

### Enquiry request

```json
{
  "name": "Synthetic Visitor",
  "email": "visitor@example.test",
  "message": "Please tell me more about this synthetic project."
}
```

`name` accepts 1–120 characters, `email` at most 254 with basic address validation, and `message` 10–4,000 characters. Values are trimmed. Control characters, unexpected fields, invalid types, compressed input, malformed JSON, and request bodies over 8,192 bytes are rejected before insertion. Message length and body size are separate limits; non-ASCII text may reach the byte limit first.

An optional `Idempotency-Key` UUID makes a retry safe: the same normalized payload returns `200`, the same ID, and `repeated: true`. Reusing that key with a different payload returns `409`. The browser retains the key after a network failure and creates a new key when the visitor edits the form or after a successful submission.

Relevant failure statuses are `400` malformed request/query, `401` missing or invalid authentication, `403` origin/CSRF rejection, `404` unavailable recipient or unowned record, `405` wrong method, `409` changed retry payload, `413` oversized body, `415` unsupported content type, `422` invalid fields, `429` local rate limit, and `503` unavailable storage. A `429` includes `Retry-After: 60`. The UI retains message text after a failed submission and explains how to retry.

## What the example actually protects

- scrypt password hashes use fresh salts. Sign-in failures have a generic public message, including unknown usernames.
- Session tokens are random, stored as hashes, expire after one hour, and rotate on sign-in. Each owner has at most eight active stored sessions.
- Cookies use `HttpOnly`, `SameSite=Strict`, and `Path=/`. This loopback HTTP example omits `Secure`; a hosted application needs HTTPS and secure cookies.
- All owned reads derive the owner from the validated session and use parameterized owner-scoped SQL. Ownership is enforced by this application, with integration tests; this example does not configure database row-level security.
- Exact-origin checks protect every write, including public submission and sign-in. Logout also checks its session's CSRF token. Readable text is rendered with DOM text nodes, and a restrictive content security policy excludes inline or external scripts.
- In-memory limits allow 12 sign-in attempts per local IP and 20 submissions per local IP/recipient each minute. These limits reset on process restart and do not provide production abuse protection.

## Tests and verified scope

```sh
npm test
```

The suite creates owned temporary directories, starts real loopback HTTP servers on available ports, and closes and removes those temporary fixtures. It does not touch this directory's `.local`, ask for real credentials, or start a persistent background service.

Tests exercise successful saving, two-owner separation, unauthenticated and cross-owner denial, retry deduplication, malformed/oversized JSON including chunked transport, owner-ID injection, origin and Host checks using raw HTTP where needed, cookie flags, CSRF/logout, session rotation and expiry, SQL/text payloads, disk persistence across restart, idempotent migrations and changed-migration rejection, owner removal and password rotation, rate limits, unavailable-storage errors, and setup's hash-only/no-overwrite behavior.

These tests verify the local feature and its stated boundaries. They do not establish a live provider integration, production readiness, host compatibility, visual acceptance in every Agent, or customer adoption. Run the visitor and owner browser walkthrough separately when validating this resource in a host.

## Adapt it to a real product

Keep the user flow, server-side validation, explicit owner lookup, owner-scoped records, idempotency, and failure states. In the Begin default SaaS path, use Clerk for actual identity and verified server sessions, map its identity to your owned workspace, and use Neon PostgreSQL with the project's migration tooling. Derive the workspace from verified membership and authorization on every access. Re-run the two-owner and unauthenticated tests against that real integration.

Clerk and Neon are design targets here, not installed adapters. This sample uses direct SQL for a small embedded demonstration; it does not replace the default Drizzle migration direction. A production implementation also needs its actual HTTPS/cookie policy, provider-specific session/CSRF handling, durable abuse controls, privacy and retention decisions, backups/recovery, deletion and support flows, and deployment verification. Do not publish this local authentication adapter as a completed customer authentication system.

## Sources and rights

Dependency versions and integrity are recorded in `package-lock.json`. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the actual PGlite license and upstream PostgreSQL notice. The example's HTML, CSS, JavaScript, tests, and SQL are original Begin work. The commercial license and redistribution terms for original Begin resources remain undecided; the dependency notices do not grant a license for the whole Begin pack.
