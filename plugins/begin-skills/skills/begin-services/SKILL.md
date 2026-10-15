---
name: begin-services
description: Choose and connect external website services when a requested capability needs a provider, preserving existing accounts and verifying the actual integration outcome.
---

# Begin services

Translate the requested website behavior into the external capability it needs. Inspect existing provider configuration and preserve what already works. A booking link may meet a contact requirement; account provisioning and a booking integration are further work only when the task needs them.

## Reuse before adding

Identify the account/project, environment, current client or server integration, data being sent, and evidence of success. Reuse supplied connection strings, identity, storage, and provider IDs. Failed authentication to an existing account calls for restoring that account's access, not creating a replacement project or weakening its restrictions.

Read [service choices and boundaries](references/providers.md) for the selected capability. The reference stack is a starting point for an undecided choice, not a reason to migrate an existing website.

For a requested one-time purchase, [the checkout worked method](references/one-time-checkout.md) shows the actors, durable result, repeat handling, and checks. It is a design and integration example; no provider account or payment is included.

## Connect the chosen path

Use the actual provider tools, supported SDK, and current official documentation for that runtime. Inspect available commands and argument schemas rather than inventing a universal setup command. Keep provider-specific configuration with its real integration; a small adapter is useful when it isolates different outcomes or retry behavior.

Configure credentials in the intended server or host environment and preserve unrelated values. Report required variable names and setup steps without their secret values. For a noninteractive runner, supply the provider's required inputs explicitly and inspect structured results, exit status, and errors; a command waiting for an unseen prompt has not completed setup.

Implement and check one useful flow through the website. Verify its authorization, durable business record where needed, provider response, and visible result. Separate form receipt, email delivery, payment, entitlement, and analytics. Mocked or local examples establish their own behavior; they do not establish a live provider connection.

## Handle partial setup and unknown outcomes

Keep successful setup results and returned resource IDs for dependent steps. On a timeout after a side effect, inspect that same operation or use its supported idempotency key before retrying. Do not create another account, send another message, or repeat a charge to see whether the first operation worked.

Continue useful local preparation when credentials or a capability are unavailable. Hand back the selected service and reason, the implemented path, actual checks, unresolved configuration, and next action. Existing authorization governs provisioned resources, account changes, publication, messages, charges, and data collection.
