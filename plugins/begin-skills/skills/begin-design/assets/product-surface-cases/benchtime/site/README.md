# BENCHTIME

Original fictional shared-workshop scheduling demonstration. Three pages: `index.html`, `planner.html`, `guide.html`. It runs as static HTML, CSS and native JavaScript modules, with no framework or backend.

From this directory, run `python3 -m http.server 8000` and open `http://localhost:8000/index.html`. Stop with Ctrl-C. A static HTTP server is required for native module loading; opening HTML directly from disk is not supported.

The two dates, machines, prices and occupied intervals are fixed examples. All time labels are Dublin local time. Request drafts stay in this browser/tab. HTML and CSV exports are local files. Nothing is submitted, reserved or paid.

`model.mjs` owns dates, availability, validation, money and CSV rows. `app.mjs` connects that model to the planner. No remote images, scripts or fonts are requested. Original SVG machine drawings are in `assets/`.

Fonts: Chivo and IBM Plex Mono are shipped locally under their full SIL Open Font License notices in `assets/fonts/`. `FONT_SOURCES.json` records official upstream URLs.

Verification at first-source freeze: two real type systems rendered at 1440, 390 and 320 CSS pixels, nine pure model checks passed, module syntax checked, local asset references checked. The full assembled site and actual browser interactions are not yet independently reviewed. This source is a preview-informed first draft.

Refinement after independent first-source review: the current selected range has its own marker over occupied/request state; the editor repeats date/machine/time by its action; phone tile selection brings the editor into view with an explicit return route; checkpoint metadata and working/saved differences are read back. The public example also has a direct continuation before the original illustration. These changes passed source/model checks but their assembled rendering and real interactions await root browser verification because the maker CUA connection timed out twice. `first/site` remains the original preserved source; `refined/site` is the revised source freeze.
