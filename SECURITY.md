# Security policy

## Reporting a vulnerability

If you believe you've found a security vulnerability in this site, please
**do not** open a public issue. Instead:

- Open a private security advisory at
  <https://github.com/pkeenan87/pat-on-sports/security/advisories/new>, or
- Email the maintainer directly with details and reproduction steps.

I aim to acknowledge new reports within **5 business days** and to provide a
remediation plan within **15 business days** for High / Critical issues.

## What this site is, security-wise

It is a content-driven Astro site. Blog pages are prerendered to static HTML at
build time. Comment and admin routes opt into on-demand Vercel Functions and
talk to Neon Postgres. The build itself still needs no secrets — recording
metadata lives in post front matter, and comment data is loaded at request time.

`PUBLIC_*` environment variables are inlined into the built HTML by design —
see `.env.example`. Treat all of them as published. Server secrets
(`DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `IP_HASH_SALT`,
`CRON_SECRET`, `BLOB_READ_WRITE_TOKEN`) must never use the `PUBLIC_` prefix.

## Threat model

| Threat | Control |
|--------|---------|
| A malicious dependency executing at build time | Actions are pinned to full commit SHAs, `npm ci` installs from the committed lockfile, `npm audit --audit-level=high` fails CI, and `overrides` in `package.json` pins transitive packages Dependabot can't reach directly. Dependabot alerts and automated security fixes are on. |
| A credential committed by accident | gitleaks scans the full commit range on every push and PR, and GitHub push protection blocks known credential formats before they land. No `.env` file is tracked. |
| Injected markup through post content | Posts are authored in this repo and reviewed in a PR before they build — the content pipeline is not open to the public. Markdown rendering is Astro's default, which escapes raw HTML it isn't told to trust. |
| Injected markup through comments | Comment bodies are plain text only (no HTML/Markdown). Rendering escapes everything, preserves line breaks, and autolinks URLs with `rel="nofollow ugc noopener"`. |
| Comment spam / abuse | Origin checks on POSTs, honeypot field, Vercel BotID, per-IP rate limits, moderate-first for new commenters, report + block, and an admin queue behind a signed cookie. |
| A vulnerability in the site's own client-side code | CodeQL runs `security-extended` over the JavaScript/TypeScript on every push and PR. Only two React islands ship to the browser (the header and comments); every other page is static HTML. |
| Third-party script behaviour | Vercel Analytics runs in the reader's browser. BotID client signals run on comment forms. |
| A workflow being used to escalate into the repo | `permissions: contents: read` at the top of the workflow, widened only for the CodeQL job that needs `security-events: write`. No workflow runs on `pull_request_target`, and no secret is exposed to a fork's PR. |

## Scope

In scope:

- `src/` — pages, layouts, components, helpers, comment API, and admin routes
- `astro.config.mjs`, `vercel.json` — build and deploy configuration
- `.github/workflows/` — supply-chain and permissions issues in CI
- `scripts/` — authoring helpers (Google Docs → Markdown, audio upload)
- The dependency tree reachable from `package-lock.json`

Out of scope:

- Vulnerabilities in Vercel Analytics or BotID — report those to their
  maintainers, and tell me so I can disable the integration while it's open.
- The contents of `PUBLIC_*` variables being visible in the page source. That
  is intentional.
- Spam or abuse in post comments. That is moderation, not a vulnerability —
  see the [Code of Conduct](CODE_OF_CONDUCT.md).

## Coordinated disclosure

I follow standard 90-day coordinated-disclosure practice and will work with
reporters on a public-disclosure timeline once a fix has shipped.
