---
name: begin-architecture
description: Define or revise the domain model, module boundaries, data ownership, and dependencies of a website or lightweight product. Use when an architectural decision, substantial feature, or refactor needs a concrete design grounded in the existing project.
---

# Begin architecture

Make the important rules easy to locate, change, and verify. Start with the product's actual task and the code that already exists. A static website may need only a clear content structure and a small interaction; a new server, framework, abstraction, or platform needs a concrete reason.

## Ground the decision

Identify the requested outcome, the affected flow, and constraints that would change the design: roles, private data, payment ownership, external services, deployment limits, or compatibility. Use the owner's terms. Separate the website owner, visitor, and their customer when those are different people; distinguish payer and payment receiver when money moves. Resolve an ambiguity only when it changes the next decision.

For an existing project, inspect its instructions, domain definitions, relevant decisions, dependencies, and the actual entrypoints for the affected flow. Trace a representative request or user action through the code to its observable result. Cite the files that establish the current design; distinguish source behavior, runtime observations, and assumptions. Inspect history only when it explains a material constraint or disputed decision.

For a new project, use one concrete happy path and the failure or alternate actor that could invalidate it. Missing evidence is an open question, not a reason to invent infrastructure.

## Choose a useful boundary

Read [domain, boundaries, and change](references/boundaries.md) when deciding where rules and dependencies belong or planning a structural change.

Give each important rule and durable record an owner. Keep related rules together behind an interface that callers can understand without knowing the storage, transport, or provider's details. An interface includes inputs, outputs, permissions, ordering, and failure behavior, not just a type signature.

Reuse a boundary when it already serves the task. Introduce an adapter, layer, or shared module when it contains a real source of variation, protects an important trust or failure boundary, or removes demonstrated duplication. A wrapper that merely renames a call creates work without hiding meaningful complexity.

When a consequential choice is unresolved, compare the plausible options against this project's constraints: maintenance and change cost, dependencies, data movement, failure recovery, and deployment. Recommend the smallest design that fulfills the requested behavior. State what evidence would make a deferred option useful; avoid preparing for hypothetical scale.

## Deliver a change someone can use

Make the answer proportional to the decision. Usually it needs:

- The current or proposed flow, including roles and the owner of each important rule or record.
- The affected modules and interfaces, with evidence paths for an existing project.
- The chosen design, the material tradeoff, and any unresolved assumption.
- The next change and the observable checks that would establish it works.

Use the project's existing documentation when a durable record is useful. Record a separate decision only when the tradeoff is costly to reverse or its rationale would otherwise be lost; do not create a glossary, ADR directory, diagram, or specification merely to complete a template.

For an implementation request, change only the affected path. Preserve existing behavior and data, plan compatibility or migration where needed, and verify through the public interface. Report what was inspected, changed, and actually exercised. An architecture discussion alone does not require code changes or a new project structure.
