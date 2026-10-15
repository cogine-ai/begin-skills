# Review and repair

## Choose the evidence

Read the brief, current project note, and requested change. Find actual project scripts and the running preview. Use the host's available browser tools rather than inventing a tool name. A build, source review, rendered screenshot, and interaction check establish different things.

| Question | Useful observation |
| --- | --- |
| Can the project run? | Actual command and result, URL/process when relevant |
| Does the page communicate its purpose? | Rendered reading order and real content |
| Does the layout adapt? | Smallest supported width, breakpoint neighbors, wide viewport, actual overflow and long-content behavior |
| Can someone navigate? | Keyboard focus, menu, links, comfortable touch areas, heading/landmark structure |
| Does the main action work? | Configured destination or real server result |
| Can work continue? | Preserved files, usable edit/restart path, current project note |

## Inspect the website

Look at the main pages and opened states. Check text wrapping, contrast, clipping, spacing, media proportions, image failure, control labels, and visible focus. Use the real words and visitor action. Hover alone does not establish keyboard or touch usability.

Use the project's minimum supported width, or 320 CSS px for a general responsive site when no other boundary is specified. Check just below, at, and above breakpoints that change the affected layout. In the rendered page, compare the document's `scrollWidth` with `clientWidth`; a cropped screenshot can conceal horizontal overflow. If it overflows, inspect the protruding element's bounds and trace its fixed width, automatic grid minimum, padding, or nested content. Repair that constraint and repeat the failing widths without masking the defect with global hidden overflow.

Measure the clickable bounds of mobile menu items, disclosure summaries, and the primary action, including their open states. For common standalone controls, aim for 44 by 44 CSS px and useful separation. Inspect the clickable element rather than its text or a padded wrapper. Record actual dimensions and usability; a size below the comfort goal alone does not establish a WCAG AA failure, whose minimum criterion has its own size, spacing, and exceptions.

After changing an action's label, compare its promised result with its actual destination or handler. “Explore my work” should reach the work, while a contact action should use the configured contact target. Resolve a conflict between the requested wording and retained target before presenting the action as working. If a link changes role, remove stale contact-replacement markers that could turn it back into an email link during later configuration.

For a form, check a valid result and an invalid/failure path; preserve input and report the actual outcome. A mailto link opening, an enquiry persisted, an email delivered, and a booking completed are separate results.

For owner data, check unauthorized and cross-owner access as well as successful access. For publishing, inspect the actual deployed environment and URL. If a browser, provider, or credential is unavailable, mark the corresponding observation open; continue what can be checked locally.

## Repair without losing the work

Capture the relevant error and inspect its cause. Use a scoped diff or recoverable copy before changing existing files. Change the responsible code, configuration, or content rather than regenerating the whole site. Recheck the repaired behavior and nearby navigation/main action.

A failed screenshot tool is different from a broken page. A stopped local server is different from a failed deployment. A provider timeout may leave an unknown external outcome. Check actual state before repeating an operation.

When an existing browser suite fails, inspect its trace, console, network result, and failing state. Prefer assertions about readiness and the real user outcome over fixed delays. Reproduce a suspected intermittent failure before changing its cause or weakening the test. Use the project's actual test command; example commands from another project do not establish an available script.

## Report a useful result

Summarize the requested task, what changed, actual checks, unfinished setup, and next useful step. Keep results compact. Optional local feedback can describe where assistance was needed, but should not delay completion.

For a concrete defect, report the affected surface, observed condition, impact, repair, and recheck. A useful compact result could be: “Phone menu: links were clipped at 320px. Adjusted the menu's width constraint. Passed at 320/390px and with keyboard navigation; deployed behavior has not been checked.” Name the environment when it changes the meaning of a result.

Use `passed` only for an observed check, `failed` for an observed failure, `not_run` when no execution occurred, and `unknown` when the available evidence does not establish the result. Agent confidence is not the website owner's satisfaction. Ask for or record a reaction when useful; silence is unknown.

Target guidance: [W3C minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [W3C enhanced](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html).
