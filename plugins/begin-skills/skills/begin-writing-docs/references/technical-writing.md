# Technical writing methods

## Start with a reader and a result

Identify what the reader needs to do or understand, what they already know, and the environment they have. Reuse the request and project context. Ask only for an unknown that changes the document, such as the supported operating system or whether an interface is current or proposed.

A useful brief can be one sentence: “A website owner with Python installed can count enquiries from a local JSON file and recognize an invalid input.” This identifies a reader, a task, and a result to check. It does not require a questionnaire or a new planning artifact.

Lead with the action, conclusion, or system purpose. Give headings that a reader can find by their task. “Count one site's enquiries” is easier to find than “Advanced usage”. Keep detail that enables a correct decision or action; move other detail to a nearby link.

## Choose the document for the need

| Reader's need | Useful form | What to include | What usually gets in the way |
| --- | --- | --- | --- |
| Learn an unfamiliar tool by doing | Tutorial | One achievable exercise, a known starting point, early visible results, observations | Optional branches and a long theory lesson before the first result |
| Complete a known task | How-to guide | Goal, prerequisites, necessary actions, checks, relevant recovery | Requiring the reader to repeat a lesson they already understand |
| Look up exact behavior | Reference | Interface names, inputs, defaults, constraints, outputs, errors, version basis | A narrative that hides a default or leaves a field undefined |
| Understand relationships or a tradeoff | Explanation | A system model, cause and effect, boundaries, rationale, serious alternatives | A list of commands without explaining why the behavior follows |

These distinctions adapt the official [Diátaxis method](https://diataxis.fr/). They help choose content; they do not require four folders, four documents, or a fixed writing order. A small manual may combine task instructions and a compact reference. Keep their headings distinct when the reader needs to switch between doing and looking up facts.

### Tutorial

Pick one reliable path through a meaningful exercise. State the starting directory and prerequisites. Use literal commands and fictional inputs that the reader has. Show what to notice after each meaningful action. Make repetition possible when the underlying operation permits it. A learner should be able to identify a successful result before exploring alternatives.

When an action changes several fields or a difficult state, show a concise recognizable result beside the instruction. An example view can make the same object's identity, changed values and retained content easier to check than prose alone. Keep it faithful to the operation; label an illustrative result and distinguish it from an observed action.

### How-to guide

Assume the reader has a goal, not complete product knowledge. Give only the background needed to act correctly. Put a condition before its dependent action. Identify effects before an operation that replaces files, changes records, publishes content, or creates a paid resource. Include the smallest useful recovery route.

In a short interface guide, use the field and action names shown in the product. When an exercise needs related values, supply one complete small example with each value labeled for its field. Keep the instructions and expected results in a stable reading order. Contents navigation helps returning readers find an operation, but should not postpone the first useful instruction. Check the example against the current behavior before presenting it as a successful path.

### Reference

Describe the actual contract at the applicable version. Cover required and optional fields, types, units, valid values, defaults, ordering when significant, error behavior, and relevant limits. Define empty, absent, unknown, and failed separately when the interface treats them differently. State whether a value is reported by an input, computed, or independently observed.

Inspect long identifiers and examples at a phone reading width. Keep each field, example and meaning visibly associated; stacked entries can work better than forcing a dense table into narrow columns. A walkthrough needs nearby action and result cues, while a lookup section needs exact values that remain easy to find.

When related values belong to one sample record, give that record an inspectable structure. A long sentence listing several records makes it hard to find one ID and verify all its fields together.

### Explanation

Explain the path relevant to the question. Identify actors, responsibilities, interfaces, data ownership, and runtime boundaries. Explain the reason for a choice and the consequence of the serious alternative. A request path or a small table may communicate this better than a full system overview.

## Build claims from sources

Inspect the source that owns each consequential claim: a parser for accepted input, a schema for record shape, a handler for runtime ordering, deployment configuration for environment names, or observed output for a command result. Existing prose helps locate the source; it may have drifted.

Keep an informal claim-to-source map when it helps. For a small edit, comments or a short handoff are enough. For a durable reference, link to the relevant source and identify a release or revision when behavior is version-sensitive.

| Basis | A claim it can support | A limit to keep visible |
| --- | --- | --- |
| Code or schema inspection | This parser accepts these fields | The deployed environment may differ |
| Configuration | This provider is selected | Credentials and live integration may still fail |
| Local command or test | This exercised path returned this result | Other inputs and environments remain unchecked |
| Exported status | The record reports `delivered` | Recipient receipt has not been independently observed |
| Proposed design | The proposed server will own validation | Current behavior is not established |

Label an inference and its basis. Leave an unknown relationship unresolved. Do not turn a diagram arrow, a configured integration, or a successful syntax check into stronger behavioral evidence.

## Simplify language without changing meaning

- Name the actor when responsibility matters: the browser submits, the server validates, the owner reads.
- Use a consistent term for a concept. Keep exact API names, paths, flags, and UI labels. Define an unfamiliar term briefly; reuse the project's vocabulary.
- Prefer concrete nouns and direct verbs. Replace an unclear pronoun with the thing it refers to.
- Keep a prerequisite or condition attached to the correct action. Preserve event order and retry behavior.
- Preserve quantities, units, limits, negation, and obligations. “May retain” and “retains” are different claims.
- Separate an instruction from its reason when that makes the action easier to find. Keep the expected result close to the step.

Sentence length is a diagnostic aid. A shorter sentence can still omit an essential condition. Use natural connectors such as “because”, “so”, and “if” to retain relationships. Compare risky edits with [original meaning examples](meaning-checks.md).

## Architecture, decisions, and troubleshooting

For architecture, distinguish an import from a runtime request, authentication from authorization, and a local process from a provider or background task. Describe interface constraints: inputs, ordering, configuration, errors, ownership, and relevant limits. State whether the explanation describes current, proposed, or illustrative behavior.

A decision record needs the problem, constraints, chosen approach, serious alternative, and consequence. Record a consequential decision when it needs durable context; a routine edit does not always need a separate document.

Troubleshooting begins with an observable symptom. Give a narrow diagnostic, the meaning of each relevant outcome, and the next action. Preserve the reader's work before an operation that can replace it. Avoid a reset as the first response to an unexplained failure.

## Check the reader's outcome

Execute documented commands in the stated environment when the task authorizes it. Check working directories, placeholders, links, stdout versus stderr, exit status, and observable results. A procedure should show how the reader knows the task is complete. A reference should agree with the implementation even on empty input and invalid input.

For a longer guide, give a fresh reader only the document, the stated prerequisites, and a concrete task. Ask them to complete it and identify the result. Observe where they need undisclosed context. If only self-review is available, state that limitation. Do not describe an author-run command as an independent usability result.

The [runnable example](../assets/examples/enquiry-summary/README.md) provides a complete local exercise, operation manual, interface reference, technical explanation, and behavioral checks. Its documentation is original. It is an example to inspect and adapt, not a required project structure.

## Sources and method boundary

This method draws on official [Diátaxis tutorials](https://diataxis.fr/tutorials/), [how-to guides](https://diataxis.fr/how-to-guides/), [reference](https://diataxis.fr/reference/), and [explanation](https://diataxis.fr/explanation/). The examples and software-specific checks here are original adaptations.

ASD-STE100 is a controlled-language standard with writing rules and a dictionary. This Skill uses selected clarity principles: clear actors, stable terminology, direct instructions, and meaningful conditions. It does not provide the controlled dictionary, implement all rules, certify compliance, or imply ASD endorsement. A formal STE requirement needs the official standard and qualified review. Expressive brand writing can retain its appropriate voice. See the official [ASD FAQ](https://www.asd-ste100.org/STE_faq.html) and [tools guidance](https://www.asd-ste100.org/software.html).

Sources reviewed on 9 October 2026. Diátaxis pages were directly retrieved. The ASD guidance was available as indexed official page text; direct retrieval returned HTTP 403. No complete STE compliance audit was performed.
