---
name: begin-frontend
description: Implement and refine website pages, reusable components, forms, responsive behavior, accessibility, and performance in the project's existing frontend stack.
---

# Begin frontend

Turn the agreed content and design into a usable website. Inspect the project, dependencies, instructions, and actual run commands first. Keep a static site static when its job needs no server; add a framework or service for a concrete requirement.

Read [implementation patterns](references/implementation.md) for structure, interaction, forms, and performance. Inspect relevant existing components before adapting them, including their dependencies, state ownership, and supported behavior. An isolated example still needs integration into the real page.

Implement the content hierarchy with semantic HTML and a small consistent style system. Use a link for navigation and a button for an action. Preserve DOM reading order, responsive navigation, keyboard access, and visible focus. Design with real text and stable media sizes.

For a changed interaction, identify its states, the component that owns them, and the event that confirms completion. Preserve behavior across route changes or rerenders when the task requires it. Keep data loading, submission, and visible feedback aligned with the project's existing model.

For selection, editable records, quantity results or local recovery, use [interaction state](references/interaction-state.md). Keep identity, saved facts, current work and exports consistent through the complete operation, including a visit to the guide and back.

For direct manipulation, selected-object editors, changing diagrams, continuous creative previews or elapsed-time controls, use [motion state](references/motion-state.md). Keep current facts, painted results, playback scheduling and portable output consistent; verify the actual visible surface after responsive changes.

For a form, define where it sends, what success means, and what happens on failure before presenting it as functional. Client validation improves feedback; server validation and authorization still enforce the contract. Keep visitor input and show actionable errors. Do not return fake success from a disconnected demonstration.

Use the existing project's runner and browser tools when available. Check the rendered change at the smallest supported width and around layout breakpoints; measure page overflow and comfortable touch targets for navigation and main actions. Keep existing content and configuration during edits. Report source, build, and rendered observations separately; mark browser checks unverified when access is unavailable. Select deeper performance work when measurements or the task justify it.

Finish with the changed surface, meaningful behavior checks, preserved choices, and any remaining limitation. Use the current project note when these facts affect continuation.
