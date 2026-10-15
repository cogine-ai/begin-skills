# Nora Vale — Original visual portfolio

An editable original portfolio website starter. Native HTML, CSS, and JavaScript; no build step, third-party frontend runtime, remote fonts, or remote images.

## Preview

In the website folder you are editing, ask your Agent to preview **this folder** using the preview helper in its actual installed `begin-website` Skill. The Agent can locate the loaded Skill's `scripts/preview.mjs`.

From your website folder, the command shape is:

```sh
node "/absolute/path/to/installed/begin-website/scripts/preview.mjs" --dir . --port 0
```

Replace the illustrative absolute path with the actual installed Skill location. `--dir .` means the current website, so the helper previews your edited project rather than the library's original template. Open the local URL it prints. You may also open this folder's `index.html` directly for inspection.

To inspect the original starter **inside a source checkout only**, use this separate command from the Begin pack root (`products/begin-skills/`):

```sh
node skills/begin-website/scripts/preview.mjs --dir skills/begin-website/assets/starters/portfolio --port 0
```

Use your generated website directory, not this source-library directory, for normal editing and hosting.

## Content and configuration

Nora Vale is fictional. All artwork is original self-initiated work, not client commissions. Contact links use hello@example.com until configured.

Central action: Contact the portfolio owner. All configurable visitor destinations are anchors marked `data-begin-contact`; local navigation and demo controls are separate. An example-domain destination is a fixture, not a configured real action.

- Edit identity, approach, artwork titles, and contact copy in index.html.
- Replace the four SVG files in art/ with your owned assets. Update alt text and the data-title/data-caption fields together.
- Update data-category and the matching filter buttons if you change the categories.
- Configure every [data-begin-contact] anchor before publishing. Gallery links and filters are local interactions.

## Design rationale

Lilac paper, violet ink, peach, and softly modelled objects support a curious visual practice. A wide system sans establishes large confident statements; Georgia adds a small expressive contrast. The gallery uses unequal widths and deliberate vertical offsets to make the artwork the main content. Native dialog viewing and category filters invite closer exploration. The signature is the original object composition that continues from the introduction into the work.

## Interaction checks

- Filter Identity and Objects, and return to All work.
- Open a project, use Left/Right or Previous/Next, then Escape. Focus returns to the opener.
- Turn JavaScript off: all projects remain visible and project anchors open their SVG directly.
- Make a thumbnail or modal artwork unavailable and check readable fallback content.

All pages include landmarks, a skip link, visible keyboard focus, explicit menu state, and reduced-motion styling. Native disclosures remain usable without JavaScript.

## Publish and continue

Configure the destination, review the content and rendered phone/desktop result, and publish these files using the pack's chosen hosting instructions. This starter has no deployed project or provider configuration. Keep a short project record of accepted design, content, and destination before making later changes.

## Provenance and limits

All example copy, CSS, JavaScript, and illustrations were authored for Begin. No client materials or third-party runtime assets were imported. Fonts are supplied by the operating system; their appearance varies slightly across devices. Distribution licensing for Begin-authored content follows the pack's release decision.

This is a local starter, not proof of email delivery, booking completion, an account-backed application, or deployment.
