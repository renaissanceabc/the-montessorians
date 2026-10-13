# Operations

Settings that live in the Vercel dashboard rather than in the repo, and why they exist.

## Rate limits (Vercel Firewall)

The site has two public endpoints that do work per request:

| Route | What it does | App limit |
| --- | --- | --- |
| `POST /api/submit` | Opens a GitHub issue from the contribute form | 20 an hour per IP, 32 KB body |
| `GET/POST /api/reconcile` | Reconciliation API for OpenRefine and similar clients | 120 requests a minute per IP, 50 queries a request |

Both routes enforce those limits themselves, but only in memory: every serverless instance keeps its own counters, so a client spread across instances (or a cold start) gets more than the limit. The project has no shared store (no Upstash or Vercel KV), so the firewall is what enforces the limit across instances. Configure these two custom rules under **Project → Firewall → Custom rules** (or with the CLI below). The app limits stay as a backstop.

### Rule 1: contribute form submissions

- **Name:** `Rate limit submissions`
- **If:** Request Path **equals** `/api/submit` **and** Method **equals** `POST`
- **Then:** Rate Limit, **Fixed window**, **3600 seconds**, **20 requests**, keyed by **IP**
- **Action when exceeded:** Rate limit (responds `429`), for the rest of the window

```sh
vercel firewall rules add "Rate limit submissions" \
  --condition '{"type":"path","op":"eq","value":"/api/submit"}' \
  --condition '{"type":"method","op":"eq","value":"POST"}' \
  --action rate_limit \
  --rate-limit-algo fixed_window \
  --rate-limit-window 3600 \
  --rate-limit-requests 20 \
  --rate-limit-keys ip \
  --rate-limit-action rate_limit
```

The contribute form already explains a `429` ("Too many submissions") and offers the prefilled GitHub issue instead.

### Rule 2: reconciliation API

- **Name:** `Rate limit reconciliation`
- **If:** Request Path **equals** `/api/reconcile`
- **Then:** Rate Limit, **Fixed window**, **60 seconds**, **120 requests**, keyed by **IP**
- **Action when exceeded:** Rate limit (responds `429`)

```sh
vercel firewall rules add "Rate limit reconciliation" \
  --condition '{"type":"path","op":"eq","value":"/api/reconcile"}' \
  --action rate_limit \
  --rate-limit-algo fixed_window \
  --rate-limit-window 60 \
  --rate-limit-requests 120 \
  --rate-limit-keys ip \
  --rate-limit-action rate_limit
```

OpenRefine sends 10 queries a request and waits for each answer, so 120 a minute reconciles about 1,200 rows a minute for one cataloger.

Publish the firewall changes after adding the rules; they apply to every deployment immediately, with no redeploy.

## Security headers

`packages/next-config/index.ts` sets a Content-Security-Policy and the usual hardening headers on every route, and a locked-down policy on `/logos/*` so served SVGs can't run scripts. When adding a third-party script, image host, or API the browser calls directly, add its origin to the policy there and check the browser console for CSP violations on a preview deployment before merging. BotID's challenge only runs on Vercel, so check `/contribute` on a preview, not just locally.
