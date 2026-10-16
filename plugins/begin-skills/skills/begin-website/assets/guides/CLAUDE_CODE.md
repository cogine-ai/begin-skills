# Begin in Claude Code

Open the folder for your website in Claude Code and copy:

> Install Begin from https://github.com/cogine-ai/begin-skills/tree/begin-skills-v0.1.0-beta.1 using Claude Code’s native plugin manager with project scope. Preserve my existing instructions and website files, then help me start.

Claude Code registers the Begin marketplace and installs the plugin for this project. It includes fifteen Skills with their complete references, fonts, starters, examples and scripts.

The shared [installation guide](INSTALL.md) owns the pinned release source, Skills CLI alternative and ZIP fallback. Use the dedicated public release repository above; preserve an existing installation before changing its source.

## Set up once

Start a new conversation in the same website folder after installation and say:

> Use Begin to set up this workspace for my website. Preserve my existing instructions and files.

If discovery needs help, use `/begin-skills:begin-setup`. Setup checks the tools and resources available to Claude Code and creates or updates a short `BEGIN.md`. It preserves existing project choices and instructions. Setup does not make the website.

## Make your website

For example:

> Use Begin to help me build my website. I’m an independent professional. I want people to understand my work and contact me. I’m unsure about the design. Suggest a direction and help me see a working preview.

Add your real content, images and contact destination when you have them. Keep illustrative identities and concept work marked until you replace them. If discovery needs help, use `/begin-skills:begin-website`.

Claude Code should provide an actual local preview URL and keep it available while you use it. Begin’s supplied creation and preview helpers require Node.js 24. Terminal access, browser inspection and background processes depend on the host session.

## Shape it and continue

Try a focused change:

> Give my work examples more room and shorten the introduction. Keep my services, contact destination and accepted visual direction. Show the changed preview and update the project note.

For a design review:

> Review the actual phone and desktop pages, including the inner pages. Improve the most important problems in typography, composition, wrapping and alignment while preserving my content and working actions.

When you return to the same website folder in a new conversation:

> Use Begin to continue my website from the current files and BEGIN.md. Show me the current preview, keep the decisions I’ve accepted and help me finish the next useful change.

Your source stays in your project. `BEGIN.md` carries useful decisions and actual run commands. If the session cannot inspect a browser, Claude Code should say which visual checks remain open.

## Update or remove

Use Claude Code’s plugin controls for this project installation. Select the next official release source when updating; the selected tag itself is fixed. Updating the plugin should preserve your website and project notes.

For a Skills CLI installation, use that manager instead. A native plugin or ordinary Skills installation has no Begin receipt and should not be updated or removed with Begin’s custom ZIP installer.

## Advanced: Claude Code CLI

Run these from the website folder:

```sh
claude plugin marketplace add cogine-ai/begin-skills#begin-skills-v0.1.0-beta.1
claude plugin install begin-skills@begin --scope project
```

The source must exist and be accessible. Marketplace registration and project installation are two operations. On the checked Claude Code 2.1.257 interface, project scope belongs on `plugin install`; do not replace these with unverified one-command flags or assume marketplace registration is project-scoped.

Inspect an existing marketplace named `begin` before adding another source under that name. Use `claude plugin list` and `claude plugin details begin-skills@begin` to inspect the installed plugin. For a native project installation, the lifecycle commands are:

```sh
claude plugin update begin-skills@begin --scope project
claude plugin uninstall begin-skills@begin --scope project
```

Updating a pinned catalog refreshes that selected source; choosing the next edition also requires its official release source. Start a new conversation when discovery needs refreshing.

CLI format checks and local fixture installation are narrower than a complete model-led website flow. The actual checks for this edition are in [Status](STATUS.md). These instructions are for Claude Code; Cowork has separate installation and runtime coverage.

## Advanced: ordinary Skills installation

When native plugins are unavailable, the pinned Skills CLI can copy the clean delivered Skills into the project. First inspect same-name `begin-*` folders and preserve local edits. Do not blindly add `--yes`: same-name Skills can be overwritten.

A Unix-style terminal command from the website folder is:

```sh
DISABLE_TELEMETRY=1 DO_NOT_TRACK=1 npx skills@1.7.2 add https://github.com/cogine-ai/begin-skills/tree/begin-skills-v0.1.0-beta.1/plugins/begin-skills/skills --agent claude-code --skill '*' --copy
```

The Skills CLI requires Node.js 22.20 or later. Begin’s own helpers need Node.js 24. The environment settings disable that third-party CLI’s installation telemetry; adapt the syntax for another shell.

Use the Skills manager’s checks, updates and removal for this route. Keep its lockfile. Ask Claude Code to locate the installed `begin-setup` and `begin-website` Skills if the native plugin invocation is unavailable; do not assume the namespaced plugin commands work for copied Skills.

## Agent appendix: local helpers

Find the actual loaded `begin-website` directory and read its `references/helpers.md`. Use that path for creation and preview rather than assuming a Codex project Skills directory.

The preview helper supports `--dir ./site --port 0 --background`, plus `--status` and `--stop`. Record actual paths and commands in `BEGIN.md`. Keep a persistent foreground terminal if detached processes are blocked. Stop the owned preview when finished.

Next: [quick start](QUICKSTART.md), [troubleshooting](TROUBLESHOOTING.md) or [feedback](FEEDBACK.md).
