# Worked comparison: choosing a portfolio structure

This original analysis uses recorded desktop captures inspected on 2026-10-08. It demonstrates a method, not a current live-site audit. The source screenshots and brand assets are not included.

## Question and proposed owner

A fictional independent illustrator has six owned projects with uneven image counts. Visitors should understand the work and the illustrator's role, then contact them. Should the homepage show a compact wall of work or a more explanatory sequence?

## Evidence

| Reference | Inspected surface and source | Observation | Unverified |
| --- | --- | --- | --- |
| Fiasco | [Selected work capture](https://mobbin.com/sites/sections/4ed7c118-a866-41fa-824c-32a24323c927) | Two columns have unequal image widths and staggered positions. Each project has a name, short explanation, and category labels. | Phone reading order, transitions, project navigation, and contact outcome |
| Grafik | [Refero recorded case](https://styles.refero.design/style/0226e028-3cd3-440d-b469-ca459267161d) | A tight three-column gallery, restrained text navigation, and thin dividers let varied project imagery define the presentation. | Hover/touch behavior, detail routes, mobile layout, and contact outcome |

Both captures support visible composition observations. They do not establish the products' internal data model, runtime states, accessibility, or conversion rate.

## Interpretation and choice

**Compact gallery:** lets strong images establish the identity quickly. It requires enough useful images and captions so visitors can understand unfamiliar work. A uniform image wall may hide which project or role matters most.

**Explanatory sequence:** gives each project context and permits deliberate emphasis. It uses more space, and arbitrary staggering can make reading order confusing. Content and phone layout must determine the sequence.

For this fictional owner, recommend an explanatory sequence with one featured project and consistent project information: task, illustrator's role, artifact, and optional detail. Use a compact gallery as an alternate when browsing imagery is the visitor's main task. This recommendation follows the proposed owner's material; it is not a universal preference or an observed feature of either reference.

## Original proposed map

| Surface | Job | Content/action | Required check |
| --- | --- | --- | --- |
| Work overview | Understand range and emphasis | Featured work, concise context, remaining projects | Real content at narrow/wide widths; coherent reading order |
| Project detail | Understand one contribution | Task, role, selected artifact, useful explanation | Reachable from overview; readable without hover |
| About/contact | Decide whether to start a conversation | Accurate approach, relevant availability, configured contact | Actual destination opens; delivery checked separately if in scope |
| Empty filtered result, if filters are added | Recover after no match | Clear result and reset action | Add only when filtering materially helps; preserve all work without JS |

The proposed detail page and filter state are new design choices. Their presence is not claimed in the recorded references.

## Improve the evidence when it affects the decision

Inspect the actual relevant flow and mobile surface when access permits. Ask a potential visitor to locate a relevant project and explain the illustrator's contribution. Do not submit enquiries or create accounts just to complete a reference map.

Task analysis helps focus on the visitor's goal and observable work. A wireflow keeps screen/state context beside transitions when a dynamic interaction matters. Use these methods when helpful; a small table may suffice. Official methods: [NN/g task analysis](https://www.nngroup.com/articles/task-analysis/), [NN/g wireflows](https://www.nngroup.com/articles/wireflows/).
