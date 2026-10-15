# Make the website you have in mind

> We’ve spent years turning people’s ideas into websites. Now, we’re putting that expertise in your hands.

Begin gives your AI Agent practical skills, original website examples and guidance for the work. You describe what you want to make, see a preview and shape it from there.

## Install Begin

Open the folder for your website in your Agent. Copy the installation request in [Begin in Codex](CODEX.md) or [Begin in Claude Code](CLAUDE_CODE.md). The normal route uses the host’s plugin manager; a Skills-manager route and a ZIP fallback are also described in the [installation guide](INSTALL.md).

Keep your website in your own project folder. Begin’s supplied creation and preview helpers need Node.js 24. Installation availability and actual host checks are listed in [Support](SUPPORT.md).

## Set up once

After installation, start a new conversation in the same website folder and say:

> Use Begin to set up this workspace for my website. Preserve my existing instructions and files.

Setup checks the tools and resources available to your Agent and creates or updates a short `BEGIN.md` project record. It preserves existing choices and can record where a new website will go. Setup and website making are separate tasks.

## Describe your idea

Then say:

> Use Begin to help me build my website. I’m an independent professional. I want people to understand my work and contact me. I’m unsure about the design. Suggest a direction and help me see a working preview.

Use your own words. You can make a portfolio, service website, product page, article, documentation site or interactive tool. Add your content, images or references when you have them. Your Agent should ask for the few details it needs and choose resources that fit the job.

The included examples use illustrative identities and concept work. Supply your real name, offer and contact destination. Keep examples marked until you replace them.

## See it and make it yours

Open the actual local preview URL your Agent provides. Try a focused request:

> Give my work examples more room and shorten the introduction. Keep my services, contact destination and accepted visual direction. Show the changed preview and update the project note.

For a design review:

> Review the actual phone and desktop pages, including the inner pages. Improve the most important problems in typography, composition, wrapping and alignment while preserving my content and working actions.

Your Agent should inspect the current files, preserve a recoverable scoped change and check the result with its available tools. If it cannot inspect the browser, it should tell you what remains unchecked. Ask it to keep the preview available while you use it and stop it when you are finished.

## Come back and continue

Open the same website folder in a new conversation and say:

> Use Begin to continue my website from the current files and BEGIN.md. Show me the current preview, keep the decisions I’ve accepted and help me finish the next useful change.

Your source stays in your workspace. `BEGIN.md` keeps useful decisions and actual run commands; it does not move files between computers or reconnect service accounts.

## Ask for the work you need

You do not need to name every Skill. Ask for the result: “Rewrite my introduction,” “Fix the phone layout,” “Write a researched article,” “Make this operation guide usable,” or “Add a form that saves enquiries.” If you already use another specialist Skill, ask your Agent to use it with Begin and preserve the project’s accepted choices.

Local preview needs no hosting account. Publishing uses an existing hosting path and your authorized destination. Accounts, payments and private data have professional methods and examples; their concrete production integrations need project-specific work.

Next: [starter choices](TEMPLATES.md), [the workflow](WORKFLOW.md), [troubleshooting](TROUBLESHOOTING.md) or [share an experience](FEEDBACK.md).

## Agent appendix: supplied helpers

Locate the loaded `begin-website` Skill and read its `references/helpers.md`. Use the actual installed path supplied by the host rather than assuming `.agents/skills/`: native plugins and Skills managers can use different locations.

The creation helper supports `--template service|portfolio|product|editorial`, `--output NEW_DIRECTORY` and an optional `--contact` mailto or HTTPS destination. Do not regenerate over an existing website.

The preview helper supports `--dir DIRECTORY --port 0 --background`, reports the actual local URL and provides `--status` and `--stop` for that website. Use a persistent foreground terminal if the host prevents detached processes. Record the actual helper path and commands in `BEGIN.md` so the next conversation can continue.
