# How people use Begin

Updated: 2026-10-13. This document explains the Alpha interaction. Follow [installation](INSTALL.md), [Begin in Codex](CODEX.md) or [Begin in Claude Code](CLAUDE_CODE.md) for your host. Consult the release's `STATUS.md` for current observations and `SUPPORT.md` for host boundaries. The guides are at the plugin root and in the portable website Skill's `assets/guides/`.

## Project setup, then ordinary conversation

Install the complete compatible pack once. Use the host's `begin-setup` entry to configure the selected workspace:

> Use Begin to set up this workspace for my website. Preserve my existing instructions and files.

Setup inspects the environment and existing conventions, establishes `BEGIN.md`, and integrates a concise instruction pointer. Repeated setup preserves settled work. It does not build the website or choose a stack. For an intended child website, leave its directory available for creation.

Then use `begin-website` and describe the website in ordinary language:

> Use Begin to build a website for my consulting business. Help people understand my services and contact me. I don't have a design direction yet.

The person should not need to choose the professional Skills, know a technical stack, or write a detailed development prompt. A focused task may use a specific capability directly. Installation must expose the host's exact setup and making entries and a fallback when discovery fails; public one-click installation remains release work.

## Making and continuing

| Step | What the person does | What the Agent handles | Visible result |
| --- | --- | --- | --- |
| Start | Describes an idea or points to an existing site | Loads the Begin entry, reads existing instructions, and checks the actual file/preview environment | A clear next action, or a specific environment limitation with a workable path |
| Establish the task | Supplies a missing goal or consequential choice | Reuses accepted requirements; clarifies behavior, content, scope, and completion at the necessary depth | A small working brief or an update to the existing contract |
| Make | Supplies material when available; can proceed with labeled examples | Selects relevant guidance, adapts a starter or the existing site, and gives the result its own content and identity | A personalized preview through a supported path |
| Refine | Says what should change | Edits existing source and preserves accepted choices, content, and destinations | The requested change in the preview |
| Complete the action | Supplies the actual contact, booking, or other destination when needed | Checks the primary action to the level agreed for this stage | A configured and tested action, with any remaining service setup stated |
| Continue | Returns in a new session or another supported Agent | Reads current files and the project note, locates available Skills, verifies the environment, and resumes | Work continues from the current site |

The first useful result follows the product plan: a personalized preview, one meaningful edit, and a working primary action for the agreed scope. An early preview is useful for feedback before all configuration is finished; it is not proof that the complete flow works. Do not infer satisfaction from the Agent saying the site looks good.

When the initial brief is sufficient, proceed with a sensible direction. When a material choice is uncertain, give one recommendation and a useful alternative. Avoid a large intake questionnaire or asking the person to decide implementation details. Missing photography can be handled with typography, original diagrams, or clearly labeled concept work. Facts about the owner must remain accurate.

## How specialist Skills work

A Skill supplies instructions and resources to the host Agent. The Alpha has no separate Agent orchestration engine or worker, or automatic execution callback. The local preview helper can run an owned background server. One Agent uses relevant guidance as it works; a host may support other execution mechanisms, but the pack does not depend on spawning separate specialists.

| Person's request | Relevant Begin guidance | What to verify |
| --- | --- | --- |
| "Build my website" | Website entry; design, content, and frontend for the creation; quality for review | The site matches the brief, opens in the supported preview, and has the agreed action |
| "Make it feel more personal" | Design; content if wording changes; frontend for implementation; quality for the changed view | The change is visible and accepted content/actions remain intact |
| "Rewrite the introduction" | Content; frontend if source/layout changes; quality for relevant wrapping and links | The message is accurate, readable, and fits the page |
| "Write a researched article" | Content and the current website's reading layout | The article answers its reader, distinguishes facts from recommendations, and supports factual claims |
| "Help people use this feature" | Writing Docs | An unfamiliar reader can follow accurate steps and understand expected outcomes |
| "Add a form that saves enquiries" | Frontend, backend, data, security; services if an external provider is needed; quality | Valid input persists, errors are clear, and records are scoped to the intended owner |
| "Add payments" | Backend, security, services, and data as needed; frontend for the purchase interface; quality | Payer/receiver roles, actual payment outcome, durable business records, and access behavior |
| "Publish my website" | Publish; services for the selected host; security and quality for relevant release checks | Intended destination, public URL, and visitor action |
| "The phone layout is broken" | Quality to establish the defect; frontend to repair; design when composition needs revision | The failing widths and nearby layouts, controls, and accepted choices |
| "Review this design honestly and improve it" | Design for consequential visual choices; quality for actual renders and a scoped revision | Concrete composition/type/reading issues, comparable before/after views, working actions and remaining tradeoffs |
| "Set up Begin in this project" | Setup | Preserved instructions/files, a current note, and actual environment observations |
| "How should this feature fit our existing system?" | Architecture | Rule/data ownership, interfaces, dependencies, tradeoffs, and source-backed current behavior |
| "Study how these similar products organize the task" | Learn Products | Inspected pages/flows/states, source limits, and an original structure proposal |
| "Make this architecture or setup guide easy to understand" | Writing Docs | Preserved technical meaning, precise terms, and usable concise English |
| "Draw this flow or data model" | Diagrams | Appropriate Mermaid type, correct semantics, and clearly reported syntax/render checks |

Load only the Skills and references needed for the current step. A small copy edit does not need payment or database guidance. Discover a specialist through the host's real mechanism, or read its installed instruction/resource files when the host supports that path. Record resources actually used; a list of suggested Skills is not evidence of use.

This task map lives in pack guidance. Individual operational Skills remain focused on their own task and avoid cross-Skill catalogs or mandatory invocation chains. Architecture, structure research, writing, and diagrams support relevant requests without becoming compulsory steps for a small website.

When a specialist is missing, name the specific gap and decide whether the available resources support the task. Continue useful work that the environment can actually perform. Do not silently substitute a mock for promised functionality or claim a missing Skill ran.

Articles and usable manuals are first-edition content tasks. [Extensions](EXTENSIONS.md) distinguishes supplied account/private-data examples from payment and hosted integrations that need their own implementation and checks.

## Working with other installed Skills and tools

The person may already use design Skills, component guidance, a provider plugin, or a domain-specific pack. Begin should cooperate with that setup:

1. Follow the host's actual instruction hierarchy and the user's explicit choices. Read project instructions and inspect the current stack before choosing guidance.
2. Discover installed resources relevant to the task. Prefer an existing appropriate provider or component workflow; avoid loading overlapping libraries wholesale.
3. Give the selected resources clear roles: Begin organizes the making/continuation flow; a specialist informs a defined decision or integration. Resolve advice in the context of the accepted brief and current project.
4. Preserve accepted design and functionality. If two recommendations conflict, explain the material tradeoff and use the user's goal and project constraints to resolve it. Ask only when the remaining choice needs the person's input.
5. A Skill does not grant a missing tool, provider credential, subscription, or preview capability. Account setup or external actions follow the user's actual authorization.

For example, an installed frontend-design Skill can inform a visual direction; a relevant shadcn Skill can guide the project's existing components; an installed payment plugin can supply provider-specific instructions. The task still needs an integrated result and appropriate verification.

Refero and Mobbin are optional research sources. If the user requests them and an appropriate connector/account is available, inspect relevant references. The local starting experience uses included methods, original assets and user-supplied material; it should not require either research subscription. The [Fieldnotes case](../skills/begin-design/references/fieldnotes.md) includes original screenshots and matching source for a scoped editorial task. The two [Reviewroom cases](../skills/begin-design/references/reviewroom.md) provide complete original product compositions and local review flows for tasks where work, versions and decisions matter. Choose the relevant case and adapt its relationships to the new subject. The Alpha service starter has been refined using real-content font comparisons and rendered review. That local work has its own evidence; it does not establish that every starter follows the external research shortlist. See [Website design references](WEBSITE_DESIGN_REFERENCES.md).

For reference-led work, an Agent should inspect the relevant images and implementation when adopting its decisions. Available files do not establish that they were read. A record of the few resources actually used helps continuation. Visual refinement should inspect the actual output, including inner pages, and give consequential criticism. A fresh perspective can help when available; the pack also works with a focused self-review.

## Returning, changing hosts, and recovery

Keep `BEGIN.md` short: purpose, accepted direction, current files/commands, resources actually used, checks, missing setup, and next action. The editable website remains independent of the installed pack. Updating the pack does not automatically rewrite it.

Record the latest scoped recoverable change when editing existing work. A request such as “Undo that last change, but keep my content” should recover the affected state and verify the result. The historical Codex trials established targeted repair. Retaining a recovery snapshot and actually undoing a change are separate checks; consult the current Alpha observations before claiming either.

In a new chat, the person can say:

> Use Begin to continue my website from the current files and project note. Make the work examples larger and keep my services and contact destination.

A host change requires access to the website files, relevant installed resources, and a usable execution/preview path. A project note supplies context; it does not move files, reconnect accounts, or prove that another host can run the same commands.

If the preview stops, diagnose the existing files and process before changing the site. If Begin is not discovered, use the host's documented explicit entry. If a requested feature needs a service, finish the useful local work and identify the specific setup next. Follow [Troubleshooting](TROUBLESHOOTING.md) and preserve the person's work.

## What is established, and what needs a trial

| Area | Current evidence | Next validation |
| --- | --- | --- |
| Setup and discovery | Fifteen independent Skills are present. An actual Alpha project installation and natural-language setup preserved existing files and established `BEGIN.md` | Observe discovery and resource selection during more tasks and with an unfamiliar person |
| Making and preview | Alpha.1's four-page website was made, rendered, edited and continued in separate Codex CLI sessions with project Skills. The owned preview remained reachable after the final CLI process exited. Current installation scope belongs to `STATUS.md` | Observe an unfamiliar person's first-use experience |
| Earlier continuation and repair | Three historical Codex 0.161.0 trials explicitly invoked `$begin-website`; a separate browser environment checked their scoped repairs | Keep those results distinct from the current Alpha workflow and from undo recovery |
| Codex lifecycle | Installation, status, update, removal and reinstallation have local preservation checks; interruption and recovery have independent tests and audits | Test desktop onboarding and an unfamiliar person's lifecycle separately |
| External Skills | Alpha sessions retain the existing user configuration, and installation preserves an unrelated project Skill. Earlier trials ignored that configuration | Test actual cooperation with an overlapping design Skill and a relevant provider/component Skill |
| Functional extension | The separate persistent enquiry example passed HTTP/browser checks | An Agent integrates a requested form and private inbox into an existing website, then verifies persistence and owner access |
| More hosts/models | Delivery candidates and guidance exist; coverage differs by host | Repeat the useful flow on each claimed host/model combination |

The next compact trial should use an ordinary person with a short website idea and limited assets, then add a real requested edit. Record assistance, actual resource use, preview access, action checks, and the person's own reaction. A second task should extend an existing project that already contains another relevant Skill. Unknown or unavailable observations stay unknown. Do not interpret synthetic trials or written routing guidance as an overall user success rate.
