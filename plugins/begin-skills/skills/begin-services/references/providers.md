# Service choices and boundaries

Use the website's requirements and existing providers. The following choices reflect Begin's reference stack; they do not mandate a stack for every website.

| Need | Useful starting point | Implementation boundary |
| --- | --- | --- |
| Publish a static or compatible website | Existing host; Vercel for an undecided compatible website | Confirm project, environment, uploaded directory, and actual public/access status |
| Sign-in and owner identity | Clerk for the reference SaaS path | Verify identity server-side, map the website's owner/workspace, and enforce record access |
| Durable application records | PostgreSQL; Neon as a reference provider | Select runtime-compatible connections, versioned migrations, least-privilege credentials, and recovery |
| Private file bodies | S3-compatible storage; R2 as a reference provider | Store metadata/ownership separately, bound uploads, and control private reads |
| Payment | Stripe or the owner's existing appropriate path | Identify payer and receiver, verify server events, and separate Begin billing from the website owner's customer payments |
| Transactional email | An appropriate existing sending provider | Confirm sender/domain configuration and separate submission, provider acceptance, and delivery |
| Product learning | Deliberate PostHog events when needed | Define the question, event, actual denominator, collection choice, and limits |
| Engineering diagnosis | Sentry or existing monitoring | Minimize sensitive data, set sampling deliberately, and check the deployed release's actual errors |

## Establish the integration target

Identify the requested behavior, existing provider/account/project, intended environment, configured client/server boundary, and evidence of completion. A booking link or existing checkout may already supply the requested capability. Preserve supplied connections and IDs; schema work using an existing database does not call for provisioning another one. An expired login is a connection problem to resolve, not a reason to create a replacement account.

Read the selected provider's current documentation and supported tools for the actual SDK/runtime. Record configuration names without their values. Keep provider behavior behind a small boundary when it prevents repeated, inconsistent logic; avoid a generic adapter for every capability before a real feature needs one. Use an appropriate controlled environment for a new integration and preserve existing live configurations.

## Decisions that change the implementation

- **Identity:** distinguish a personal owner from team membership. Decide where verified identity maps to business ownership, how revoked access takes effect, and which server operations need that decision. Do not add organization onboarding to a personal website by habit.
- **Database:** keep the project's driver and migrations. Check whether the runtime and administrative operations require different connection modes; verify ownership through the application's real role. A successful connection does not verify the query or tenant boundary.
- **Storage:** decide whether a body is public or private before choosing its URL. Issue private access after an ownership check; coordinate metadata, upload failure, deletion, and expiry.
- **Payment:** name the payer, payment receiver, purchased benefit, and authoritative business record. A redirect can show a next step; verified provider events and durable local changes establish a paid state. Handle duplicate and reordered events without repeated benefits or charges.
- **Email:** distinguish saved submission, provider acceptance, and delivery. Confirm sender/domain configuration and test a controlled destination. Persist enough operation identity to inspect an uncertain send before sending again.
- **Analytics and monitoring:** define the decision or error being investigated, permitted fields, and collection choice. Avoid visitor messages, credentials, and full request bodies. Begin usage feedback and website visitor analytics have different purposes. An SDK present in a bundle does not establish that events arrive with the intended release or masking.

## Setup failures and uncertain outcomes

For non-interactive tools, inspect required arguments and supported output before execution. A blocked terminal prompt is unfinished setup. Read the exit status and structured result; a provider ID or accepted request can represent pending work. Continue that operation using its retained identity and supported status check.

Treat failed authentication, permission denial, rate limits, invalid configuration, and an unknown operation outcome differently. Restore the expected authorization or correct inputs for the first cases; use the provider's documented retry guidance for safe rate-limited work. After a timeout that may follow a send, charge, or creation, query the existing operation or use supported idempotency. Do not repeat an effect merely to discover whether the first one succeeded.

Keep successful setup and identifiers when a later step fails. Report the working path, remaining blocker, safe local preparation, and the next concrete verification. A mock establishes application behavior under its simulated response; it does not verify the provider account, permissions, delivery, or billing state.

## Scope of the supplied recipes

The supplied local enquiry example covers its actual runtime, persistence, and teaching identity adapter. Its README and checks describe those implemented paths. Hosted identity/database integrations, object storage, payments, email, analytics, and monitoring need implementation and environment-specific verification when a website requests them. A future recipe must carry its own setup, usage example, meaningful checks, and limits.

Official entry points: [Vercel](https://vercel.com/docs), [Clerk](https://clerk.com/docs), [Neon](https://neon.com/docs), [R2](https://developers.cloudflare.com/r2/), [Stripe webhooks](https://docs.stripe.com/webhooks), [PostHog](https://posthog.com/docs), [Sentry](https://docs.sentry.io/), [Resend domain setup](https://resend.com/docs/dashboard/domains/introduction).
