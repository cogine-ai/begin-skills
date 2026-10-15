# Fieldnotes: a cover and story that belong together

Use this case for a small edited publication with one strong feature, complete reading destinations, and suitable cover art. It shows one accepted local design, with its original implementation available to inspect. The owner's positive homepage review on 2026-10-09 does not establish repeatability across briefs, Agents, or hosts.

## Look at the actual composition

View both images with the host's image-viewing tool before adopting their design decisions:

- [Desktop opening](../assets/fieldnotes/captures/desktop.jpg): cover and introduction form one spread.
- [Phone opening](../assets/fieldnotes/captures/phone.jpg): masthead, art, title, summary, and essay action share one surface.

The paper bridge expresses the essay's subject: the work between an idea and a useful website. A new subject needs imagery or another artifact that earns its place. A service offer or product demonstration may need its own composition and reference. Choose according to the supplied material and the visitor's decision.

## Decisions to adapt

| Decision | Why it fits this publication | Where to inspect |
| --- | --- | --- |
| One spread with a cover beside the introduction, actual essay title, summary, and reading action | The reader can identify the publication and choose its main story together | `index.html`: `.opening`; `index.css`: `.opening`, `.opening-story`, `.cover-art` |
| One shared phone opening surface, inset art, and consistent margins | The first draft's masthead, banner, and feature read as unrelated bands; the correction makes them one reading decision | `index.css`: the final `max-width:760px` and `max-width:380px` rules |
| A prominent practical guide and a smaller, explicitly labeled extract | There are two complete works and a section of one essay; equal tiles would imply three comparable articles | `index.html`: `.reading-pair`; `index.css`: `.reading-extract` |
| A compact About note | The publication description supports the reading entries without competing with them | `index.css`: `.about` and its final responsive overrides |
| Distinct display, prose, and utility type roles | The title invites reading, sustained paragraphs remain comfortable, and navigation stays subordinate | `common.css`: font faces and tokens; `reading.css`: title, `.prose`, and `.contents` rules |
| A shared essay/guide reading system | Complete inner pages carry the same identity as the homepage, with text and useful contents navigation | `article.html` or `docs.html`; `reading.css`: `.reading-layout`, `.mobile-contents`, table and heading rules |

The opening adapts a cover beside an introduction observed on [Asterisk](https://asteriskmag.com/). [Kinfolk's inspected story-cover section](https://mobbin.com/sites/sections/fc287d02-6cb7-4ac5-afb3-0a4e395094e5) informed the importance of editorial imagery. These are recorded composition observations from 2026-10-09. Fieldnotes uses its own identity, writing, art, and code. The external references do not establish conversion or accessibility results.

The cool paper ground, green-grey reading surface, and serif/sans roles suit this candidate. The orange belongs chiefly to its artwork. Adapt color, type, image choice, and proportions to the new brief; they are open design choices.

## Inspect the implementation when using it

If adopting this implementation, read [index.html](../assets/fieldnotes/site/index.html), [index.css](../assets/fieldnotes/site/index.css), and [common.css](../assets/fieldnotes/site/common.css). For a reading page, also read its HTML—[article.html](../assets/fieldnotes/site/article.html) or [docs.html](../assets/fieldnotes/site/docs.html)—and [reading.css](../assets/fieldnotes/site/reading.css). Inspect [site.js](../assets/fieldnotes/site/site.js) when adapting contents highlighting. Its native links and disclosure remain the basis of the reading navigation.

This is the original three-page static implementation from the accepted Fieldnotes candidate, copied byte for byte. Its CSS retains the successive corrective overrides; later rules explain the final appearance. Preserve the reference copy and adapt a separate working copy to the actual content.

For a local preview, run from `assets/fieldnotes/site/` relative to this Skill:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/index.html`, then read `article.html` and `docs.html`. There is no build step. Choose another available port if needed. The footer's email address and publication details are examples to replace intentionally in a real project.

## Judge the adapted result

Look at the whole opening: where does its visual weight go, and does that support choosing a story? On a phone, assess the actual sequence from masthead through art, title, summary, and reading action. Keeping that decision within the original tested viewport was useful for this brief; it is not a screen-height rule for every website.

Read the essay and guide beyond their headers. Review paragraph measure, heading scale, table width, contents prominence, and the space before useful reading begins. A repeated cover, slogan, or large introduction can delay the content while each element appears tidy in isolation. Use the [rendered design guidance](polish.md#rendered-design-judgment) to propose a specific correction that preserves the accepted direction.

See [asset and source notices](../assets/fieldnotes/NOTICES.md) for provenance, font licensing, and capture evidence boundaries.
