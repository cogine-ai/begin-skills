---
name: begin-setup
description: Set up or repair Begin's project guidance in a workspace, check installed resources and available tools, and establish a short BEGIN.md record for continued work.
---

# Begin setup

Prepare the selected workspace for website work. Inspect its existing conventions, preserve the person's files, and leave a clear next action. Setup configures the project; installation uses the Agent host's supported delivery path.

## Inspect before configuring

Identify the selected workspace and any existing website directory. Read applicable project instructions, `BEGIN.md`, repository status, and actual project commands. Resolve the installed package from the loaded resource path. Read its version and support information when available; file presence alone does not establish native installation or runtime support.

Check the tools the host actually exposes for files, execution, and preview. Verify an existing project's run command when useful and authorized. For an empty workspace, record that no website runner exists yet. Ask only about a missing workspace or requirement that changes setup. Keep the existing stack and accounts; setting up guidance does not require an architecture decision or hosting subscription.

For a receipt-based Codex installation, run the installed helper's `status --project` command and read its concise version and integrity result. Load the note template and instruction guidance needed for setup. Keep large asset inventories and full file-hash lists out of the conversation. Setup should leave a short useful record and the next request.

## Establish the project record

Use [the note template](assets/BEGIN.md) for a new record. Fill known fields from the person's request and inspected files; keep unknown fields explicit. On repeat setup, update only changed facts and unresolved configuration. Preserve accepted design, content, commands, and user edits.

If a previous edition has `BEGIN_PROJECT.md`, read it. When `BEGIN.md` is absent, migrate the record without losing its contents and update affected local pointers. When both exist, reconcile their differences into the current record and retain unresolved material until its meaning is clear. Do not replace either file with a blank template.

Use the current workspace as the instruction scope. If the website will be created in a new child directory, record the intended destination; leave that directory absent so an exclusive creation helper can create it. Update the project's pointers when the final website location is known.

## Connect existing instructions

Read [instruction integration](references/instructions.md). Add one small pointer in the existing host-appropriate instruction file. Preserve its hierarchy and surrounding text. When no instruction file exists, use the host's supported convention; avoid creating competing instruction files to guess compatibility.

Keep the note focused on purpose, accepted choices, current files, actual commands, setup, checks, and the next action. Credentials, visitor messages, full transcripts, and automatic feedback uploads do not belong in it.

## Check and finish

Verify the note and instruction pointer resolve in the selected workspace. Inspect the diff for unrelated changes. Report the actual resource/version observations, usable run/preview path or its specific limitation, and remaining setup. Suggest a plain-language next request suited to the person's goal. A repeat run should preserve settled work rather than restart onboarding.

## Optional ZIP receipt installation

Use this section only when the person supplied a complete extracted ZIP and asked to install it. Native plugins and Skills-manager installations use their host manager and do not require a Begin receipt.

For the complete portable Skills ZIP, use `scripts/install-codex.mjs install --project /absolute/workspace/path` from its extracted `begin-setup` directory. The helper verifies the release before writing and preserves existing instructions and other Skills. Its `status`, `update`, `remove` and `recover` commands use the managed installation receipt. Preserve same-name installations and local edits before resolving a conflict. Start a new chat after installation so the host can discover the Skills, then perform setup.
