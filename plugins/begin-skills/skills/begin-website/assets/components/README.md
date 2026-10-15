# Working website component examples

Open `index.html` or use the preview helper from the Begin pack root:

```sh
node skills/begin-website/scripts/preview.mjs --dir skills/begin-website/assets/components --port 0
```

The original collection is a runnable native HTML/CSS/JavaScript page. It has no build step or external frontend runtime assets.

## Included patterns

- Header/navigation: responsive menu, explicit expanded state, Escape recovery, and useful no-JavaScript navigation.
- Hero and section composition: a specific offer, readable hierarchy, and one central action.
- Project/service presentation: a clear project question, native disclosure, and differently organized service text.
- Contact action: a configurable `data-begin-contact` fixture anchor. Set a real destination before public use.
- Form: explicit labels, native input types, bounded lengths, inline validation, focus on the first error, and a truthful result. It does not send or save data.
- Loading/empty/error/success: explicitly labelled sample messages. Their controls make no network requests and do not establish submission success.
- Image fallback: trigger a missing optional image, preserve the layout, then restore the included original SVG.
- FAQ: native `details` and `summary`, keyboard interaction, and no-JavaScript support.

## Adaptation

Copy only the relevant markup, named CSS selectors/tokens, and event logic into the current project. Preserve semantic labels, focus, reduced motion, and truthful error/result handling. A live form needs an actual receiving service and server-side validation; connect it through the pack's functional example or the project's existing backend. Rendering visitor-provided text uses `textContent`, not HTML interpolation.

The collection demonstrates interaction and implementation. Each website should choose its own identity, information structure, and composition.

## Provenance

All source and `sample-art.svg` were authored for Begin. System fonts only. Distribution licensing follows the pack's release decision. `.review/` holds local screenshot and check artifacts and is excluded from release packaging.
