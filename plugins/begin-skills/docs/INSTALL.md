# Install Begin

Open the folder for your website in your Agent. Copy the request for your host:

**Codex**

> Install Begin from https://github.com/cogine-ai/begin-skills/tree/begin-skills-v0.1.0-beta.1 using Codex's native plugin manager. Preserve my existing instructions and website files, then help me start.

**Claude Code**

> Install Begin from https://github.com/cogine-ai/begin-skills/tree/begin-skills-v0.1.0-beta.1 using Claude Code's native plugin manager with project scope. Preserve my existing instructions and website files, then help me start.

The plugin carries fifteen Skills and their full references, fonts, starters, examples and scripts. Codex installs a user plugin; Claude Code can install it for the selected project. Your website remains in your own folder.

Release: `0.1.0-beta.1`, from the dedicated public [Begin Skills repository](https://github.com/cogine-ai/begin-skills). The source tag `begin-skills-v0.1.0-beta.1` is fixed; use that edition's source for a repeatable installation.

## Start your website

Start a new conversation in the same folder after installation. Say:

> Use Begin to set up this workspace for my website. Preserve my existing instructions and files.

Setup establishes a short `BEGIN.md` with your goal, current files and commands. Then describe the website you want:

> Use Begin to help me build my website. I'm an independent professional. Help visitors understand my work and contact me. Suggest a fitting design, keep example work clearly labelled and show me a working local preview.

Make changes in ordinary language. When you return, open the same folder and ask Begin to continue from your files and `BEGIN.md`. See [Codex](CODEX.md), [Claude Code](CLAUDE_CODE.md) or the [quick start](QUICKSTART.md) for the complete flow.

## Agent installation checks

Before writing, inspect the host's installed plugins, marketplace registrations and same-name project Skills. Reuse an intact matching installation. Preserve local changes and inspect a different source or version before replacing it. Avoid duplicate native and copied installations of Begin.

Use the host manager for a native plugin. Register the catalog from the exact release source, then install `begin-skills@begin`. Check the installed version, actual Skill discovery and resource paths. An unavailable source is a clear installation failure; do not substitute a development checkout and call it the released version.

The clean distribution contains catalogs at `.agents/plugins/marketplace.json` and `.claude-plugin/marketplace.json`. Both point to `plugins/begin-skills`. Pass that distribution directory to the native marketplace manager. The plugin's complete resources are below `plugins/begin-skills/skills/`.

Check the actual runtime before using helpers. Begin's creation and preview helpers require Node.js 24. Keep the person's stack, accounts and existing instruction hierarchy. Resolve helper paths from the loaded Skill instead of assuming an installation directory.

## Advanced terminal installation

Use the pinned release source below. Inspect an existing Begin installation before replacing it.

### Codex native plugin

```sh
codex plugin marketplace add cogine-ai/begin-skills --ref begin-skills-v0.1.0-beta.1
codex plugin add begin-skills@begin
```

For a supplied local distribution, replace `cogine-ai/begin-skills --ref ...` with the distribution's absolute directory. Inspect an existing `begin` marketplace before registering that name.

### Claude Code native plugin

Run from the website folder:

```sh
claude plugin marketplace add cogine-ai/begin-skills#begin-skills-v0.1.0-beta.1
claude plugin install begin-skills@begin --scope project
```

For a supplied local distribution, replace the GitHub source with its absolute directory. Marketplace registration and project installation are separate operations.

### Standard Skills CLI

Use this alternative when native plugins are unavailable. Inspect existing `begin-*` directories and preserve local changes first. Do not add `--yes` to skip this check: the CLI can overwrite same-name Skills.

```sh
DISABLE_TELEMETRY=1 DO_NOT_TRACK=1 npx skills@1.7.2 add https://github.com/cogine-ai/begin-skills/tree/begin-skills-v0.1.0-beta.1/plugins/begin-skills/skills --agent codex --skill '*' --copy
```

Use `--agent claude-code` for Claude Code. A local distribution can use its absolute `plugins/begin-skills/skills` path as the source. Keep the whole delivered directory; installing only `SKILL.md` loses required resources. Do not run against the BeginFleet monorepo root, which exposes a different internal Skill.

The pinned CLI requires Node.js 22.20 or later. Begin helpers require Node.js 24. The shown environment settings disable the third-party installer's telemetry; adapt their syntax for another shell. This route uses the Skills manager's lockfile and lifecycle, with no Begin ZIP receipt.

## Update or remove

If you already use Begin, ask your Agent:

> Update my existing Begin installation to 0.1.0-beta.1 from https://github.com/cogine-ai/begin-skills/tree/begin-skills-v0.1.0-beta.1 using the manager that owns it. Preserve my website, BEGIN.md, existing instructions and unrelated Skills. Check the installed version and resources after updating.

Use the manager that installed Begin. A release tag has fixed bytes: choose the next official source to move to a new edition. Refreshing the current tag does not advance it to another release. Start a new conversation after a discovery change.

Native plugin removal should leave your website, project notes and instructions in place. Skills CLI and ZIP receipt installations have their own lifecycle. Resolve ownership before removing same-name directories; do not combine those managers' commands.

## ZIP fallback

The complete portable archive is `begin-skills-0.1.0-beta.1-skills.zip`. Download from the [Beta.1 release](https://github.com/cogine-ai/begin-skills/releases/tag/begin-skills-v0.1.0-beta.1), verify the named version and SHA-256, and extract safely into a new directory outside your website folder.

Tell Codex the extraction location and ask:

> Install the extracted Begin pack into this workspace using its Codex installer. Preserve my existing instructions and files. Tell me what was installed and how to start.

From the portable extraction root, the equivalent command is:

```sh
node begin-setup/scripts/install-codex.mjs install --project "/absolute/path/to/my-website"
```

This fallback requires the complete fifteen Skill directories and `RELEASE.json`. The helper checks every file, refuses an existing conflicting Begin installation and records ownership in the selected project. Its status, update, removal and recovery commands are documented in [Codex](CODEX.md).

## Evidence and feedback

See [Support](../SUPPORT.md) and [Status](../STATUS.md) for actual host checks. Share feedback through the repository with [these short suggestions](FEEDBACK.md). No feedback form or automatic usage uploader is installed.
