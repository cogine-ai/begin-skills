# Frontend implementation patterns

## Structure and styles

Use landmarks, heading order, actual links, and labeled controls. Keep meaningful content readable before JavaScript runs. In a component framework, separate content/configuration from repeated presentation where it makes editing easier; do not abstract a one-off composition prematurely.

Define a small set of typography, color, spacing, width, and state tokens. Use intrinsic layouts such as flexible columns and wrapping grids. Handle long words and titles in the component that owns them. Test a narrower viewport rather than using global hidden overflow to mask problems.

Set media dimensions or an aspect ratio and useful alternative text. Decorative images have empty alt text. If media fails, keep the caption and an intelligible fallback. Lazy-load below-the-fold imagery when useful; avoid delaying the primary visible image by default.

## Make compositions shrink

Test the narrowest supported viewport and the widths just below, at, and above a breakpoint that changes the composition. For a general responsive site, use 320 CSS px as the narrow check unless the project specifies another minimum. A comfortable phone screenshot alone can miss a broken intermediate layout.

When content overflows, inspect the element and its ancestors. A grid track written as `1fr` can retain its content's automatic minimum. Where the column must shrink, use `minmax(0, 1fr)` and `min-inline-size: 0` on its grid or flex items. Apply these to the affected composition; choose fewer columns when the content needs more room.

Constrain a mockup, illustration, or media frame to its containing column, not just the viewport. Use `max-inline-size: 100%` and `box-sizing: border-box` when width includes padding or borders. Replace an unconditional fixed width with a preferred width bounded by available space. Check nested tracks, labels, and internal padding too; shrinking the outer frame does not automatically shrink its contents. Images and video can use `max-inline-size: 100%; block-size: auto` while preserving their intended proportions.

Keep necessary horizontal scrolling local to content that genuinely needs it, such as a wide data table. Repair the responsible constraint rather than hiding whole-page overflow or scaling all content into unreadable text.

## Interaction

A mobile menu trigger needs an accessible name and expanded state. Verify opening, closing, keyboard use, and focus after dismissal. Prefer native elements or the project's accessible primitives. Additional animation libraries are justified by the interaction, not by the presence of a hero section.

Measure the actual clickable area of mobile navigation, disclosure summaries, and calls to action. Aim for at least 44 by 44 CSS px for common standalone controls, with enough separation to avoid adjacent taps. Put padding on the interactive element and check its rendered bounds; padding on a surrounding noninteractive wrapper does not enlarge the target. Treat this as a comfort goal. WCAG's AA minimum criterion uses 24 by 24 CSS px with defined spacing and other exceptions; assess the actual context when making a conformance claim.

Use an existing live status region for nonurgent asynchronous feedback when appropriate. Field errors connect to their controls, and an error summary can link to affected fields. Announce useful changes without reading the whole page after every keystroke.

Render a selected object's preview, version, labels and status from the same state. Update status styling and accessible state with the text; an initial CSS class must not remain after the meaning changes. Scope status selectors to their component so decorative dot colors do not become a label's background. Check a transition in both directions and a different selected item; inspecting only the initial view can miss the mismatch.

## Forms

Define input names, types, limits, destination, and outcome. Use browser constraints for early feedback, then parse and validate the same constraints on the server. While submitting, prevent unintended duplicate actions and show progress. On failure, preserve entered text and identify whether the problem is an invalid field or an unavailable service.

Treat success as the server's actual confirmed result. An accepted queue job, persisted enquiry, delivered email, and completed booking each need different wording. A demo may illustrate these states, but mark it as a demo and keep its behavior separate from the website's real action.

Render untrusted content as text. Keep scripts, credentials, and server secrets out of generated HTML and frontend configuration. Restrict owner-supplied action URLs to intended schemes and destinations; never put arbitrary HTML into the page to make a link work.

## Performance and change review

Measure the problem before adding memoization, caching, or splitting everything. For React/Next.js work, avoid independent request waterfalls, keep server-only logic server-side, and load heavy client features only where used. Prefer the established data and state model.

After a change, run the relevant existing checks, inspect the actual preview, and exercise the affected action. Test useful edge cases such as long content, missing images, keyboard navigation, and a rejected submission. Record unavailable rendering or service checks honestly.

References: [MDN forms](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form), [MDN status role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role), [MDN minmax](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/minmax), [W3C target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [W3C target size enhanced](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html).
