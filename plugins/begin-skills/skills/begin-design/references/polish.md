# Interaction and polish

## Responsive composition

Start with the content order on a narrow screen, then use wider space to improve grouping. Choose breakpoints where content actually needs them. Test long titles, narrow controls, image proportions, and opened menus. Keep text and actions inside the viewport without hiding overflow to conceal layout defects.

Make navigation useful with keyboard, touch, and pointer input. Use links for destinations and buttons for actions. A menu trigger exposes its expanded state; opening and closing should leave focus in a sensible place. Use the existing accessible component's behavior before writing a custom focus trap.

Inspect neighboring actions in their actual narrow grouping. Separate save, preparation, recovery and clearing by their consequences and readable spacing. Stack actions when wrapping produces competing heights or joined utility links. Recheck the populated and changed states as well as the empty view; fitting the viewport alone does not establish a clear relationship.

In a chronological layout, keep the date and content columns aligned for both occupied and empty rows. An empty day can be shorter while retaining a deliberate gutter and recognizable date. Inspect adjacent rows with different content; a page can fit the viewport while a date and description collide inside it.

## States are part of the design

Provide visible hover, focus, pressed, disabled, loading, and error states when applicable. A disabled control should not be the only explanation of a missing requirement. A form shows field errors next to the relevant field and preserves what the person entered. Success tells them what happened and what comes next.

Empty states describe an available action. Image failure preserves useful text and stable space. Reserve media dimensions to reduce layout shifts. Keep labels, controls, and confirmation messages consistent: an action named “Send enquiry” should produce a result describing that enquiry.

Let the empty result's emphasis fit its current purpose. Before preparation, a quiet compact placeholder can keep attention on choosing and acting. Give a real prepared artifact the space and identity it needs. Explain a shared constraint beside the inputs it governs, and place a predictable conflict near the choices that cause it.

Follow the same selected item and entered values from the initiating control into the next surface and result. A service-specific enquiry opens that service; a version-specific comment remains with that version. When an edit changes a prepared result's inputs, update the result or visibly mark it stale. Inspect the meaningful entry points and the return path, not only the default selection.

When the URL names a selected item or format, keep it in agreement with the visible choice. Change the option, then reload and inspect the restored value. Clear or replace obsolete success feedback when a later correction or reset changes the object it describes.

## Motion choices

Use short transitions for feedback, deliberate movement for opening or revealing a state, and restraint for repeatedly used controls. Animate `transform` or `opacity` where they express the desired change; avoid `transition: all` and motion that causes incidental layout changes. Place transform origins where the visual relationship makes sense.

Honor `prefers-reduced-motion`. Remove decorative loops and large movement while preserving necessary state feedback. A reveal must not leave content hidden if JavaScript fails or motion is disabled.

## Rendered design judgment

Inspect the actual rendered page at representative phone and desktop widths when tools are available. Read the whole composition before zooming into details. Identify its dominant element, the intended next point of attention, and the role of the quiet space between them. Image area, type scale, contrast, and empty space all spend attention. Decide whether they support this page's subject and action.

Read display text by meaning as well as shape. Choose breaks that preserve useful phrases and give the lines deliberate emphasis. A desktop break may need a different grouping on phone. Test the widths where the grouping changes; balancing lines is useful only when it improves the reading. Preserve spaces when spans or optional breaks reflow. Read the actual paragraphs and labels as well as the headline.

Establish visible anchors between related headings, copy, rules, images and controls. Inspect the letter edges and baselines: equal CSS boxes can still look misaligned. Use small optical corrections where the rendered relationship needs them, then recheck clipping and spacing. Choose left, center or right alignment for the content's job; maintain consistent columns for comparable dates, amounts and quantities.

Recheck wrapping and hierarchy after changing a font. Avoid shrinking an entire composition merely to retain an old line break. Increasing type or spacing can make a masthead compete with the actual offer; name the relationship that needs adjustment rather than asking for general polish.

On a phone, judge the sequence as a fresh visitor. Which useful artifact, message, or action appears first? Does repeated front matter delay it? A desktop spread may need a different grouping on a narrow screen. Preserve enough explanation for the action to make sense; there is no universal rule that every action belongs above the fold.

Read inner pages beyond their opening. Assess body measure, the scale of headings against body text, paragraph rhythm, and the first useful instruction. Contents, bylines, covers, number gutters, and tables should help orientation while leaving room for the reading itself. A beautiful homepage does not establish a coherent essay, guide, or service detail page.

Keep observations and judgments distinct. “The guide's first instruction begins at y=945 in a 390×844 viewport” is a measurement. “Repeated introductory elements give orientation too much weight” is a design judgment to support with the visible composition. Contrast, overflow, and working links establish specific checks; they do not supply an aesthetic verdict. Source inspection alone cannot establish the rendered result.

For each material criticism, explain the visible problem, its effect on this visitor, and a focused change. Offer a meaningful alternative when the tradeoff is unresolved, such as placing an overview before the first instruction or allowing the instruction to establish context first. Preserve accepted imagery, identity, and tone unless the criticism gives a concrete reason to change them. Reassess the affected composition after the edit.
