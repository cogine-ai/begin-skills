# Fieldnotes — Articles and practical guides

A complete original reading-site starter with three local pages: an article directory, a long essay, and an operational guide. System fonts, original SVG, and native HTML/CSS/JavaScript; no build, account, remote media, subscription, or backend.

## Preview

From your edited website folder, ask the Agent to locate its actual installed preview helper and preview this folder:

```sh
node "/absolute/path/to/installed/begin-website/scripts/preview.mjs" --dir . --port 0
```

The path is illustrative; use the actual installed file. Open the loopback URL it prints. For source-checkout inspection only, from the Begin pack root:

```sh
node skills/begin-website/scripts/preview.mjs --dir skills/begin-website/assets/starters/editorial --port 0
```

You can also open `index.html` directly. Relative navigation and native contents disclosures work without a server or JavaScript. Preview your copied project for normal work, rather than editing the installed original.

## What is complete

- `index.html`: featured essay, three accurately labeled directory entries, category filters, title/summary search, useful no-results recovery, and one marked footer contact.
- `article.html`: a complete original essay, section navigation, illustration and caption, and onward reading.
- `docs.html`: a complete guide with prerequisites, sequential steps, checks, a file table, and troubleshooting.
- `styles.css`: shared tokens, distinct reading and directory layouts, narrow/middle/desktop adjustments, focus styling, and reduced-motion rules.
- `site.js`: optional local directory search/filter and current-section indication. It does not fetch, persist, send, or execute user input.
- `art/reading-path.svg`: original illustration with its own accessible title and description.

Central action: follow real local navigation and read an article or guide. Search indexes the directory's titles/summaries, not full-page content. The third directory entry is explicitly a section of the main essay, not a second full article. All content and navigation remain available when JavaScript is disabled; optional search/filter controls are hidden.

## Content and configuration

Fieldnotes and its editorial desk are fictional. The repair-business scenario is illustrative. All writing and artwork are original example material, not client work, published research, or evidence of customer results. Keep these labels wherever illustrative content remains.

Edit the name, author details, page titles, descriptions, directory summaries, article, guide, and related links. Preserve matching heading IDs and contents links. When adding another complete article, copy the article page to a new filename and point an accurately labeled directory entry at that file.

The only `data-begin-contact` anchor is in the directory footer. Its initial `mailto:hello@example.com` is a fixture. Configure it with the creation helper, or make a reviewed source edit. A configured href does not verify message delivery. The creation helper removes the adjacent example-address label for a non-example destination. If you edit the link directly, update that label too. The article and guide use real local reading links as their main actions.

## Design rationale

This is a digital reading room: cool white, blue ink, slate surfaces, and a small ochre cue distinguish publication metadata from reading actions. Compact system sans headings and navigation pair with Georgia long-form text. The page uses a controlled reading measure, open paragraph rhythm, a quiet contents rail, and compact directory rows. Its signature is the original reader-question/content/action illustration, grounded in the essay. The presentation deliberately differs from the pack's service, portfolio, and product-showcase starters.

## Interaction and content checks

- Open every directory link; confirm whole-article and section labels match their destinations.
- Filter to the guide and essays; search for a title/summary term; recover from no matches.
- Use the keyboard for navigation, filtering, search, contents disclosure, and section links; confirm visible focus.
- Read at 320px, phone, middle, and desktop widths; verify no page overflow, comfortable line length, and usable navigation.
- Disable JavaScript: all three pages, entries, links, guide steps, and native disclosures must remain usable.
- Block the illustration: the text, caption, and navigation remain available.

## Publishing and limits

Publish only visitor-facing HTML/CSS/JS/art files using your chosen host's output configuration. Do not include private project records or credentials. This starter has no provider, hosted search, form submission, account system, analytics, or publication history. The source-checkout preview helper's restrictions do not configure a public host's restrictions.

All writing, artwork, and frontend code were authored for Begin. No third-party runtime asset or client material was imported. Font rendering varies by operating system. Distribution terms for original resources follow the Begin pack's release decision.
