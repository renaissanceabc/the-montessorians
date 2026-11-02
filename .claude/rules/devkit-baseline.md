<!-- devkit@v1 managed. Edit in renaissanceabc/devkit. -->

## Review rounds

Max 3 review rounds on a pull request. After round 1, re-review only the new diff. Never re-raise a finding that was already reported. Fix the whole bug class, not the one line that was pointed at. After round 3, stop and flag Karel.

## Pull requests

The title is a Conventional Commit. The body has What changed, Why, How checked, Risk, and How to revert. Do not merge. Do not enable auto-merge when the diff touches auth, billing, stripe, payments, migrations, `.env` files other than `.env.example`, release config, `.github/`, or a major dependency bump, or when the pull request is labeled `needs-karel` or `needs: hands`. There is no merge queue.

## Branches

Integration work lands on this repo's integration branch. `main` is the release branch. release-please cuts tags. Do not push tags yourself.

## Skills

Devkit-owned skills are in `.claude/skills` and `.cursor/skills`. Baseline skills are also in `.agents/skills`. The names devkit owns are listed in `.devkit/managed.txt`. Leave every other skill alone.

## Linear

Every requested repo change (code, tests, docs, skills, config), however small, starts from a Linear ticket on team ENG, with or without a ticket in the prompt. Search ENG first, including In Progress and In Review, and work that ticket. If it already has an open pull request, report it instead of opening another. If none matches, create the ticket before starting. A question, research, or a read-only lookup does not get a ticket. Naming a repo, or "take a look", is not a request to change it. The ticket id goes in the branch and in the pull request title or body, and the ticket URL goes in the body. The `tickets` skill is how to write, assign, move, and close it.

## Where truth lives

Read the `consult-brain` skill before answering, planning, or building anything that depends on company, product, or technical context. Notion holds company and product knowledge. The repo holds technical decisions. Linear tracks work. Read the repo's AGENTS.md, then the product's Notion home, then ADRs and docs, then Linear for in-flight work. Send what you learn back as a ticket, or as a proposed Notion draft. Do not overwrite an accepted page.
