---
name: begin-publish
description: Prepare, publish, update, or recover a website deployment when its hosting destination, environment, audience, and runnable output must be checked.
---

# Begin publish

Publish the actual website to the intended destination with a recoverable update path. Inspect its source, build/runtime, existing host configuration, account/project identifiers, environment, and audience. Reuse those identifiers and access choices; a requested update should remain an update of the same website.

Honor authorization already given. If a missing target or audience changes what would be published, prepare the artifact and resolve that specific detail before the external operation. Use the host's supported tooling and current argument schemas; a manifest or CLI version establishes availability, not a deployed site.

## Prepare the right artifact

Read [preparation and recovery](references/preparation.md) for output boundaries, verification, and failed updates. Read [the Vercel recipe](references/vercel.md) only for that provider.

Identify which directory or built artifact the host serves and which server features it can run. Check relevant behavior before uploading. Exclude secrets, local databases, logs, test accounts, and unused pack resources from the published surface. A persistent local server needs its own compatible runtime, durable data, and real identity configuration.

## Track deployment through completion

Retain the exact returned deployment/version ID, source revision, URL, and environment. Continue that deployment while it is pending; do not submit unchanged source repeatedly. Reuse successful builds and saved artifacts while their inputs remain unchanged.

Verify the completed status using the host's supported status and preview path. Check intended audience, assets, important routes, and the central action when the tools permit it. A private preview can verify rendering; public anonymous access and completed external actions need their own evidence if claimed. Never use a changed audience as an access probe.

## Update, recover, and hand back

Preserve the last useful version and existing configuration. Diagnose a failed build, runtime exception, missing configuration, or access restriction before changing the deployment. Recover the affected environment with the provider's documented rollback when authorized; handle database and external state separately from code rollback.

Return the literal confirmed URL or the specific blocker, with concise checks and the next action. Record the revision, environment, audience, and recovery reference in the project note without credentials. Report unavailable verification explicitly rather than turning an upload into a claim about a working public product.
