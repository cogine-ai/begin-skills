---
name: begin-writing-docs
description: Write and revise clear English documentation from actual behavior and evidence, including short product user guides, operation manuals, tutorials, task guides, API or CLI reference, system explanations, architecture notes, decisions, and troubleshooting.
---

# Writing docs with Begin

Help the reader understand a system, make a decision, or complete a task. Produce the smallest useful document for that purpose. Preserve the project's format and vocabulary, and keep the user's technical meaning intact.

Start with the reader, their task, and the available sources. Use existing context before asking for information. Inspect the relevant code, configuration, documentation, or supplied evidence before describing behavior. Mark a proposal, assumption, or untested path where the reader encounters it. Name important actors and explain who owns data or performs an action.

Choose the document by the reader's need: a tutorial supports learning through a controlled exercise; a how-to guide solves a task; reference gives precise interface facts; explanation builds understanding. Apply the relevant parts of [technical writing methods](references/technical-writing.md). A short answer can meet a need without a new file or four-part documentation set.

Use familiar verbs, concrete nouns, and consistent technical terms. Put a prerequisite or condition before an action when it affects whether the reader should act. Split a sentence when it contains separate actions or obscures a dependency. Keep required terms, exact identifiers, units, and meaningful distinctions such as “must”, “can”, and “may”.

For architecture, distinguish responsibilities, interfaces, data ownership, and runtime boundaries. Explain the important path and the tradeoff behind a decision. Link to the evidence that supports structural claims. Use prose, a table, or a diagram according to what the reader needs to understand.

Check names, paths, flags, links, and expected outcomes against the available sources. Run a documented command only within the authorized task and suitable environment. Compare the revision with its source for changes to ownership, ordering, conditions, units, negation, and obligation. Read [meaning checks](references/meaning-checks.md) when simplifying consequential claims.

For a longer guide, check whether a reader given only the document and its stated prerequisites can complete the intended task and recognize the result. If an independent reader or fresh session is available, use it to find missing context. Otherwise report that limit. Distinguish source inspection, command execution, and reader success in the handoff.

Use the original [enquiry summary documentation example](assets/examples/enquiry-summary/README.md) when a complete manual, technical explanation, or runnable teaching example will help. It includes four document types, fictional input, failure cases, and local checks. Adapt its method to the actual project; preserve the project's real behavior.

These are original plain English methods inspired by Simplified Technical English. They preserve technical meaning without enforcing the ASD-STE100 dictionary or claiming compliance. Adapt tone to the audience; brand stories and promotional copy should retain their appropriate voice.
