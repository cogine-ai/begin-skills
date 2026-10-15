# Add the services your website needs

The static starters can be inspected locally without a hosting account. Add a service when it helps your actual website do its job. Begin includes professional guidance across hosting, identity, data, storage, payment, email, analytics, and monitoring; the release inventory identifies the concrete implementations included.

## Static website publishing

Ask your Agent to load `begin-publish`, inspect the website and destination, and read its Vercel recipe when using that host. Provider account and project setup belong to the actual deployment. Confirm existing authorization for the requested action; local preparation can continue while missing configuration is resolved.

The new project's first Vercel deployment may be production even without `--prod`, according to the [official CLI documentation](https://vercel.com/docs/cli/deploy). Inspect the actual environment instead of assuming the word “preview” from a command. A successful command, an accessible page, and a working contact action are separate results.

## Local enquiry and owner inbox

The `begin-backend` Skill contains `assets/enquiry/`, a local functional example with a visitor form, persisted records, and scoped owner access. Follow its own README for current prerequisites, commands, and limits. It uses a local teaching identity adapter and PostgreSQL-compatible local persistence; it is not an already-connected Clerk or Neon deployment.

### Agent appendix

Locate the installed `begin-backend` Skill. Copy the example into a new working directory, excluding installed dependencies or private local data if present. Do not overwrite an existing project. Assign the actual new directory to `BEGIN_ENQUIRY_WORK` and run:

```sh
node --version
npm --prefix "${BEGIN_ENQUIRY_WORK}" ci
npm --prefix "${BEGIN_ENQUIRY_WORK}" run setup
npm --prefix "${BEGIN_ENQUIRY_WORK}" test
npm --prefix "${BEGIN_ENQUIRY_WORK}" start
```

The example requires Node 24; setup creates two synthetic local owners and prompts for passwords without echoing them. If the Agent lacks an interactive terminal, follow the example README's `--passwords-stdin` setup path using synthetic credentials. Its documented default URL is `http://127.0.0.1:4317`; read actual process output. The visitor pages include `/s/northstar` and `/s/fieldwork`; the owner inbox is `/owner`. Use controlled test records. Do not put setup passwords in command arguments or shared logs.

The example keeps local owner credentials and PostgreSQL data under `.local/`. Read its actual configuration and keep that directory private. Test invalid input, missing credentials, wrong-owner access, and persistence after restart. Read the real test results; this guide does not claim they ran on your host.

## Adapting to hosted services

For a one-time purchase, `begin-services` includes [a complete worked integration method](../../../begin-services/references/one-time-checkout.md): a fictional tutor's workshop, purchaser/merchant identity, durable purchase and access, uncertain creation, repeated events, and controlled checks. It supplies the contract and integration method; a connected checkout and authentic payment execution remain distinct verification work.

For a real inbox, connect owner identity to verified sessions, use a durable database appropriate to the runtime, and verify record authorization. Review storage, deletion, abuse handling, transport, and logging before using real visitor content. A serverless static deployment cannot preserve a local example's filesystem simply by uploading it.

The reference SaaS stack uses Clerk, PostgreSQL/Neon, Stripe, S3-compatible storage/R2, PostHog, and Sentry for relevant tasks. Existing website choices may be more suitable. These services are guidance paths, not bundled working integrations. Follow the current official SDK/runtime documentation and check each implemented flow. Saved enquiries, email notifications, checkout, entitlement, and analytics have separate outcomes and ownership.
