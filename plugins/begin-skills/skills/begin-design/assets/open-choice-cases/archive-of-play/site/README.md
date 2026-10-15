# Archive of Play — refined controlled draft

A fictional museum collection and browser-local teaching handout maker. No installation or account is required. Three pages use original static HTML, CSS, JavaScript and SVG. Local font files carry their complete applicable OFL notices.

## Local preview

From this `site` directory, run `python3 -m http.server 8764 --bind 127.0.0.1`, then open `http://127.0.0.1:8764/`. Use the same origin for local keeping and recovery. Direct file opening may have different or blocked browser storage.

The author did not run this preview command. Initial browser capture and runtime semantics were performed by the parent after the first freeze; the scoped source refinement now awaits parent final capture. See `../REFINEMENT.md`. Do not rerun the initial `../build.py` generator over this revised site.

## Files and checks

`handout-model.js` owns facts, validation, text generation and the explicit local-keeping contract. `handout.js` connects native form controls and download actions. `fixtures/rainy-afternoon.txt` is the exact reproducible reference. `guide.html` explains preparation, edits, keep/recover, export, reset/forget and limits.

From the parent directory, run `node checks/model.test.cjs`, `node checks/dom.test.cjs`, `node checks/refinement.test.cjs`, and `python3 checks/structure.py`. These checks do not render pages. The revised DOM harness verifies the formatted document and unchanged exact export together.

Only one deliberately kept record is stored, under `archive-of-play.kept-handout.v1`. The draft is never automatically persisted. No network API, telemetry, feedback, live order or transmission is implemented.

Source licensing for original project-authored materials remains the Begin candidate’s unresolved commercial decision; no new public redistribution license is granted here. See `NOTICES.md` and `FONT_SOURCES.json`.
