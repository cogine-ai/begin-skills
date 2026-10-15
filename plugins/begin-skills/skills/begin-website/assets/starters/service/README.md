# Maya Ellis — Independent professional

An editable original service website starter. Native HTML, CSS, and JavaScript; no build step, third-party frontend runtime, remote fonts, or remote images. Syne and DM Sans load from local files with complete notices.

## Preview

In the website folder you are editing, ask your Agent to preview **this folder** using the preview helper in its actual installed `begin-website` Skill. The Agent can locate the loaded Skill's `scripts/preview.mjs`.

From your website folder, the command shape is:

```sh
node "/absolute/path/to/installed/begin-website/scripts/preview.mjs" --dir . --port 0
```

Replace the illustrative absolute path with the actual installed Skill location. `--dir .` means the current website, so the helper previews your edited project rather than the library's original template. Open the local URL it prints. You may also open this folder's `index.html` directly for inspection.

To inspect the original starter **inside a source checkout only**, use this separate command from the Begin pack root (`products/begin-skills/`):

```sh
node skills/begin-website/scripts/preview.mjs --dir skills/begin-website/assets/starters/service --port 0
```

Use your generated website directory, not this source-library directory, for normal editing and hosting.

## Content and configuration

Maya Ellis is fictional. All three projects are original self-initiated concepts. Contact links use hello@example.com until configured.

Central action: Start a conversation with the website owner. All configurable visitor destinations are anchors marked `data-begin-contact`; local navigation and demo controls are separate. An example-domain destination is a fixture, not a configured real action.

- Change the name, headline, services, and about copy in index.html.
- Replace or edit the three original SVG project illustrations in art/. Keep concept labels when projects are fictional.
- Edit the named color/font tokens at the top of styles.css; do not apply the same visual formula to every project.
- Configure every [data-begin-contact] anchor through the creation helper or a reviewed source edit. The fixture note must be replaced with accurate owner information before public use.

## Design rationale

A compact typographic statement leads into one complete original concept. Syne's extended display shapes give the independent designer an identifiable voice; DM Sans sustains reading and practical controls. The neutral cool surface, dark service rows and quiet violet contact area give the actual work room. The three project concepts share a stage; each selection keeps its artwork, title, description, design question and decision together.

Two real-content type directions were compared in native desktop, phone and narrow previews before this direction was chosen. They had comparable headline and name line counts. The selected system is a local choice, not a required Begin font pairing. Read the complete mobile and desktop result again when changing names or material.

## Interaction checks

- Choose Community, Studio and Planning. Confirm the displayed artwork, project title, description and design thinking belong to the same selected concept.
- With a concept tab focused, use Left/Right, Home/End, then Tab to reach the selected panel and its disclosure. Without JavaScript, all three complete concepts remain readable and the unnecessary selector stays hidden.
- Open each project disclosure and FAQ with the keyboard.
- At phone width, open the menu, follow a link, and use Escape to close it and return focus to Menu.
- Replace a project image with a missing path: its meaningful description remains available. Check a selected concept as well as the initial one.
- Confirm all configured contact anchors point to the intended destination. Email sending is outside this starter.

The site includes landmarks, a skip link, visible keyboard focus, explicit menu and concept selection state, and reduced-motion styling. Native disclosures remain usable without JavaScript. A native rendered review, rather than source presence alone, is needed to confirm the edited page.

## Publish and continue

Configure the destination, review the content and rendered phone/desktop result, and publish these files using the pack's chosen hosting instructions. This starter has no deployed project or provider configuration. Keep a short project record of accepted design, content, and destination before making later changes.

## Provenance and limits

All example copy, CSS, JavaScript, and illustrations were authored for Begin. No client materials were imported. The unchanged local font binaries are third-party assets with complete licenses in fonts/. See NOTICES.md and FONT_SOURCES.json for their notices, hashes and original source URLs. Distribution licensing for Begin-authored content follows the pack's release decision.

This is a local starter, not proof of email delivery, booking completion, an account-backed application, or deployment.
