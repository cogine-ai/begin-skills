# Daylight — Interactive product introduction

An editable original product website starter. Native HTML, CSS, and JavaScript; no build step, third-party frontend runtime, remote fonts, or remote images.

## Preview

In the website folder you are editing, ask your Agent to preview **this folder** using the preview helper in its actual installed `begin-website` Skill. The Agent can locate the loaded Skill's `scripts/preview.mjs`.

From your website folder, the command shape is:

```sh
node "/absolute/path/to/installed/begin-website/scripts/preview.mjs" --dir . --port 0
```

Replace the illustrative absolute path with the actual installed Skill location. `--dir .` means the current website, so the helper previews your edited project rather than the library's original template. Open the local URL it prints. You may also open this folder's `index.html` directly for inspection.

To inspect the original starter **inside a source checkout only**, use this separate command from the Begin pack root (`products/begin-skills/`):

```sh
node skills/begin-website/scripts/preview.mjs --dir skills/begin-website/assets/starters/product --port 0
```

Use your generated website directory, not this source-library directory, for normal editing and hosting.

## Content and configuration

Daylight is a fictional planning product. Its working demo stores tasks only in page memory and resets on reload. Acquisition links use https://example.com until configured.

Central action: Visit the configured product acquisition destination. All configurable visitor destinations are anchors marked `data-begin-contact`; local navigation and demo controls are separate. An example-domain destination is a fixture, not a configured real action.

- Edit the product name, benefit, features, and questions in index.html.
- Adapt the illustrative preview markup and the real demo separately, keeping both honest about actual product capabilities.
- Edit initialTasks in site.js to change the reset fixture. Task labels are rendered with textContent.
- Configure every [data-begin-contact] acquisition anchor before publishing. The local demo does not imply accounts or persistent storage.

## Design rationale

A soft green working surface and compact system typography establish a calm planning product. A carefully composed product window explains the idea immediately; rounded controls and restrained handwritten accents add warmth. The section sequence moves from benefit to specific behavior, a real local demo, useful questions, and an acquisition action. The signature is the task board: the visitor can make a small plan rather than merely look at a screenshot.

## Interaction checks

- Add a task, mark it complete, move it to Later, and bring it back.
- Move all Today tasks to Later to see the empty state; add another task.
- Reset the board and reload: sample state returns, with no server call or browser storage.
- Check the mobile menu, native FAQ, visible focus, and reduced-motion settings.

All pages include landmarks, a skip link, visible keyboard focus, explicit menu state, and reduced-motion styling. Native disclosures remain usable without JavaScript.

## Publish and continue

Configure the destination, review the content and rendered phone/desktop result, and publish these files using the pack's chosen hosting instructions. This starter has no deployed project or provider configuration. Keep a short project record of accepted design, content, and destination before making later changes.

## Provenance and limits

All example copy, CSS, JavaScript, and illustrations were authored for Begin. No client materials or third-party runtime assets were imported. Fonts are supplied by the operating system; their appearance varies slightly across devices. Distribution licensing for Begin-authored content follows the pack's release decision.

This is a local starter, not proof of email delivery, booking completion, an account-backed application, or deployment.
