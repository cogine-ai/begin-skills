# Domain, boundaries, and change

## Define the concepts that carry rules

Use the existing vocabulary and record only distinctions the task needs. A domain definition describes the business concept; storage and framework choices belong in the design explanation.

For each important concept, establish who owns it, who may act on it, how it changes, and what must remain true. Check a concrete scenario against both the owner's description and the code. A label such as `customer`, `account`, or `booking` can hide different actors or lifecycle stages.

For example, in a consultant's appointment flow:

- An enquiry is a message; it does not necessarily reserve a time.
- A booking may require a selected slot and confirmation; submitting a request is not confirmation unless the product makes it so.
- A payment request, successful payment, and refund are distinct facts. Name the payer and receiver; do not assume the website platform receives the consultant's money.

These are questions to resolve for the product, not entities every website must contain. A portfolio with an email link needs none of this booking machinery.

## Trace responsibility before choosing folders

Follow the affected flow from its entrypoint: page or command, action handler, business rule, persistent change, external effect, and returned state. Include the relevant authorization and failure path. Omit stages that do not exist.

A useful working map can be a short table:

| Responsibility | Current owner and evidence | Interface or dependency | Reason to change |
| --- | --- | --- | --- |
| Accept enquiry | Request handler and file path | Validated fields, caller identity | New field or submission rule |
| Retain enquiry | Storage operation and file path | Owned record and durable result | New retention requirement |
| Notify recipient | Provider call, if present | Delivery attempt and failure result | Requested notification |

Distinguish the business result from a side effect. If saving an enquiry succeeds but sending an email fails, decide whether the visitor's enquiry remains accepted, how the owner learns of it, and what can be retried. Do not mark a failed operation successful or erase a durable result to simplify the interface.

## Make the interface hide useful complexity

Judge a module by what callers must learn and how broadly a change spreads. A compact function can still have a difficult interface if callers must supply provider-specific fields, reproduce permission checks, or coordinate its failure states.

- Keep a business rule in one responsible location. Pages can present feedback, but duplicating the authoritative rule across clients and handlers makes changes diverge.
- Keep secrets and authoritative access checks on the trusted side of the boundary. Account identity and record ownership are separate concerns; prove both where private records are read or changed.
- Place a provider dependency where its configuration and failure behavior can be contained. Inject it when a local test or actual provider variation needs substitution; do not demand an interface for every library call.
- Prefer a public interface that expresses the product operation. Internal helpers and test seams need not become public configuration.
- Ask what happens if a proposed layer is removed. If callers regain meaningful rules or provider handling, it may earn its place. If only a forwarding call disappears, reconsider it.

For dependencies, distinguish pure computation, local I/O, remote services the project owns, and third-party services. This changes the checks: direct behavior tests, local storage integration, transport contract tests, or controlled provider failures. A mock proves the project's response to a simulated dependency; it does not prove the provider works.

## Change an existing design safely

Identify callers, records, configuration, and deployment assumptions affected by the change. Keep unrelated behavior intact. A structural refactor should not silently change permissions, field meaning, URLs, or error handling.

Use tests at the interface to preserve important behavior while implementation changes. Add lower-level tests when they explain a real invariant or failure; retain existing coverage until equivalent checks are established. Do not delete tests simply because modules moved.

For schema or interface changes, account for existing records and callers. State migration order, compatibility needs, and a recovery path proportional to the risk. For remote effects, consider timeouts, duplicate requests, and retry behavior when the actual operation needs them; adding queues or generalized orchestration is not the default answer.

When the choice deserves a durable decision, a few sentences can record the constraint, chosen design, meaningful alternative, and consequence. Reuse the project's location and format. Keep proposed and accepted choices distinct, and attach evidence or the unanswered question that could change the recommendation.
