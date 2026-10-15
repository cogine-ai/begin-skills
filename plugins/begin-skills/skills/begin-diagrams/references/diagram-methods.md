# Mermaid diagram methods

## Choose a view from the question

| Reader's question | Useful view | Important meaning |
| --- | --- | --- |
| What happens next, and where does the path branch? | Flowchart | Actions, decisions, and labeled outcomes |
| Who interacts with whom, and in what order? | Sequence | Participants, messages, order, and alternatives |
| Which records relate to one another? | Entity relationship | Entities, optionality, cardinality, and identity |
| How does one object change status? | State | States, transition events, and conditions |
| What are the main parts and their boundaries? | Small flowchart with subgraphs | Responsibilities and one clearly stated relationship type |

Use another supported type when the question warrants it. Check support in the intended host before adopting newer architecture or layout syntax. A table can communicate a small mapping more clearly than a graph.

## Establish the diagram's basis

Name the subject, scope, and status in the document's caption. For an existing system, link to the relevant source, schema, or configuration. Note whether runtime behavior was also exercised. For a proposal, state important assumptions and unresolved decisions. An example should identify its fictional or illustrative status in both surrounding text and the Mermaid source comment.

For each meaningful edge, ask: what does this line mean, what evidence supports it, and what does the reader need to infer from it? A component appearing in an import list does not prove a deployed connection. Keep unknown relationships in a note or question. If an assumed connection is useful in a proposal, label it explicitly and explain the assumption.

Use one abstraction level in a view. Keep application components, external providers, and data stores distinct where they have different responsibilities. A subgraph can express a system or trust boundary when that boundary is supported by the source. Name a responsibility before choosing a provider logo or product label.

## Make semantics explicit

### Flowcharts and component views

An arrow can mean a next step, a request, or data movement. Choose a meaning and state it when ambiguity is possible. Label branches with their condition or outcome; “Yes” and “No” require a visible question. Avoid using a bidirectional line to conceal two different operations. In a component view, separate a database query from its result when the direction matters to the question.

### Sequences

Declare participants in useful reading order. Keep request and reply labels specific. `->>` and `-->>` can distinguish requests and replies under a stated convention; Mermaid accepts other arrow types, so syntax alone does not establish a synchronous or asynchronous contract. Use an asynchronous arrow only when the underlying behavior warrants it.

Use `alt` for alternatives, `opt` for an optional path, `loop` for repeated behavior, and `par` only for actual concurrency. Include a failure path when it changes the reader's decision or explains the problem. Activation bars are optional; if used, balance them across branches and match their meaning to the interaction.

### Data relationships

Verify both ends of each relationship. Exactly one, zero or one, zero or many, and one or many are different claims. Read each relation in both directions: “One website can receive zero or more enquiries; each enquiry belongs to exactly one website.” Check the model or database constraints before asserting that relationship for an existing product.

ER line style carries identity meaning: `--` is identifying and `..` is non-identifying. Choose it from the model's identity rule, rather than using line style for decoration. A required foreign key and a primary-key dependency are separate facts. Show only the attributes needed by the question and keep key annotations consistent with the real schema. Cardinality on a diagram does not prove an authorization rule or an enforced database constraint.

### States

A state describes one object's condition; an action or screen is usually a transition or separate concept. Label a transition with its triggering event and include a consequential condition. Show initial or terminal markers only where they fit that object's lifecycle. Keep forbidden or unknown transitions out of an existing-system diagram, and state intentional omissions in its caption.

## Keep source readable and portable

Use stable ASCII IDs and separate quoted labels, such as `inbox["Owner inbox"]`. Declare a node's label once. Put each node or relationship on a readable line. Keep punctuation inside quoted flowchart labels. Use clear IDs instead of reserved words such as lowercase `end`; add spaces around arrows so a node starting with `o` or `x` is not mistaken for an edge marker.

Prefer ordinary flowchart, sequence, ER, and `stateDiagram-v2` syntax when host support is unknown. Themes, icons, newer shapes, advanced layouts, and HTML labels require version-specific checking. Preserve useful styling that already works in the target document. Color should reinforce meaning that labels also convey.

For Markdown, use a fenced `mermaid` block. For an editable asset, use a `.mmd` file and link to it from the document. Keep generated SVG or PNG exports alongside their source when the user needs a shareable artifact. An image export may lose Mermaid's accessible metadata, so supply an appropriate text description in the destination.

Use `accTitle` and `accDescr` for an accessible title and explanation where the host preserves them. Keep a short adjacent prose summary regardless of renderer support. Check the final reading size and, for website use, the available container width. Split a wide view or provide deliberate scrolling rather than forcing tiny labels.

## Validate in three separate layers

1. **Meaning:** Compare actors, edges, cardinalities, states, and order with the project's sources. Resolve a contradiction or label the uncertainty.
2. **Syntax:** Run `await mermaid.parse(source)` with an available, known Mermaid version. A successful result confirms accepted syntax. Keep parser errors visible and correct their cause.
3. **Presentation:** Render in the target host or a stated local renderer. Inspect labels, connections, boundaries, contrast, and size. A local preview establishes that renderer's output; the target host may use a different version or configuration.

Discover existing project or host tooling first. Keep any evaluation dependency isolated if it is needed; a diagram task should not silently add a permanent runtime to the user's website. Mermaid parsing or rendering may need a DOM or browser. Record a missing environment as unverified instead of reporting success from visual inspection of source code.

When embedding Mermaid in a website, keep the renderer's security policy appropriate for its input. The normal `strict` mode encodes HTML labels and disables click behavior. Do not loosen that policy just to fix a layout problem. Keep private architecture or visitor data out of public online editors unless the user has authorized sharing it.

## Inspected sources

Original Begin guidance and examples are based on the official Mermaid [usage and parser API](https://mermaid.js.org/config/usage.html), [flowcharts](https://mermaid.js.org/syntax/flowchart.html), [sequences](https://mermaid.js.org/syntax/sequenceDiagram.html), [ER relationships](https://mermaid.js.org/syntax/entityRelationshipDiagram.html), [state diagrams](https://mermaid.js.org/syntax/stateDiagram.html), and [accessibility](https://mermaid.js.org/config/accessibility.html).

Research on 9 October 2026 also inspected official repository source at release `mermaid@12.1.0`, commit `21f72f07ea22c0af48a3149c550654e80d8e40cb`: `packages/mermaid/src/docs/config/usage.md`, `packages/mermaid/src/docs/config/accessibility.md`, and `packages/mermaid/src/docs/syntax/entityRelationshipDiagram.md`. The examples use basic syntax; compatibility still depends on the destination renderer. No third-party diagrams or implementation code are bundled here.
