# Begin

**Give your AI the skills to build the website you have in mind**

We've spent years turning people's ideas into websites. Now, we're putting that expertise in your hands.

Begin brings design methods, professional web development guidance, editable website starters, and working feature examples into the AI Agent you already use. Start with an idea, shape a website that feels like yours, and keep improving it with a guided workflow.

## Start here

Open your website folder in Codex and copy:

> Install Begin from https://github.com/cogine-ai/begin-skills/tree/begin-skills-v0.1.0-alpha.5 using Codex's native plugin manager. Preserve my existing instructions and website files, then help me start.

For Claude Code, ask it to use its native plugin manager with project scope. Both plugins include all fifteen Skills and their complete resources. The standard Skills CLI is another supported installation path; a ZIP is the fallback. Follow [installation](INSTALL.md), [Codex](plugins/begin-skills/docs/CODEX.md) or [Claude Code](plugins/begin-skills/docs/CLAUDE_CODE.md).

The release source is the dedicated [Begin Skills repository](https://github.com/cogine-ai/begin-skills), pinned to `begin-skills-v0.1.0-alpha.5`. Keep the complete pack together so your Agent can use its references and working examples.

Open [Quick Start](plugins/begin-skills/docs/QUICKSTART.md) for the general flow. Ask your Agent:

> Use Begin to set up this workspace for my website. Preserve my existing instructions and project files.

Project setup uses `begin-setup`. Then describe the website you want:

> Use Begin to help me build the website I have in mind. I'm an independent product designer. I want potential clients to understand my work and get in touch.

Website making and changes use `begin-website`. Describe the result in ordinary language; you do not need to choose a technical stack first. Your Agent keeps a short `BEGIN.md` record for continuation.

See [How people use Begin](plugins/begin-skills/docs/USAGE_MODEL.md) for the first-session flow, task-based specialist use, cooperation with other installed Skills, and continuation.

For maintainers, [the second-round review](plugins/begin-skills/docs/PRODUCT_AND_SKILL_REVIEW.md) compares all fifteen Skills and identifies the next improvements. [Skill review](plugins/begin-skills/docs/SKILL_REVIEW.md) records the earlier method and usage work.

## What's inside

- Fifteen Skills: project setup, website making, design, content, frontend, backend, data, security, services, publishing, quality, architecture, Learn Products, Writing Docs, and diagrams.
- Four distinct website starters: professional service, creative portfolio, product introduction, and editorial/documentation.
- Forty-four original design-reference variants across forty-three scenarios, with complete editable source, actual phone/desktop captures and focused adaptation guidance.
- A working component gallery with interactive examples.
- Complete original researched-article and documentation examples, including a small runnable documentation project.
- A persistent enquiry feature with server validation and owner access checks; account, payment, and private-data extension methods.
- Project instructions, troubleshooting, service recipes, and optional feedback guidance.
- A clean Git-installable distribution, native Codex and Claude Code marketplace catalogs, and reproducible plugin and portable Skills archives.

See [Contents](plugins/begin-skills/CONTENTS.md) for the resource map, [Extensions](plugins/begin-skills/docs/EXTENSIONS.md) for account/payment/private-data depth, and [Support](plugins/begin-skills/SUPPORT.md) for installation and actual host coverage.

## Local inspection

In a clone of the public repository, first run `cd plugins/begin-skills`; the commands below run from that directory.

Static helpers are verified on Node.js 24. Static starters have no third-party runtime dependencies. The separate enquiry example requires Node.js 24.x; other major versions have not been verified.

```sh
node skills/begin-website/scripts/create-site.mjs --template service --output /absolute/path/to/new-site
node skills/begin-website/scripts/preview.mjs --dir /absolute/path/to/new-site --port 0 --background
```

Replace the sample content and contact destination before sharing a site. A copied starter starts the work; the Agent still needs to adapt it to the website owner and inspect the result.

For the backend example, follow [its README](plugins/begin-skills/skills/begin-backend/assets/enquiry/README.md). Maintainers working from the development repository's `products/begin-skills/` can build local archives with `python3 scripts/bundle.py` and the clean Git-installable tree with `python3 scripts/distribution.py --output /absolute/path/to/a/fresh-output`.

## Alpha status

Version `0.1.0-alpha.5` brings the reviewed pack to its dedicated public repository, with MIT terms for Begin-authored material, retained third-party notices and direct repository feedback. Earlier archives remain fixed. Read [Status](plugins/begin-skills/STATUS.md) for the actual host evidence and its limits.

## Help us make it better

Show us what you made, or tell us where you got stuck. A short note, a screenshot or a link is enough. [Share an experience or report a problem](https://github.com/cogine-ai/begin-skills/issues/new/choose). For a possible vulnerability, use [private security reporting](SECURITY.md).

## License

Begin-authored material is available under [MIT](LICENSE). Third-party fonts, photographs and dependencies retain their own notices; see [license details](plugins/begin-skills/LICENSE_STATUS.md). Contribution guidance is in [CONTRIBUTING.md](CONTRIBUTING.md).
