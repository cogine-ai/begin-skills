# Begin in Codex

Open your website folder in Codex and copy this request:

> Install Begin from https://github.com/cogine-ai/begin-skills/tree/begin-skills-v0.1.0-alpha.5 using Codex’s native plugin manager. Preserve my existing instructions and website files, then help me start.

Codex manages the plugin for your user. Your website and its setup stay in the folder you choose. Begin includes fifteen Skills and their complete references, fonts, starters, examples and scripts.

The shared [installation guide](INSTALL.md) owns the pinned Alpha.5 source and exact installation checks. Use the dedicated public release repository above; preserve an existing installation before changing its source.

## Set up once

After installation, start a new conversation in the same website folder and say:

> Use Begin to set up this workspace for my website. Preserve my existing instructions and files.

If native-plugin discovery needs help, use `$begin-skills:begin-setup`. Setup creates or updates a short `BEGIN.md`, checks available tools and adds a small project-instruction pointer. It preserves your existing choices. Setup and website making are separate tasks.

## Make a first website

Describe your work, visitors and the action you want them to take. For example:

> Use Begin to make my website in ./site. I’m an independent professional. Help visitors understand what I offer, explore my work and contact me. Suggest a fitting visual direction, keep any example projects clearly labelled and give me a working local preview. Record the useful decisions so I can continue next time.

Supply your real content and contact destination when available. The Maya Ellis service starter is an editable starting point; its identity and three concept projects are illustrative. Begin also includes other starters and design references for different tasks.

If native-plugin discovery needs help, use `$begin-skills:begin-website`. The Agent should give you an actual localhost URL and keep its preview available while you use it. Open it in Codex’s browser or your ordinary browser. Begin’s supplied creation and preview helpers need Node.js 24. Browser inspection and background processes depend on the tools available in that Codex session.

## Make a visible change

Once you can see the site, say:

> Give my work examples more room and shorten the introduction. Keep my services, contact destination and accepted visual direction. Show the changed preview and update the project note.

For a design review:

> Review the actual phone and desktop pages, including the inner pages. Improve the most important problems in typography, composition, wrapping and alignment while preserving my content and working actions.

The Agent should inspect the current files, preserve a recoverable scoped change and check the result with its available tools. If it cannot inspect the browser, it should say what remains unchecked.

## Continue in a new chat

Open the same website folder and say:

> Use Begin to continue my website from the current files and BEGIN.md. Show me the current preview, keep the decisions I’ve accepted and help me finish the next useful change.

Your editable site remains independent of the installed pack. `BEGIN.md` supplies context and actual run commands; it does not move files between computers or reconnect service accounts.

## Update or remove

Use Codex’s plugin controls for a native installation. Ask Codex to check Begin’s installed version before updating. A release tag is fixed: moving to the next edition requires that edition’s source, rather than expecting the Alpha.5 tag to change. Removing the plugin should leave your website and project notes in place.

If you installed through the Skills CLI, use that manager. If you installed through Begin’s ZIP receipt installer, use the separate fallback lifecycle below. Do not mix their update and removal commands.

## Advanced: native Codex CLI

The checked command shape is:

```sh
codex plugin marketplace add cogine-ai/begin-skills --ref begin-skills-v0.1.0-alpha.5
codex plugin add begin-skills@begin
```

The marketplace source must exist and be accessible first. These commands install a native user plugin; there is no project-scope flag on this Codex path. Inspect an existing marketplace named `begin` before registering another source under that name.

Use `codex plugin list` to inspect discovery and `codex plugin remove begin-skills@begin` to remove a native installation. Removal is distinct from removing its marketplace registration. Use the host’s controls to choose a later release source.

These CLI commands do not establish that every Codex desktop or IDE version offers the same interface or has completed Begin’s full making flow. See [Support](SUPPORT.md) and [Status](STATUS.md) for actual host evidence.

## Advanced: ordinary Skills installation

A Skills-manager installation is an alternative when native plugins are unavailable. Before installing, inspect existing `begin-*` names in the host’s project Skills directory and preserve any local edits. Do not add `--yes` to bypass this check: the CLI can overwrite same-name Skills.

From the website folder, a Unix-style terminal command is:

```sh
DISABLE_TELEMETRY=1 DO_NOT_TRACK=1 npx skills@1.7.2 add https://github.com/cogine-ai/begin-skills/tree/begin-skills-v0.1.0-alpha.5/plugins/begin-skills/skills --agent codex --skill '*' --copy
```

Use the full clean delivered Skill directory. The pinned Skills CLI requires Node.js 22.20 or later; Begin’s own helpers require Node.js 24. The environment settings disable that third-party CLI’s installation telemetry. Let the Agent adapt environment-variable syntax for a different shell.

The manager owns this installation. Keep its lockfile and use its own checks, updates and removal. Copied Skills use the unprefixed `$begin-setup` and `$begin-website` names if explicit discovery is needed. Native plugin Skills use the namespaced names above. No Begin ZIP receipt is required for ordinary Skills use.

## ZIP fallback

Use the complete Alpha Skills ZIP named in the installation guide. Extract it into a new folder outside your website folder; neither folder may contain the other. Tell Codex where it is, then ask:

> Install the extracted Begin pack into this workspace using its Codex installer. Preserve my existing instructions and files. Tell me what was installed and how to start.

The receipt installer verifies `RELEASE.json` and every delivered file before adding the fifteen project Skills under `.agents/skills/`. It records ownership under `.agents/begin/`. Existing Begin names cause a conflict rather than an overwrite. This is a separate project-Skills fallback, not the native plugin path.

If you prefer a terminal, run from the complete extraction root:

```sh
node begin-setup/scripts/install-codex.mjs install --project "/absolute/path/to/my-website"
```

Use the actual website path. Start a new conversation in that website folder after installation. These project Skills use the unprefixed `$begin-setup` and `$begin-website` names when explicit discovery is needed.

### Check, update or remove a receipt installation

Use these commands only if Begin’s receipt installer installed the pack. From the website folder, check it with:

```sh
node .agents/skills/begin-setup/scripts/install-codex.mjs status --project .
```

To update, obtain and verify the next complete release. From that new extraction:

```sh
node begin-setup/scripts/install-codex.mjs update --project "/absolute/path/to/my-website"
```

Each distributed version has fixed bytes. A changed payload with the same version is refused. The installer checks managed files and preserves the preceding version outside discovery; changed or missing managed files stop the update for inspection.

To remove a receipt installation, run from the website folder:

```sh
node .agents/skills/begin-setup/scripts/install-codex.mjs remove --project .
```

Removal preserves website files, project notes, existing instructions, other Skills and retained previous versions. It refuses to remove changed managed files.

For an interrupted receipt operation, use the retained complete extraction:

```sh
node begin-setup/scripts/install-codex.mjs recover --project "/absolute/path/to/my-website"
```

Read its report before retrying. Recovery preserves unknown material and refuses an active installation lock. An interrupted first installation may leave no installed helper.

## Agent appendix: preview commands

Locate the loaded `begin-website` Skill and read `references/helpers.md`. Native plugins and Skills managers use different locations, so do not assume an installed path. Substitute the actual helper path:

```sh
node "<loaded begin-website directory>/scripts/preview.mjs" --dir ./site --port 0 --background
node "<loaded begin-website directory>/scripts/preview.mjs" --dir ./site --status
node "<loaded begin-website directory>/scripts/preview.mjs" --dir ./site --stop
```

Read the actual URL returned by the first command and record the actual commands in `BEGIN.md`. Stop the owned preview when finished. If detached processes are blocked, use the host’s persistent foreground terminal and stop it with Ctrl+C.

Next: [troubleshooting](TROUBLESHOOTING.md) or [share an experience](FEEDBACK.md).
