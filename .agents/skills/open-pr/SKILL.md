---
name: open-pr
description: Open a pull request with the devkit body. Use when the work is ready for review.
---

# Open a PR

Use the template. Fill What changed, Why, How checked, Risk, and How to revert. Put the Linear ticket id in the title or the body, and the ticket URL in the body. Attach the pull request to the ticket, and keep that description correct while the pull request is open.

Risk is low, medium, or high, and it names any risky path the diff touches: auth, billing, stripe, payments, migrations, env files, release config, `.github/`, major dependency bumps.

Create the pull request with `gh pr create`. Do not merge it. Do not enable auto-merge on a risky diff or when it should wait for Karel. Add `needs-karel` in that case.
