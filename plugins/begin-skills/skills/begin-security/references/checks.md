# Practical website checks

## Establish the failure and the assessed scope

Start from the actual surface and attacker control. Trace an untrusted value to the consumer that makes it dangerous, or trace a caller to the record/action they should not control. For example: an authenticated second owner changes an enquiry ID, the query lacks an owner constraint, and the response returns the first owner's private message. That path supports a finding; the presence of an ID parameter alone does not.

For a suspected issue, record the relevant code/configuration, required conditions, observable consequence, and evidence still missing. Distinguish a reproduced failure from a plausible issue needing validation. Select the sections below for the product's actual features; absent features need no invented findings.

## Static pages and client code

Keep credentials, private data, and server-only configuration outside public assets, generated HTML, source maps, and frontend environment variables. Inspect what the actual build emits. Use text insertion for untrusted values; avoid passing visitor content into HTML or script contexts.

Use intended URL schemes for links and form destinations. Reject `javascript:` and other active content in owner-editable destinations. Uploaded HTML or SVG requires a deliberate sanitization or download policy. Check third-party scripts for a concrete need and document what they receive.

## Server and owner access

Verify identity server-side, then authorize the specific action and record. Ignore client-supplied ownership or privileged fields. Test unauthenticated access and a different owner. An unpredictable ID or hidden admin link does not enforce permissions.

Validate body type, fields, lengths, and upload limits at the server. Use parameterized queries. Set request timeouts and suitable abuse controls for public endpoints. In cookie-authenticated flows, use the project's CSRF protections and cookie security settings. CORS controls browser access; it does not replace authorization.

Keep secret values out of errors and routine logs. Log an event identifier and safe failure category instead of visitor messages, access tokens, or full request bodies. A local teaching authentication adapter needs an explicit hosted identity/session decision before handling real visitor data.

## Dependencies and services

Inspect the installed version, lockfile, advisory conditions, and reachable use before proposing a dependency fix. A package advisory does not by itself demonstrate exploitability in this website. Address the applicable version or usage without replacing the stack by habit. Scope provider keys to their actual environment and job. Verify webhook signatures before using incoming events to change entitlement or ownership.

For private files, authorize the caller before serving the body or issuing a bounded signed URL. Track owner and deletion state. Make data retention, deletion, and recovery explicit when visitor content is stored. Do not add analytics or replay to every starter; when needed, configure deliberate collection and masking for the actual product.

## AI features, when present

Treat visitor text, uploaded documents, retrieved content, and model output as untrusted. Trace where they enter prompts, tools, executable code, or rendered HTML. Prompt instructions alone cannot authorize a tool action: validate identity, resource ownership, tool arguments, and allowed effects at the server boundary. Check spend and retry limits when the feature can make paid calls.

A generic jailbreak claim is insufficient. Describe which supplied content can influence which privileged action or data, and test a controlled negative case if the task includes validation. If the website has no AI feature, leave this section outside the review scope.

## Deployment

Inspect the directory being uploaded, ignore rules, environment configuration, access settings, TLS, and the real hosting runtime. Ensure a private database or teaching credential is not included in the public deployment. Verify the destination URL and important action after deployment; command success alone does not cover them.

## Repair and report

In a review, report the concrete issue without changing the product. When a fix is requested, repair the smallest effective boundary and check the relevant failing behavior plus a legitimate action. For an ownership flaw, a useful check proves that the rightful owner still succeeds and the second owner is denied; checking only a helper's return value misses the actual route.

Report assessed, partially assessed, and unassessed surfaces with the reason. A concise finding contains location, attacker path, impact, proposed or applied change, and the check actually run. After a fix, distinguish source reasoning, automated reproduction, and observations in the configured runtime. "No findings" applies only to the examined scope. Preserve evidence locally and remove secrets and real visitor content before voluntary sharing.
