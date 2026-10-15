---
name: begin-backend
description: Implement or repair website server actions and APIs when a form must save data, an owner needs authorized access, or a provider event changes business state.
---

# Begin backend

Build the server behavior needed by the requested visitor or owner action. Inspect existing routes, identity, persistence, and runtime first. Extend that path rather than adding a parallel server merely to use an example.

## Decide what completion means

Name the actor, accepted input, owned record, state change, and evidence of success. A contact link may meet the request without a server. A saved enquiry needs a durable record; an email notification has a separate provider outcome. Keep those meanings visible in the API and interface.

Resolve permissions from verified identity or trusted configuration. A public recipient slug can select a business; it cannot authorize reading that business's records. Scope reads and mutations by the actor's authorized owner or workspace, including after membership or access changes.

Read [server boundaries](references/server-boundaries.md) for request contracts, concurrent retries, provider events, uploads, and failure recovery. Use only the parts present in the feature.

## Implement one complete action

Connect the actual form or caller to the route, validated input, authorized operation, persisted result, and useful response. Validate before side effects. Keep failure responses bounded, retain visitor input, and give the caller a safe next action.

Choose a retry identity before adding retries. A lost response after a committed write should allow the caller to recover the existing result. A provider timeout may leave an unknown external outcome; inspect that operation before repeating it. Use a transaction for local changes that must commit together, and keep slow remote calls outside it.

For the included visitor form and private inbox, read [the enquiry guide](references/enquiry.md) and `assets/enquiry/README.md`. Copy resources into a new working directory when adapting them. Its real local storage and teaching identity adapter do not establish hosted identity, email, or production deployment.

## Check the action and hand it back

Exercise the public route or caller with controlled records. Check the successful result, invalid input, and the failure or retry condition the change introduces. For restricted actions, check unauthenticated access and a second owner. Prefer a real test database for persistence; a mocked provider response verifies your handling, not that provider's live integration.

Hand back the working entry point, request/response contract, configuration still required, meaningful checks, and observed outcome. Separate implemented behavior from local checks, hosted checks, and steps the environment could not perform. Reuse passing checks until a change or unresolved failure justifies another run.
