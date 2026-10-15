# Little Stage

Open `index.html` for the fictional programme, `demo.html` for the local ticket worksheet, or `guide.html` for the concrete USD48 exercise. Static hosting is sufficient. Direct file opening may give browser-specific localStorage behavior; the application reports storage failures.

The first output was built and frozen without starting a server or reviewing the new site in a browser, as required by the trial. Structural and model fixture results describe only those checks. Actual type loading, layout, keyboard operation, storage behavior and file downloads require the root's independent rendered review.

## Source checks

```sh
node --check budget-model.js
node --check worksheet.js
node fixtures/model.test.cjs
python3 fixtures/structure.py
```

The model fixture exercises the Saturday performance with 2 adults and 1 student: 3 tickets, USD36 adult line, USD12 student line, USD48 exact total. It also checks invalid input retention, stale and reverted edits, blocked export, recovery, both 8-ticket limits and note length.

Fonts remain unmodified, with full licenses and source-case provenance in `assets/fonts/`. See `NOTICES.md`.
