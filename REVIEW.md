# Review

Read the diff. Report real failures: wrong data, a broken page, a permanent id that changed or was reused, a claim without a source, a doc that lies, config that sends work to the wrong place. Ignore lockfiles, generated code (`*.generated.json`), and snapshots. No style nits; Ultracite owns style.

Every finding needs a file and a line. The summary states the finding count. If there are none, say "no issues".

Max 3 review rounds. After the first, review only the new diff. Do not re-raise a finding already on the pull request. A fix should cover the bug class.

Data changes follow `docs/editorial-policy.md`: real, verifiable sources only, and no guessed identifiers, dates, DOIs, or ISBNs. A tag that is not in `data/authority/tags.yaml` is a finding.

Guarded areas are release config, `.github/`, `vercel.json`, env files, and major dependency bumps. A diff that touches one and does not say so under Risk is a finding.
