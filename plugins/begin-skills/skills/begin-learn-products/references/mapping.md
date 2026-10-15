# Mapping and transfer

## Choose references that answer the question

For a consultant's website, study how a visitor understands the offer, evaluates relevant work, and starts a conversation. A large enterprise dashboard may offer useful form behavior but poor guidance for the public site's page structure.

For a lightweight product, distinguish acquisition from use: the marketing page explains a task; the working product handles it. A polished landing page does not demonstrate the product's setup, empty state, failure recovery, or owner controls.

One product can answer a focused question. A comparison is useful when alternatives make different tradeoffs, such as showing all projects immediately versus grouping them by service. Avoid collecting more brands after the relevant distinction is already clear.

## Map pages by their job

Navigation labels alone are not information architecture. Record the visitor's question, the content that answers it, and the next action. Identify whether an item is a page, anchored section, dialog, or state of the same task; don't turn every screenshot into a route.

Use a compact map when useful:

| Page or state | Role and entry | Question or task | Visible content and action | Evidence and limit |
| --- | --- | --- | --- | --- |
| Services | Visitor from navigation | Does this person solve my problem? | Scope, examples, contact link | Inspected page; contact outcome not exercised |
| Project detail | Visitor from a project tile | How does this work relate to my need? | Context, decisions, selected work | Supplied screenshot; dialog behavior unknown |
| Enquiry confirmation | Enquirer after submission | Was my message accepted? | Acceptance and next step | Documented state; storage and delivery unknown |

The rows are illustrations, not facts about a named website. Omit unneeded columns or use prose for a small scope.

## Trace the core flow and its states

For the task under study, explain:

- **Trigger:** what the person wants and where they enter.
- **Steps:** the material choices and actions, including where information or permissions are required.
- **Result:** the observable completion and useful next action.
- **Alternates:** an observed or documented path such as changing a selection, returning, canceling, or recovering from a failed action.

Keep a visible control separate from proven behavior. A “Book” button may navigate to a scheduling service, open a form, or request a call. Clicking it within authorized read-only inspection can establish its destination or UI transition; a reservation requires stronger evidence. Describe the exact behavior seen.

Record visible state distinctions when they change the design: no content versus no matching result, validation failure versus server failure, forbidden versus signed out, accepted request versus confirmed booking. If an unseen state is needed for the owner's proposed product, label it a design requirement rather than a reference finding.

## Connect roles and information without inventing internals

For each material action, identify actor, input, visible result, and the information a proposed implementation would need. Distinguish public content, visitor input, private owner records, and account state only where the task uses them.

For example, a public appointment selector may visibly collect service and time. This supports a proposal that an appointment request needs those values; it does not establish the vendor's schema, capacity rules, authorization, or payment settlement. Official documentation can describe those rules; supplied code can show their implementation; runtime inspection can exercise a permitted path. Keep the claims at the level the source supports.

In a comparison, similar words may name different things. State the actual task before aligning “project,” “account,” “customer,” or “booking” across products. Do not merge roles or payment flows merely because their screens look similar.

## Turn observations into an original proposal

For each useful pattern, explain:

1. The evidence and the visitor problem it addresses.
2. The tradeoff: what it makes easier and what it costs in content, attention, or steps.
3. The owner's corresponding need, and the minimum adaptation required.

For instance, a work-led homepage helps a portfolio with strong original images; a service-led opening may work better when visitors must understand an unfamiliar offer. A gated interactive demo needs a reason to ask for an account; a simple public demonstration may explain the same task with less effort. Make the decision from the owner's content and flow, not from the prestige of the reference.

A proposed structure brief can contain the purpose, a compact page map, the main flow, essential role/data distinctions, relevant states, and a short source list. Mark owner-approved choices, recommendations, and unresolved questions distinctly. Reuse an existing project brief when available; no fixed filename or separate report is required.

Finish with an evidence check: which screens or transitions were actually inspected, which behavior comes only from documentation or code, and which choices are newly proposed. A screenshot study is useful even when live access is unavailable, provided the brief does not imply broader verification.
