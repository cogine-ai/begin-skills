# Agent delivery and support

Begin is a capability pack for an Agent you already use. It contains fifteen ordinary Skills with their own resources and thin native plugin manifests. Start with `begin-setup` for project configuration and `BEGIN.md`; use `begin-website` for making and changing the website.

## Start with your Agent

- [Codex](docs/CODEX.md): copy the installation request and let Codex use its native plugin manager. The native plugin is a user installation; website setup happens in the selected project.
- [Claude Code](docs/CLAUDE_CODE.md): copy the installation request and let Claude Code register the marketplace, then install the plugin with project scope.
- [Quick start](docs/QUICKSTART.md): set up once, make a preview, change the result and continue in a new conversation.

The shared [installation guide](docs/INSTALL.md) owns the current release source, version and exact commands. Ordinary Skills-manager installation is an alternative. The complete Skills ZIP and Begin’s receipt installer are a separate fallback, rather than the normal installation path.

The release source is `cogine-ai/begin-skills` at the fixed `begin-skills-v0.1.0-alpha.5` tag. Alpha.5 adds the dedicated public distribution, MIT terms for original material and repository feedback to the reviewed installation pack. The full native model workflows below retain their actual Alpha.2 input; public source, download and deployed-site acceptance are recorded separately in the release notes.

## What has actually been checked

The [product status](STATUS.md) records current results. Keep these boundaries separate:

- **Codex CLI:** Alpha.2's actual native installation, onboarding discovery, separate setup/making/edit/continuation sessions and durable preview have local checks. Configured-model timeout and capacity rejection, followed by a process-only supported model selection, remain explicit in Status. Native calls use `begin-skills:begin-*`; copied Skills use unprefixed names.
- **Codex desktop and IDE:** CLI plugin commands and manifest validity do not establish each surface’s installation, discovery, preview or complete user flow. Use that host’s available plugin controls and record its actual results.
- **Claude Code:** Alpha.2's project plugin, automatic setup invocation, adapted website, fresh edit/continuation, durable preview and scoped lifecycle have actual local checks with the existing configured GLM route. The initial making turn hit its final-verification time bound; recovery and independent post-review repairs are recorded separately. Hosted source access remains a separate check.
- **Skills CLI 1.7.2:** local Codex and Claude Code copy fixtures retained all fifteen Skills and complete resources. Their creation/preview helpers ran, and scoped removal preserved unrelated work. Current remote source access and model-led use remain separate.
- **Cursor, OpenCode and Cowork:** retained delivery candidates need their own installation, resource access, helper and user-flow checks. Do not call them fully supported based on format support alone.
- **Cogine Work:** later coverage. Portable resources are retained; this edition makes no runtime support claim.

The source-only local fixture account is at `docs/evidence/2026-10-13-install-routes/README.md`. It is excluded from installed packs. See Status for later results.

## Installation ownership

Use the manager that installed Begin for updates and removal:

- Native Codex or Claude Code plugins: the host’s plugin manager.
- Ordinary Skills CLI: that Skills manager and its lockfile.
- Begin ZIP receipt installation: its `status`, `update`, `remove` and `recover` commands.

Do not run receipt commands against native plugins or manager-owned Skills. Do not install multiple copies of the same Begin Skills into one discovery context without checking existing ownership and local edits first. Same-name conflicts can affect selection, and unattended Skills CLI installation can overwrite a folder.

Keep a release as one versioned unit. An immutable tag stays fixed; selecting a newer edition requires the newer source. Installed Skills may include `RELEASE.json` for integrity inspection, but ordinary Skill use does not depend on Begin’s receipt installer. Updating the pack should preserve the generated website and `BEGIN.md`.

## Runtime and model expectations

Begin’s supplied creation and preview helpers require Node.js 24; the backend example also needs its pinned dependencies. The optional Skills CLI 1.7.2 requires Node.js 22.20 or later. Use Node.js 24 when you want to install and run Begin’s helpers in the same environment.

The Agent needs permission to read resources, edit website files, run appropriate commands and inspect a preview. Terminal, browser, networking and persistent process access vary by host. When a capability is unavailable, identify the blocked step and offer an accessible next action.

Begin installs no remote MCP server, automatic feedback uploader or model subscription. The optional third-party Skills CLI has its own installation telemetry; the documented commands disable it. Model-independent packaging does not establish equal results on every model or host.

Accounts, payments and private data have professional methods and examples. Their production integrations and visitor-facing actions need project-specific checks. A local preview, saved enquiry, delivered email and publicly working website are different outcomes.

## Help and feedback

Ask your Agent to inspect the actual error and current project. Start with [troubleshooting](docs/TROUBLESHOOTING.md). To share an experience, [open an Issue](https://github.com/cogine-ai/begin-skills/issues/new/choose); [a few words are enough](docs/FEEDBACK.md). Report possible vulnerabilities through [the private security route](SECURITY.md).

The release repository supplies native catalogs; it is not a listing in a host-operated plugin store. Installation checks, model-led workflow evidence and each host’s interface coverage remain separate.

## Format references

The current route research uses the [Skills CLI](https://github.com/vercel-labs/skills), [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins), [Codex plugin developer commands](https://learn.chatgpt.com/docs/developer-commands#codex-plugin) and [Claude Code plugin installation](https://code.claude.com/docs/en/discover-plugins). A documented format is narrower evidence than a complete Begin user flow.
