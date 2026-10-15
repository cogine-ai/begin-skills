# Reviewroom source and asset notices

The two complete three-page sites and six captures are original Reviewroom material from Begin's local 2026-10-09 SaaS design trial. They were copied byte for byte from the final `directions/attio/site/`, `directions/mintlify/site/`, and matching `captures/final/` outputs. The original HTML/CSS, marks, work SVGs, JavaScript, and fictional writing were created for that trial. The capture filenames now use `.jpg` to match their original JPEG content; raw trial source filenames remain `.png` in provenance. Renaming changed no image bytes. Capture and file hashes are recorded in [PROVENANCE.json](PROVENANCE.json).

Project-authored material retains Begin's existing candidate licensing status. A public release license for original Skills, examples, and documentation has not been chosen. This notice grants no new public redistribution rights. Third-party fonts retain their own license.

## External study sources

The Attio and Mintlify names identify composition studies used in the original trial; they do not identify imported websites. Their recorded Mobbin screen URLs are provenance metadata only. No Attio or Mintlify screenshot, logo, font, copy, or source code is included. Private trial inputs and upstream Skill bodies are excluded. Reading this case does not establish a fresh inspection of those external sites or any of their product behavior.

## Local fonts

Both site directories retain the original local font files and complete SIL Open Font License 1.1 notices:

| File | Attio site | Mintlify site |
| --- | --- | --- |
| Fieldnotes Sans, the renamed Source Sans 3 subset | [Font](attio/site/fonts/fieldnotes-sans.woff2), [full Source Sans notice](attio/site/fonts/source-sans-3-OFL.txt) | [Font](mintlify/site/fonts/fieldnotes-sans.woff2), [full Source Sans notice](mintlify/site/fonts/source-sans-3-OFL.txt) |
| Source Serif 4 subset | [Font](attio/site/fonts/source-serif-4.woff2), [full Source Serif notice](attio/site/fonts/source-serif-4-OFL.txt) | [Font](mintlify/site/fonts/source-serif-4.woff2), [full Source Serif notice](mintlify/site/fonts/source-serif-4-OFL.txt) |

These are the original Fieldnotes-derived variable-font subsets supplied to the SaaS trial. The recorded derivation used fontTools 4.66.1 and Google Fonts variable TTFs for Source Sans 3 and Source Serif 4. The recorded subset coverage is `U+0000-00FF,U+0100-024F,U+2000-206F,U+20AC,U+2190-21FF`. Additional writing systems may require different coverage.

The Source Sans derivative was renamed **Fieldnotes Sans** to respect the original reserved name, **Source**. Font naming records were updated while preserving glyphs, shaping data, variation axes, and instance coordinates in the original conversion record. Both full OFL notices stay beside the font files and must accompany their redistribution. Attio's interface uses the sans family; its serif file remains with the complete original site. Mintlify uses both families. The fonts inside the sample work are specified by the SVGs and may use system fallbacks.

The original Mintlify site's [trial notice](mintlify/site/NOTICES.md) is preserved unchanged. The guide and provenance here clarify the renamed sans file's derivation; they do not alter the font files or their original notices.

## Scope of the captures

The original captures show fictional sample work and local browser state, with no client files. They establish visible composition at their recorded viewports. Historical functional and responsive checks are summarized in [CHECKS.json](CHECKS.json). They do not establish owner acceptance, real customers, commercial results, production readiness, or support across Agent hosts.
