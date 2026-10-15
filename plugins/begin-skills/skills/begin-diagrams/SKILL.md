---
name: begin-diagrams
description: Create, revise, and check Mermaid diagrams that clarify website flows, system interactions, architecture, data relationships, or state changes, using project evidence and an appropriate renderer.
---

# Begin diagrams

Use a diagram when relationships, branches, timing, or state changes are easier to understand visually. A short explanation or table is often enough for a simple fact. Choose the diagram from the reader's question, rather than adding one to every task.

Establish the subject and evidence first. Inspect relevant code, schemas, documentation, or supplied facts. Mark the result as current, proposed, or illustrative. Keep assumptions and unknown relationships visible. An attractive diagram must not turn an unverified design into an architecture fact.

Read [diagram methods](references/diagram-methods.md) for type selection, semantics, compatibility, and validation. Read [original examples](references/examples.md) when a small starting point helps. Adapt their structure to the actual question; their fictional relationships describe no existing project.

Keep one main question per diagram. Use stable IDs, concise reader-facing labels, and a consistent level of detail. Label consequential edges and branch conditions. Show actors and ownership boundaries when they change the meaning. Split an overloaded diagram into linked views instead of shrinking its text.

Check every relationship in words before checking syntax. For a sequence, inspect the actual message order and alternatives. For data, verify cardinality and identity rules. For state changes, label the event and any condition. Keep a short text explanation so the key meaning is available without the visual.

Validate with the available Mermaid parser or renderer, using the target host's version when known. Then inspect a rendered result for clipping, confusing crossings, contrast, and useful size. Report syntax, rendered review, and agreement with project evidence separately. If tooling is unavailable, leave the corresponding check explicitly unverified.

Deliver editable Mermaid source beside, or inside, the relevant document. Preserve existing diagrams and document conventions where useful. Keep source references and assumptions close enough to update when the underlying system changes.
