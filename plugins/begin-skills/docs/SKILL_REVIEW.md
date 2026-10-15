# Begin Skill review and usage guidance

Review date: 2026-10-09. Audience: product authors and maintainers.

This records the initial review of ten Skills, the owner's subsequent decisions, and the source changes for `0.1.0-dev.2`. It also researches Matt Pocock's published approach. Source editing and format checks do not establish new host support. [Contents](../CONTENTS.md) maps delivered resources. [Status](../STATUS.md) owns runtime evidence. [Usage model](USAGE_MODEL.md) owns the intended user experience.

## Current edition: owner decisions and additions

The owner selected a dedicated setup Skill and the name `BEGIN.md`. The website-making Skill no longer contains a catalog of other Skills or an invocation chain. Professional Skills are independently useful; the task map stays in the pack's guides. Sources are recorded in [method provenance](METHOD_SOURCES.md), with selective adaptation into original, focused instructions.

| Addition | Task and meaningful result | Boundary |
| --- | --- | --- |
| [begin-setup](../skills/begin-setup/SKILL.md) | Inspect project/tool/resource state, initialize or reconcile `BEGIN.md`, and integrate a concise project-instruction pointer | Preserve existing work; installation remains a host delivery action; no website generation or architecture selection |
| [begin-architecture](../skills/begin-architecture/SKILL.md) | Ground domain/rule/data ownership, interfaces, and dependencies in real flows; explain a concrete structural decision | Match depth to the change; no default platform, fixed ADR tree, or speculative scaling |
| [begin-learn-products](../skills/begin-learn-products/SKILL.md) | Inspect comparable products and map relevant pages, flows, roles, states, and information into a useful structure brief | Distinguish observed/documented/source-backed/inferred behavior and original proposals |
| [begin-writing-docs](../skills/begin-writing-docs/SKILL.md) | Write or edit technical explanations and instructions with precise terms and concise English | STE-inspired methods; no full standards-compliance claim or mechanical restriction of brand writing |
| [begin-diagrams](../skills/begin-diagrams/SKILL.md) | Choose and produce a useful Mermaid representation of established information | Check syntax, meaning, and presentation separately; no invented architecture or mandatory diagram |

The source now has fifteen Skills. The original ten receive focused methods, outcome/check guidance, and relevant examples. The individual review below preserves the issues identified before this editing pass; the status document records which improvements have actual task evidence.

## Recommendation

Keep a recognizable task, useful result, and clear handoff for each capability. Deepen methods and examples that make the result better. Add a Skill when it solves a distinct recurring task, has useful independent instructions, and is easier to activate and maintain separately. The five additions above fill the owner-identified tasks.

The current candidate contains professional foundations and several working examples. Its guidance is uneven: frontend repair has an observed Agent task; content writing, security review, hosted service integration, and publication still need their own trials. Ten valid Skill files do not establish ten mature capabilities.

Begin's commercial promise depends on the person's resulting website and ability to improve it. A Skill earns its place when it helps the Agent make a decision, perform a task, or recover a result more reliably. General advice that the model already follows needs a concrete method or example to justify the extra context.

## 1. Initial individual Skill analysis

The inputs and outcomes below are recommended authoring contracts. They need to be expressed concisely in the Skill or its focused references. An outcome may be source changes, a working interaction, a design decision, or a useful diagnosis; it need not be a separate document.

| Skill | Main responsibility | Recommended outcome | First improvement |
| --- | --- | --- | --- |
| `begin-website` | Guide creation, focused changes, and continuation | A useful next result and enough context to continue | Define first-use and resume behavior, specialist selection, and missing-capability handling |
| `begin-design` | Choose a visual direction that fits the website | Explained design choices, expressed in a visible composition | Add annotated reference-based choices and alternatives |
| `begin-content` | Express the owner's offer and identity in English | Accurate page and interface copy suited to the intended action | Add a fact-grounded editing example and treatment of missing material |
| `begin-frontend` | Implement and repair the interface | Working source and verified changed behavior | Test a focused task in an existing framework project |
| `begin-backend` | Make a server-side action work | A defined API/action and actual success and failure behavior | Integrate the enquiry example into an existing website through an Agent task |
| `begin-data` | Preserve and evolve durable records | Schema, migrations, queries, and checked data behavior | Demonstrate migration of existing data and recovery |
| `begin-security` | Find and repair relevant exposure or access defects | Specific findings, scoped fixes, and evidence from rechecks | Add an actionable review example and an independent review task |
| `begin-services` | Select and coordinate an external service path | Requirements, provider handoff, configuration, and a checked integration outcome | Clarify provider-specific delegation and verify one actual connection |
| `begin-publish` | Put the intended version at the intended destination | A checked deployment, access state, and update/recovery path | Complete one real deployment lifecycle |
| `begin-quality` | Check the delivered result and diagnose failures | Relevant defects, repairs, check results, and remaining limits | Standardize a short result summary and test an integrated visitor action |

### 1. `begin-website`

Source: [Skill](../skills/begin-website/SKILL.md), [workflow](../skills/begin-website/references/workflow.md), [project guidance](../skills/begin-website/assets/project-guidance/AGENTS.md).

- **Use:** a new website, an existing-site improvement, a return to unfinished work, or a request spanning several capabilities. Read the current files, instructions, purpose, primary action, and available execution/preview environment. Ask for information that changes the next task.
- **Value and boundary:** organize the person's task and preserve accepted work. Specialists supply the relevant decisions and implementation. The entry should choose a small useful next step, with an early preview when appropriate.
- **Current resources and evidence:** three starters, create/preview helpers, workflow references, and project-note templates. Three synthetic Codex sessions explicitly invoked the entry for creation, continuation, and repair. Natural-language discovery, another installed pack, undo, and native installation lifecycle remain untested.
- **Gap:** the first-use environment check, minimal project setup, specialist handoff, and continuation result need a shared concise contract. Naming a specialist in a table is insufficient evidence that the Agent used it.
- **Next edit and trial:** distinguish new/existing/resume tasks; state what the person should see and what the next Agent needs. Trial an unfamiliar person's short request and a fresh-session edit. Record assistance, actual resource use, preview access, action behavior, and the person's response.

### 2. `begin-design`

Source: [Skill](../skills/begin-design/SKILL.md), [direction](../skills/begin-design/references/direction.md), [polish](../skills/begin-design/references/polish.md).

- **Use:** establish or revise visual direction. Inputs are audience, actual content, intended action, brand constraints, assets, accepted choices, and relevant references.
- **Value and boundary:** decide why the website should look and behave this way. Content owns the wording; frontend implements the agreed choices; quality checks the delivered page. A design-only task can produce a proposed direction without rebuilding the whole site.
- **Current resources and evidence:** focused principles and original starter compositions. Codex read design guidance during creation and continuation. This proves use in those tasks; it does not isolate the Skill's contribution or demonstrate design transfer across businesses.
- **Gap:** general principles need specific choices and explained tradeoffs. The [Refero/Mobbin research](WEBSITE_DESIGN_REFERENCES.md) is author research; the current starters predate it and have not been revised against it.
- **Next edit and trial:** turn selected references into independently written, annotated decisions: audience/content problem, visual response, reason, alternative, and adaptation limits. Put essential delivered examples inside this Skill. Apply the method to two different briefs and inspect the rendered results. Owner preferences and accurate brand expression need the owner's judgment as well as technical checks.

### 3. `begin-content`

Source: [Skill](../skills/begin-content/SKILL.md), [writing](../skills/begin-content/references/writing.md).

- **Use:** English introductions, offers, About pages, project stories, calls to action, form labels, and success/error text. Inputs are the owner's facts, audience, voice, material, and intended action.
- **Value and boundary:** make the message specific and understandable, including during a copy-only edit. Collaborate with design on hierarchy and with frontend on space and states.
- **Current resources and evidence:** writing methods and original example content. The three recorded Codex trials did not load this Skill. Existing starter copy cannot establish this Skill's effectiveness.
- **Gap:** no worked editing example shows how facts become a clear story. Missing owner information needs explicit treatment; invented claims must never become publishable facts.
- **Next edit and trial:** add one English before/after example with source facts, editorial decisions, unresolved information, and interface copy. Test a focused rewrite while preserving links and accepted facts; check comprehension with people in the intended English-speaking audience. Use a short note for unresolved facts when it affects continuation.

### 4. `begin-frontend`

Source: [Skill](../skills/begin-frontend/SKILL.md), [implementation](../skills/begin-frontend/references/implementation.md).

- **Use:** build or repair pages, components, navigation, and forms. Inputs are the existing stack, accepted direction, actual source, running commands, and observed defects or requested behavior.
- **Value and boundary:** translate the design into working behavior and repair existing work safely. Backend owns server outcomes. Quality establishes the relevant delivery checks; frontend also verifies the changed implementation.
- **Current resources and evidence:** working static components and starter source, focused responsive/interaction guidance. An Agent repaired narrow/intermediate-width overflow and phone targets; independent browser checks confirmed those repairs and preserved accepted content and design variables.
- **Gap:** framework adaptation and performance guidance have less concrete evidence than static layout repair. A checklist of React advice is not proof of effective framework work.
- **Next edit and trial:** add one meaningful component or form change in an existing framework project using its actual commands. Use an available component/framework Skill for specific details. Preserve the stack and verify the requested behavior, nearby layouts, and relevant states.

### 5. `begin-backend`

Source: [Skill](../skills/begin-backend/SKILL.md), [server boundaries](../skills/begin-backend/references/server-boundaries.md), [enquiry example](../skills/begin-backend/assets/enquiry/README.md).

- **Use:** forms, APIs, authenticated server actions, and concrete service events. Inputs are the requested flow, caller/owner roles, runtime, data model, and relevant provider behavior.
- **Value and boundary:** make the action produce a real outcome with defined failures. Data owns durable representation and evolution; security reviews the relevant trust boundaries.
- **Current resources and evidence:** a runnable enquiry/owner example with HTTP and browser checks for persistence, access, validation, sessions, origin/CSRF, idempotency, and bounded failures. These checks verify the example. An Agent has not yet integrated it into a generated website.
- **Gap:** uploads and webhooks are primarily guidance. There is no consistent handoff covering input/output, owner checks, error states, configuration, and actual verification.
- **Next edit and trial:** establish a short action/API contract and integrate the enquiry into an existing site. Exercise valid submission, invalid input, private inbox access, another owner, and restart. Keep the example's teaching-auth limitations visible when selecting real deployment requirements.

### 6. `begin-data`

Source: [Skill](../skills/begin-data/SKILL.md), [modeling](../skills/begin-data/references/modeling.md).

- **Use:** add persistent records, evolve an existing schema, manage relationships or file metadata, or recover stored data. Inputs include ownership, existing records, required queries, constraints, retention, and deployment context.
- **Value and boundary:** preserve data meaning through writes and changes. Backend consumes the model; security checks isolation; a provider Skill can handle concrete database provisioning.
- **Current resources and evidence:** the enquiry's PostgreSQL-compatible local implementation demonstrates persistence after restart, migration idempotency, ownership, and transactions. It does not establish hosted Neon, Drizzle migrations, RLS, or backup/restore behavior.
- **Gap:** guidance on migration evolution, files, and recovery lacks a worked example with existing data. Successful restart persistence does not test restoration from a backup.
- **Next edit and trial:** evolve the small example while preserving prior records; demonstrate a separate restore into a fresh database and check ownership and content. Reuse the backend task's real data contract rather than asking the person for a second technical brief.

### 7. `begin-security`

Source: [Skill](../skills/begin-security/SKILL.md), [checks](../skills/begin-security/references/checks.md).

- **Use:** work involving private data, untrusted input, sessions, service credentials, or relevant release exposure. Read the actual code, data flow, roles, configuration, and changed surface.
- **Value and boundary:** trace a defect across layers and provide an actionable repair. Implementation Skills still own appropriate defaults. Review depth should follow the task; a small static text edit does not require a full security audit.
- **Current resources and evidence:** focused review guidance and implemented enquiry controls with passing tests. These controls do not prove that this Skill can discover an unknown defect.
- **Gap:** no review task or sample finding connects location, conditions, impact, repair, and recheck. A generic checklist gives little help prioritizing a real issue.
- **Next edit and trial:** include one concrete finding and fix, then trial discovery of a representative access defect without disclosing the solution. Check the repaired denial and the authorized positive path. Report the inspected scope and remaining uncertainty; avoid presenting the result as certification.

### 8. `begin-services`

Source: [Skill](../skills/begin-services/SKILL.md), [providers](../skills/begin-services/references/providers.md).

- **Use:** the site needs hosting, identity, payments, email, analytics, storage, database, or error monitoring. Inputs are the actual requirement, existing service, available accounts/tools, environment, and data/privacy constraints.
- **Value and boundary:** choose a suitable path and coordinate its integration. An installed official provider Skill can supply current SDK/CLI instructions. Backend/data own business behavior and durable state; publish owns the deployment destination and outcome.
- **Current resources and evidence:** selection guidance spans eight service areas. No live account integration was provisioned in the candidate. Links to provider documentation and a local enquiry example do not establish connectivity.
- **Gap:** the current description sounds broader than the implemented recipes. This Skill needs a defined handoff and successful end-to-end result for each claimed runnable path.
- **Next edit and trial:** clarify need → provider → setup requirements → implementation handoff → success check. Verify one connection used by a real task. Keep broader selection guidance, grow concrete recipes from use, and provide a workable path when an optional provider Skill is absent. Begin's basic experience must not require a collection of extra plugins.

### 9. `begin-publish`

Source: [Skill](../skills/begin-publish/SKILL.md), [preparation](../skills/begin-publish/references/preparation.md), [Vercel recipe](../skills/begin-publish/references/vercel.md).

- **Use:** prepare, publish, update, diagnose, or recover a website at an actual hosting destination. Inputs include the correct project/build, environment, provider/account, access expectations, and authorization for the external action.
- **Value and boundary:** deliver the intended version and verify visitor access and the main action. Website coordinates the person's flow; services helps choose the provider. The provider's own tooling performs the concrete deployment.
- **Current resources and evidence:** publication guidance and a Vercel recipe; no actual hosted deployment trial. Local helper tests and a preview do not prove public hosting.
- **Gap:** no checked deployment record or tested update/recovery outcome. Static hosting cannot run the separate enquiry server merely by copying its source.
- **Next edit and trial:** complete one deployment lifecycle: intended files/environment, returned URL, access/assets/routes/action checks, update, and a recoverable prior version. Record the environment and remaining configuration without secrets. Public actions need the user's actual authorization; drafting and local preparation can proceed first.

### 10. `begin-quality`

Source: [Skill](../skills/begin-quality/SKILL.md), [review](../skills/begin-quality/references/review.md).

- **Use:** inspect a preview, verify a change, diagnose a reported defect, or review the agreed delivery. Inputs are the brief, requested behavior, actual source, supported tools, and the changed surface.
- **Value and boundary:** check the integrated result, prioritize concrete defects, and guide repairs. Design judgment and the owner's satisfaction remain distinct from measured layout or functional checks.
- **Current resources and evidence:** guidance was improved using observed overflow and touch issues. The repair trial selectively read frontend/quality guidance; separate browser checks verified the resulting layout and hit areas. This is useful bounded evidence, not an overall success rate.
- **Gap:** the final summary is not yet a consistent small deliverable. Persisted enquiries, hosted action completion, and owner acceptance need checks beyond static rendering.
- **Next edit and trial:** report what was inspected, what passed/failed/was unavailable, what changed, and what remains. Repeat checks affected by a repair. In the integrated enquiry task, follow submission through persistence and private retrieval. Ask for the person's judgment when evaluating whether the result feels like their site.

## 2. What Matt Pocock actually does

Primary source: official [mattpocock/skills](https://github.com/mattpocock/skills), inspected at commit `b0618bc436ad893b3c5e84e55fba86586d34a404` (2026-10-08). The following describes that source snapshot, rather than a runtime test or an assumption about every Agent.

### Installation

The README provides host-specific plugin paths and a Skills CLI path for editable copies or other Agents, with update behavior described by host. Installation exposes the Skills. The developer-only `link-skills.sh` is explicitly excluded as a supported installer. [README](https://github.com/mattpocock/skills/blob/b0618bc436ad893b3c5e84e55fba86586d34a404/README.md), [developer script](https://github.com/mattpocock/skills/blob/b0618bc436ad893b3c5e84e55fba86586d34a404/scripts/link-skills.sh).

### Per-project setup

After installation, the user runs `setup-matt-pocock-skills` once per repository. This prompt-driven Skill inspects existing conventions and prepares issue-tracker, domain-document, and optional triage configuration. It adds pointers to those small files in the existing appropriate `CLAUDE.md` or `AGENTS.md`, preserving surrounding instructions. Its own workflow includes reviewing proposed configuration before writing. It configures an already installed pack for a project. [Setup Skill](https://github.com/mattpocock/skills/blob/b0618bc436ad893b3c5e84e55fba86586d34a404/skills/engineering/setup-matt-pocock-skills/SKILL.md).

### Choosing and using Skills

`ask-matt` guides the human toward appropriate workflow entries and can advise a small task to proceed directly. It reads the relevant Skill before describing its behavior. The repository distinguishes user-invoked workflows from model-invoked professional capabilities, and its authoring policy makes operative Skill dependencies explicit. This is a deliberate engineering workflow with human-selected entries. [Ask Matt](https://github.com/mattpocock/skills/blob/b0618bc436ad893b3c5e84e55fba86586d34a404/skills/engineering/ask-matt/SKILL.md), [invocation policy](https://github.com/mattpocock/skills/blob/b0618bc436ad893b3c5e84e55fba86586d34a404/.agents/invocation.md).

### Durable knowledge and handoff

His configuration points to domain vocabulary and relevant decisions. A local issue tracker uses a feature spec and separate ticket files with state. These are distinct project artifacts. The `handoff` Skill separately writes a short, scrubbed transfer note in the operating system's temporary directory, referencing existing artifacts. [Domain template](https://github.com/mattpocock/skills/blob/b0618bc436ad893b3c5e84e55fba86586d34a404/skills/engineering/setup-matt-pocock-skills/domain.md), [local tracker template](https://github.com/mattpocock/skills/blob/b0618bc436ad893b3c5e84e55fba86586d34a404/skills/engineering/setup-matt-pocock-skills/issue-tracker-local.md), [handoff](https://github.com/mattpocock/skills/blob/b0618bc436ad893b3c5e84e55fba86586d34a404/skills/productivity/handoff/SKILL.md).

**Answer to the research question:** he uses a dedicated project-setup Skill, a usage-guide Skill, and local documents with specific responsibilities. Installation is a separate delivery concern. The visible source supports this mechanism; it does not establish how often people use it or its commercial effectiveness.

## 3. Apply the useful parts to Begin

### Separate setup and making, focused professional work

Use `begin-setup` for project configuration and `begin-website` for making. People can directly request content, design, repair, architecture, or another focused capability. Discover relevant guidance through the host's actual mechanism and load what the current task needs. Test actual selection and use on each claimed host.

Matt's clear separation of project configuration, workflow entries, and professional capabilities is useful. Keep activation descriptions task-specific and ordinary conversation practical. Skills avoid embedded cross-Skill catalogs or mandatory call chains. The user's chosen methods and existing project instructions continue to govern the task.

### Dedicated minimal project setup

`begin-setup` inspects the selected workspace, installed resource/version observations, existing instructions, and available execution/preview tools. It initializes or reconciles `BEGIN.md` and integrates a concise pointer into the appropriate project instructions. It preserves existing files and accepted choices, and skips settled configuration.

For a new child website, setup can record the intended destination while leaving it absent for exclusive creation. The website-making task handles the actual content, design, source, and preview. Setup remains separate from the host's installer and does not grant unavailable tools or credentials.

### Agent-maintained project continuity

Use the [setup BEGIN template](../skills/begin-setup/assets/BEGIN.md) for purpose, accepted design/content, actual paths/commands, resource/version observations, current result, checks, open setup, and next action. Fresh starters also include a short record. The Agent updates the current project's note at meaningful milestones; the person can inspect it and continue through conversation.

Keep project instructions as the reliable pointer to this note. Add a design brief, API contract, schema/migration, or service configuration file when the actual work needs it. Existing project files remain the authority for current implementation. Secrets and private records stay outside guidance. Host changes require access to the project and usable tools in the new host.

### A shared contract, without document overhead

Each Skill should make six things easy to find:

1. **Task:** when it is relevant and the result it helps produce.
2. **Input:** what to read first, what can be inferred, and what materially needs the person.
3. **Method:** the few decisions or steps that improve the work, with examples for difficult choices.
4. **Outcome:** code, content, decisions, or diagnosis, with a concrete success condition.
5. **Handoff:** what the next task needs, recorded in the existing project artifact when useful.
6. **Checks and gaps:** appropriate verification, meaningful failures, and a workable path for missing resources.

Keep these instructions short and load deeper examples when needed. The contract should strengthen professional behavior; avoid making six mandatory sections or six new files part of every task.

## 4. Editing and validation sequence

| Order | Work | Result to inspect |
| --- | --- | --- |
| 1 | Verify dedicated setup, `BEGIN.md`, and making/resume handoffs | Setup preserves the workspace; an ordinary request reaches a useful result and a fresh session can continue |
| 2 | Deepen `begin-design` and `begin-content`, then align frontend/quality | An annotated example turns the same factual brief into a distinctive, understandable, working site |
| 3 | Integrate backend/data/security through the enquiry task | Submission, persistence, owner-only retrieval, errors, and recovery work through the site |
| 4 | Complete one services/publish path | Actual configuration, intended hosting, visitor access, update, and recovery are observed |

Retain the professional domains while deepening them in this order. Validate the added architecture, product-structure, writing, and diagram tasks with focused requests. Public packaging should declare the resources and workflows actually verified; edition-specific archive checks are recorded in `STATUS.md`.

For the first design/content comparison, use the same brief, assets, host/model, and task budget with and without Begin. Compare factual accuracy, fit to the owner, composition, editing effort, and action behavior. Use owner/independent judgments for aesthetic and message fit; use browser and functional evidence for measurable behavior. A small comparison informs the next edit and cannot support a broad success-rate claim.

The immediate deliverable after this review should be one completed example that demonstrates the improved entry, design/content decisions, implementation, and checks, followed by a fresh-session edit. Expand the library from observed weaknesses in that flow and the later functional/deployment tasks.
