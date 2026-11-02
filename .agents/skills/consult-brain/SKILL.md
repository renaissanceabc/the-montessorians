---
name: consult-brain
description: Read before answering, planning, or building anything that depends on company, product, or technical context.
---

# Consult brain

Read this before answering, planning, or building anything that depends on company, product, or technical context. Send what you learn back to the system that owns it: a ticket, or a proposed Notion draft. Do not overwrite an accepted page.

## Sources

Notion, in the Renaissance workspace and the Renaissance teamspace, holds company and product knowledge. Product homes are in the table below. Nothing is formally verified yet. Treat each product's home and its child pages as the current source. Call a page marked Draft "proposed", and surface unresolved comments.

The repo holds technical decisions: its root `AGENTS.md` and `CLAUDE.md`, the app's own under that, and the ADRs and docs in that repo. A skill that applies only to that codebase stays in that repo.

devkit is how we work. A rule used in two or more repos is a devkit skill. It is not copied into each repo's `AGENTS.md`.

Linear, team ENG, tracks work. A decision lives in Notion or the repo.

Infisical holds runtime secrets. Refer to a secret by name. Do not paste the value.

The Ideas database (https://app.notion.com/p/1af0af26826f8080b034ccd575521c85) is the early ideation pipeline. Every row is proposed, including a row marked Launched. When a product has a home page, use that page.

The Meeting Notes database (https://app.notion.com/p/1d00af26826f8012aa1aee0e6142d43e) is background. It is not a source for a decision.

Skip Flourish's Private section, corporate IDs under Ops, and anything in the private Samarel teamspace.

## Product homes

| Product | Repo | Notion home |
| --- | --- | --- |
| Company | | https://app.notion.com/p/1cf0af26826f80cf8f9ede8c483e5e51 (Ops; site copy is under Ops > Website) |
| Flourish | renaissanceabc/flourish | https://app.notion.com/p/2790af26826f80f69695fb394db847d5 (product hub https://app.notion.com/p/37d0af26826f80fb9f88f9ef38cfc557) |
| education.supply | renaissanceabc/education-supply | https://app.notion.com/p/3dd0af26826f80f5afaccd7a3e2dcf24 (engineering https://app.notion.com/p/3460af26826f80f68525cc53e9c43902) |
| Bildung | renaissanceabc/bildung | https://app.notion.com/p/45c41aaa95844f3f9ef65965323cedc9 |
| Atrium | renaissanceabc/atrium | https://app.notion.com/p/3160af26826f80888193cd049618d0d2 |
| The Montessorians | renaissanceabc/the-montessorians | https://app.notion.com/p/2030af26826f801eb903f787b870f40b |
| Galley | renaissanceabc/galley | https://app.notion.com/p/3ec0af26826f80b1a6bbffe7013769ac |
| Saturday Mornings | renaissanceabc/saturday-mornings | https://app.notion.com/p/40b0af26826f81c6a834f5153dc3b317 |
| Renaissance OS | renaissanceabc/renaissance-os | https://app.notion.com/p/40b0af26826f8170a266e5e8c8a0bea6 |
| Hands | renaissanceabc/hands | https://app.notion.com/p/40b0af26826f81c7aa54fe3940b8bb1c |
| Lifemap | unconfirmed | https://app.notion.com/p/40b0af26826f81138744fc058700cd24 |
| k12learnbench | renaissanceabc/k12learnbench | https://app.notion.com/p/40b0af26826f81b2b4b7d7dc3a7ae35c |
| Noma | none (still ideating) | https://app.notion.com/p/3e30af26826f8096b661c364088f7fff (page title Aristo) |

A product with no page gets one under Other Projects (https://app.notion.com/p/22d0af26826f806f86e0cda4d9731431). That page is the home.

## Read order

1. The target repo's `AGENTS.md`, and the app's `AGENTS.md` under it.
2. The product's Notion home, then Ops for company context.
3. For technical work, the repo's ADRs and docs.
4. Linear, for existing or in-flight work on the same thing.

## Using it

Keep accepted truth, drafts, code constraints, conflicts, and inference apart. Cite the source. A missing search result is not evidence that no decision exists, so say what you searched. A fact Karel or Sam stated or approved overrides ADRs, docs, and code. Flag the conflict. Never "correct" approved copy.
