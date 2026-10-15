---
name: begin-security
description: Assess or fix concrete website security problems involving private data, access checks, untrusted input, credentials, dependencies, or a publishing boundary.
---

# Begin security

Identify whether the request is to review, fix a reported defect, or apply relevant protections while implementing. Inspect only the surfaces the website exposes. A static portfolio, private inbox, payment webhook, and AI feature need different checks.

## Trace a concrete failure

Follow an untrusted value to its consumer, or a caller's permission to the record or external action. Identify what the attacker controls and why the actual check permits the failure. Read [practical checks](references/checks.md) for the relevant input, identity, dependency, deployment, or AI boundary.

Distinguish a demonstrated vulnerability from a plausible issue awaiting evidence. A missing header, advisory name, or theoretical prompt attack is not enough to establish impact. Explain the path using the affected file/configuration, actor, preconditions, exposed data or action, and existing controls.

## Repair and verify within the request

For report-only work, preserve the files. For authorized fixes, change the smallest responsible boundary and verify it with controlled data and the relevant negative case. Test a second owner's access, unsafe destination, malicious input, or leaked output where that reproduces the issue; do not build an unrelated audit suite.

Use the project's real identity, query role, emitted assets, and deployment settings. Preserve working providers and access restrictions. Routine implementation should gain appropriate protections without acquiring account onboarding, a new security service, or a full audit ceremony.

Keep reproductions and diagnostics free of usable secrets and real visitor content. Existing authorization governs remote changes, credential rotation, and testing against live systems.

## Report the assessed scope

Describe each finding with its location, concrete path, impact, fix, and actual validation. Mark relevant coverage as assessed, partial, or unassessed, explaining any missing evidence. "No findings" applies only to the examined scope. An inaccessible surface stays unknown; local example checks do not certify a hosted website or an entire integration.
