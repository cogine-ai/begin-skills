# Keep working when something gets stuck

Tell your Agent what happened and ask it to inspect the actual error and current files:

> Help me continue this Begin website. Check the installed pack, BEGIN.md and the current files. Explain the specific problem, preserve my work and fix the next useful step.

## Begin is not found

Check that the plugin or Skills are enabled for the folder you opened. Start a new conversation after installation. Ask the Agent to locate and read the actual `begin-setup` Skill, then try the explicit invocation in the [Codex](CODEX.md) or [Claude Code](CLAUDE_CODE.md) guide.

A registered marketplace, downloaded archive or list of Skill names does not establish that the Agent loaded Begin. Confirm it can read a bundled resource and find the website helpers.

## Installation or updating fails

Use the manager that installed Begin. Native plugins are updated and removed through the host’s plugin controls; a Skills-manager installation uses that manager. The Begin receipt installer is only for a pack installed through that ZIP fallback.

If a repository is private, use existing authorized access. If you do not have access or the named release is absent, use the supplied complete ZIP instead of guessing a source or substituting a development snapshot.

For a same-name Skill conflict, preserve the existing folders and inspect who manages them. Do not use an unattended command to overwrite them. Detailed fallback checks and recovery are in [Begin in Codex](CODEX.md).

### The ZIP installer reports `Release integrity check failed`

The ZIP fallback checks all files in the extracted release against `RELEASE.json`. An extra file can stop installation or updating, including `.DS_Store`, `Thumbs.db`, `desktop.ini`, notes, or files inside `__MACOSX/`. For example:

```text
Begin: Release integrity check failed:
Added: .DS_Store
```

`Added`, `Changed` and `Missing` identify differences from the delivered release. Keep the current extraction and any edits or notes. Preserve your website, installed Skills and project instructions.

1. Check the official ZIP's named version and SHA-256 against the supplied release record. If either differs, stop and obtain the correct archive. Do not edit `RELEASE.json` or bypass verification.
2. Extract that untouched ZIP into a new directory outside your website folder. Neither directory may contain the other. Ask the Agent to extract it without adding files to the release; opening the folder in a file manager may add metadata again. Keep the previous extraction for inspection rather than deleting unknown files.
3. Run the original `install` or `update` command from the new complete extraction, with the same website path. Use `update` only for a pack managed by the ZIP receipt installer. See [the ZIP fallback](CODEX.md#zip-fallback) for the command and lifecycle checks.

If a fresh extraction still fails, keep the exact error and ask the Agent to inspect the archive and extraction tool. Changed or missing delivered files require investigation before retrying.

## A helper cannot run

Begin’s creation and preview helpers need Node.js 24. Ask the Agent to check the actual runtime and error. The separate Skills CLI can have a lower runtime requirement; that does not change the requirement for Begin’s helpers.

If a new website directory already exists, edit that website or choose a new destination. Do not run a creation helper over existing work.

## A conversation stopped before finishing

Open the same workspace in a new conversation. Ask Begin to inspect the current files and `BEGIN.md`, preserve completed work and finish the next useful step. Keep any earlier comparison or recovery files. If a design choice was not recorded, supply that choice rather than repeating setup or rebuilding the site from scratch.

## The preview will not open or has stopped

Ask the Agent to check the server and actual URL. It should locate the loaded `begin-website` Skill, inspect that website’s preview with `--status` and restart with `--background` when appropriate. Use `--stop` for an owned preview before a deliberate restart. If detached processes are unavailable, use the host’s persistent terminal.

The helper can select an available port with `--port 0`. Stop only the preview owned by this task. The URL is local to the computer running the preview; remote environments may need the host’s supported forwarding path.

## The website looks wrong

Ask for a focused edit that keeps your accepted direction and content. Check the affected page on a phone and desktop, including inner pages. If the Agent cannot inspect a browser, keep that visual check open.

For missing images or fonts, check the actual asset paths and included files. Replace illustrative identities, contact details and concept work with your material, or retain clear example labels.

## A contact action or service fails

A contact link, saved enquiry, delivered email and completed booking have different checks. Ask the Agent to inspect the real service response and stored state. Do not treat a success message on the page as delivery proof.

For the enquiry example, check its local setup, credentials, session and owner access. Keep visitor data and credentials private. Publishing failures need the actual build or service error and a check at the deployed URL before the Agent retries an operation with external effects.

Your Agent can record the problem and next step in `BEGIN.md`. If you choose to [share feedback](FEEDBACK.md), a short description is enough; remove secrets, private paths and visitor information.
