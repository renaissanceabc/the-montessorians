---
name: tickets
description: Use for any requested repo change, including code, tests, docs, skills, and config, with or without a ticket in the prompt.
---

# Tickets

Every requested change to the repo gets a Linear ticket before work starts. That covers code, tests, docs, skills, and config, however small, whether or not the prompt already names a ticket. A question, a research pass, or a read-only lookup does not. A repo name, or "take a look", is not a request to change anything.

Search the Linear team ENG by the keywords and by synonyms. Include tickets In Progress and In Review, and the pull requests already on them. If one matches, work that ticket. If it already has an open pull request, report that pull request and do not open a competing fix. If none matches, create a ticket before starting.

Where the harness can rename the session, name it `<ticket-id>/<2-5 lowercase words>`, for example `ENG-123/ticket-url-on-prs`. In Claude Code that is `/rename`. If the harness cannot rename, skip it and say nothing. After a scope change, search again and rename again.

Search for a duplicate before creating. Extend the ticket that already exists instead of making a twin. Do not take an existing ticket over for a different goal. Do not cancel, delete, or archive a ticket unless Karel explicitly says yes.

The title says what the ticket delivers. Keep it short. No project, area, or date prefix.

The first paragraph states plainly what it proposes. The next paragraph says why. State a decision as a fact. "(decided)" is enough. Do not attribute a decision to a person or a date.

Then these sections, in order. `## Scope`. `## Current state`, naming the file paths as they are. `## Acceptance`, each item a `- [ ]` that names the evidence for it. `## Notes`. No Links section and no Related section. Use Linear relations and attachments for that.

Set the project and the labels. If the project is unclear, leave it off and say so.

A ticket Karel asks for is a short brief for the assignee. One line on what to make, a table when there are variants, and the image if there is one. Then `## Deliver`, checkboxes with the exact specs. Then `## Today`, in two or three bullets. Engineering detail goes in a short last section.

Assign the responsible human, the requester or the owner. Not a bot. Work Karel does himself is assigned to Karel. A QA or verification ticket he did not ask to own stays unassigned. Anything else stays assigned. If it is unclear who should own it, assign the person who owns the pull request.

Move the ticket to In Progress when you start. Create the branch from the ticket's `gitBranchName`, off the repo's integration branch (`develop` in most repos; the git-flow skill has the rest). The ticket id is always in the branch name.

The ticket id goes in the pull request title or body. The ticket URL goes in the pull request description. Attach the pull request to the ticket. Keep that description correct for the life of the pull request.

Move the ticket to In Review once the pull request is open. Comment on material progress or a scope change. The GitHub–Linear integration may move the status on its own. Do not fight it.

The ticket is done when every pull request that implements it has merged and CI is green on the integration branch after the merge. That merge, with green CI, is the sign-off. There is no further human step unless the ticket asks for one.

To close, re-read Acceptance and check each item you verified. Do not close a ticket that still has an open box. Move work that cannot be done to a new linked ticket, and mark the old item "tracked in ENG-YY". The closing comment cites the evidence: merged pull requests, test results, records created. A durable decision gets written where the truth lives, in an ADR or another doc in the repo, or in Notion.

When the work leaves something for later, open a ticket for it without being asked. Backlog, unassigned, and related to the parent.
