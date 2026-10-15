# Accounts, payments, and private data

These are professional extension capabilities in Begin. Choose them for a concrete website task. The supplied local examples and provider methods have different levels of implementation and verification.

## Choose the outcome

| Request | Useful path | What completion means |
| --- | --- | --- |
| Let visitors contact me | Existing contact destination, or a saved-enquiry form | The configured destination opens, or the actual server stores the agreed message. |
| Let me read messages privately | Verified owner identity and record authorization | The intended owner can read their records; anonymous and other-owner requests cannot. |
| Add sign-in | The project's identity provider and server session boundary | Login, signed-out, expired/revoked access, and required server actions work in the selected environment. |
| Let a visitor pay for a defined benefit | Existing purchase destination or a selected checkout integration | The correct payer/receiver and offer are represented; payment and durable fulfillment are independently checked. |
| Store private files or records | Appropriate database/storage and ownership boundary | Authorized access, denied access, persistence, change, deletion/retention, and recovery match the task. |

An external link can fulfill a navigation requirement. It cannot establish delivery, a completed booking, or a paid state. State the agreed result before integrating more infrastructure.

## Included now

The local enquiry example in `skills/begin-backend/assets/enquiry/` contains a visitor form, versioned schema, persistence, owner sessions, and owner-scoped inbox. Its own README provides setup and positive/negative checks. The local identity adapter uses controlled teaching accounts. It does not connect Clerk or another hosted provider.

The professional references include provider choice, identity-to-owner mapping, durable facts, migrations/recovery, private file boundaries, verified payment events, and uncertain-effect handling. The [one-time checkout worked method](../../../begin-services/references/one-time-checkout.md) specifies an original tutor purchase, access boundary, repeat handling, and meaningful checks. [Service recipes](SERVICE_RECIPES.md) identify the actual runnable example and selected provider guidance. These are resources for building a requested extension; hosted accounts, checkout, and storage are not preconfigured.

## Complete one extension at a time

For the selected task, the Agent should:

1. Reuse the current project, provider, and accepted requirements. Clarify only a missing fact that changes behavior.
2. Describe the minimum flow, actors, data, important failure states, and observable completion. Keep existing project documents when adequate.
3. Implement one integrated path with suitable controlled records and the actual runtime. Mark illustrative or simulated provider results.
4. Exercise success, relevant denied/error cases, repeated or uncertain effects, and continuation after change. Verify durable facts where needed.
5. Record the result and remaining setup in `BEGIN.md`, with detailed evidence in the appropriate project artifact.

Depth scales with the task. This is not a mandatory questionnaire or a reason to apply every extension to a static site.

## Verification record

| Capability | Existing evidence | Next distinct proof |
| --- | --- | --- |
| Local owner accounts | Enquiry HTTP/browser checks cover sign-in, sessions, revocation, and separation | Actual selected provider identity and session behavior in the website |
| Local private records | Save/read, second-owner denial, anonymous denial, and restart persistence | Agent integration into an existing website, hosted role checks, and relevant recovery |
| Payment | Selected integration methods; no account or payment execution | Controlled checkout, authentic provider events, durable result, duplicates, delayed outcomes, and recovery |
| Hosted private data/files | Ownership and lifecycle methods | Actual role/runtime, authorized/denied paths, persistence, deletion/retention, and restore |

Read [Status](STATUS.md) for edition-specific observations. A local passing example does not establish a hosted integration. Each added recipe should include its prerequisites, example, checks, errors/recovery, and limits. Improve from the actual task failures; a generic platform is not required.
