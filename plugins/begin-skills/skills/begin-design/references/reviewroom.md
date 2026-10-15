# Reviewroom: work, feedback, and a decision

Use these two original SaaS cases when a visitor must understand a workflow through its actual work and state. Reviewroom is a fictional review tool: a creative team prepares work, and a reviewer comments or decides on a version. The two cases share the same three sample items and local behavior, so their composition can be compared without changing the task.

The case names identify the external composition studies used in the original 2026-10-09 trial. The bundled sites use original Reviewroom identity, writing, HTML/CSS, JavaScript, and work SVGs. Attio and Mintlify websites, reference screenshots, and product behavior were not imported. Their recorded Mobbin URLs appear only in [provenance](../assets/reviewroom/PROVENANCE.json).

## Choose a case for the task

| Case | When it fits | Material needed | Cost to judge |
| --- | --- | --- | --- |
| **Attio study: neutral working review** | A tool whose repeated task is choosing an item, inspecting its work, and giving feedback or a decision; the customer's work should retain its own identity | Meaningful item names, versions, labeled states, inspectable work, and distinct comment/decision actions | Its centered public opening and phone item list delay the actual work; the feature grid and process section repeat similar ideas |
| **Mintlify study: explain the product through a version** | A public product page where a new visitor needs to see how a specific version, its work, and feedback belong together before trying it | One representative work artifact, corresponding feedback on that exact version, and a real destination for the preview | The offset desktop window leaves empty space below the copy; the arc and sparse feedback pane need to earn that space |

Choose one main composition for the brief. If the new product has no useful work artifact or version-specific feedback, reconsider the premise before reusing these surfaces. Color, type, and window chrome alone cannot explain a workflow.

## Look at the included images

View the matching case's three captures with the host's image-viewing tool before adopting its decisions. These are unchanged final local renders at desktop 1440×1000 and phone 390×844, captured at the top of the page. The homepage shows Welcome email v02 with its initial sample feedback; the demo opens Landing page v03 in its empty-feedback state.

| Case | Desktop home | Phone home | Desktop demo |
| --- | --- | --- | --- |
| Attio study | [Opening](../assets/reviewroom/attio/captures/home-desktop.jpg) | [Opening](../assets/reviewroom/attio/captures/home-phone.jpg) | [Working interface](../assets/reviewroom/attio/captures/demo-desktop.jpg) |
| Mintlify study | [Opening](../assets/reviewroom/mintlify/captures/home-desktop.jpg) | [Opening](../assets/reviewroom/mintlify/captures/home-phone.jpg) | [Working interface](../assets/reviewroom/mintlify/captures/demo-desktop.jpg) |

The raw trial filenames ended in `.png`, although their content is JPEG. The curated `.jpg` names correct the extension without changing image bytes. Only these six captures are bundled. Inspect the running case for the full homepage, phone demo, and guide; those views have no bundled screenshot. A capture records visible composition and state. It does not establish a successful interaction.

## Attio study: keep the work legible

Read [index.html](../assets/reviewroom/attio/site/index.html) with [style.css](../assets/reviewroom/attio/site/style.css). For the workspace, also read [demo.html](../assets/reviewroom/attio/site/demo.html) and [review.js](../assets/reviewroom/attio/site/review.js). The stylesheet retains successive corrective overrides; inspect the final matching selector and media query as well as its first rule.

| Decision | Purpose | Matching source |
| --- | --- | --- |
| Centered statement above a wide white working sheet, connected by fine grid lines | Establish a quiet software identity and give the sample room to carry the explanation | `.hero`, `.product-field`, `.product-sheet` in the home and CSS |
| Desktop selection, work, and feedback occupy separate adjacent columns | The reviewer can identify which version a note and decision belong to while seeing the work | `.review-app`, `.file-panel`, `.work-panel`, `.feedback-panel` |
| Homepage work and note both name Welcome email v02 and link to `demo.html?item=email` | A real sample note belongs to the artwork on display; the preview opens that same item | `.sheet-work`, `.sheet-feedback`; the query selection in `review.js` |
| Phone demo uses three adjacent item buttons, a Leave feedback anchor, and a secondary Reset row | Shorten the route to inspecting work and reaching the form while keeping all choices and states | Final `max-width:650px` rules for `.file-list`, `.work-heading`, `.work-feedback-link`, `.sample-utilities` |
| Phone guide uses a native Jump to a step disclosure; desktop keeps a contents rail | Offer navigation without putting five links ahead of the first instruction | [guide.html](../assets/reviewroom/attio/site/guide.html): `.guide-mobile-index`; final responsive guide rules |
| One sans family for display and utility text; labeled status colors and a dark primary action | Preserve readable software hierarchy while the customer's work supplies its own character | Font face, heading/control rules, and the final `[data-item-status][data-status]` color rules |

The phone homepage intentionally retains a full vertical item list before the work. Its screenshot shows the cost: the artwork starts near the bottom of the opening. Reassess that order for a new visitor's task. The compact demo selector is a different solution for active reviewing, not a reason to shrink every homepage label.

## Mintlify study: explain one concrete relationship

Read [index.html](../assets/reviewroom/mintlify/site/index.html) with [styles.css](../assets/reviewroom/mintlify/site/styles.css). For the workspace, read [demo.html](../assets/reviewroom/mintlify/site/demo.html), [review.js](../assets/reviewroom/mintlify/site/review.js), and [context.js](../assets/reviewroom/mintlify/site/context.js). Later overrides define the final proportions and readable state labels.

| Decision | Purpose | Matching source |
| --- | --- | --- |
| Left statement and an offset product window, with code-native green paths directed toward it | Give the public opening a distinct composition with actual product material | `.hero-intro`, `.hero-product`, `.direction-lines` |
| Version, work, and its corresponding note precede the complete item list | Explain the core relationship before asking the visitor to understand the whole project | `.preview-current`, `.preview-body`, `.preview-comment`, `.preview-rows` |
| Serif display text, sans interface labels, green actions, and quiet borders | Separate the promise from the working information and carry one identity into the guide | `ReviewSerif`/`ReviewSans` font faces, heading rules, color tokens, guide rules |
| Keep sign-off together and size secondary arrows explicitly | Prevent a meaningful phrase or destination from becoming isolated words beside oversized arrows | `.keep`, `.quiet-link svg`, `.preview-comment a svg` |
| Phone places work before feedback and keeps selected title/version/status beside the form | Maintain the relationship after the artwork has scrolled away | `.feedback-context`, `data-current-*` fields, and `context.js` |
| First guide instruction precedes navigation on phone; desktop retains a left rail | Start helping before presenting the rest of the contents | [guide.html](../assets/reviewroom/mintlify/site/guide.html): `.guide-first`; `.guide-layout` grid areas and final responsive rules |

The phone demo still has a vertical selector and requires scrolling to the form. Its Leave feedback anchor offers a deliberate next step; it does not make all controls visible at once. The repeated context is updated from the selected-work fields by `context.js`; changing item IDs or rendered fields requires checking that presentation too.

## Run and inspect a separate working copy

Each case contains the complete three-page static site, local fonts, original sample work, and JavaScript. From this Skill directory, run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory assets/reviewroom
```

Open `http://127.0.0.1:8000/attio/site/index.html` or `http://127.0.0.1:8000/mintlify/site/index.html`, then follow the demo and guide. Choose another available port if needed. There is no build step or account requirement.

In the demo, choose each item, add a sample comment, request changes with a comment, approve a version, reload, and reset. Changes are saved under a direction-specific browser-storage key on this origin. Unsaved drafts stay with an item during the current page session. Reset removes only that direction's saved sample. If storage is unavailable, the sample announces that changes last for the current page. Use sample text, because this is a teaching flow with no access control.

Preserve the bundled reference and adapt a separate copy. Replace the product identity, audience/promise, navigation, sample project and items, work SVGs, feedback, version/state meanings, and guide together. Keep the displayed artifact, note, status, and linked destination consistent. Read `review.js` before changing the DOM: its IDs and `data-item` hooks bind actions to the selected item. Replace its local state model with the actual product's storage and authorization when that work is in scope. Confirm who prepares work, who reviews it, and who can make a decision.

Review the adapted full pages on phone and desktop. Check long item names, changed typography, real artifact proportions, selection targets, status readability, feedback context, keyboard focus, guide order, and the actual next action. Broader language support may need a broader font subset. Retain both font notices when redistributing the fonts.

## Evidence and limits

The original final review favored Attio for the working review interface and Mintlify for explaining the product. This is a recorded design judgment with the tradeoffs above. It is not owner acceptance. The historical final checks covered these selected local paths, including comments, decisions, persistence/reset, responsive layout, and the last status fixes. [CHECKS.json](../assets/reviewroom/CHECKS.json) distinguishes that historical browser evidence from current copy, link, syntax, and local HTTP checks. [PROVENANCE.json](../assets/reviewroom/PROVENANCE.json) records each copied file's trial source and matching SHA256, plus capture dimensions and evidence-source hashes.

Do not infer production SaaS behavior, security, backend persistence, real client transmission, account/upload/payment support, revenue, customer acceptance, or all-host support from these cases. Their flow is fictional and local. An adapted product needs its own functional and rendered review. See [NOTICES.md](../assets/reviewroom/NOTICES.md) for original-material status and complete font-license links.
