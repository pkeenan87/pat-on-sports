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

It is a statically generated blog. Every route is rendered to HTML at build
time and served from a CDN. There is no application server, no database, no
user accounts, no session handling, and no credential of any kind in this
repository or in the deployed output.

Every environment variable the site reads is `PUBLIC_`-prefixed, which means
Astro inlines it into the built HTML by design — see `.env.example`. Treat all
of them as published, because they are. Nothing secret should ever be added
under that prefix.

That narrows the realistic attack surface to three things: what gets baked
into the build, what the build pipeline pulls in, and the one third-party
script the pages load.

## Threat model

| Threat | Control |
|--------|---------|
| A malicious dependency executing at build time | Actions are pinned to full commit SHAs, `npm ci` installs from the committed lockfile, `npm audit --audit-level=high` fails CI, and `overrides` in `package.json` pins transitive packages Dependabot can't reach directly. Dependabot alerts and automated security fixes are on. |
| A credential committed by accident | gitleaks scans the full commit range on every push and PR, and GitHub push protection blocks known credential formats before they land. No `.env` file is tracked. |
| Injected markup through post content | Posts are authored in this repo and reviewed in a PR before they build — the content pipeline is not open to the public. Markdown rendering is Astro's default, which escapes raw HTML it isn't told to trust. |
| A vulnerability in the site's own client-side code | CodeQL runs `security-extended` over the JavaScript/TypeScript on every push and PR. Only two React islands ship to the browser (the header and the comment box); every other page is static HTML. |
| Third-party script behaviour | Post pages load CommentBox.io for comment threads, and Vercel Analytics. Both run in the reader's browser with the same privileges as the page. If you find a problem in either, report it upstream — and tell me, so I can pull the integration while it's open. |
| A workflow being used to escalate into the repo | `permissions: contents: read` at the top of the workflow, widened only for the CodeQL job that needs `security-events: write`. No workflow runs on `pull_request_target`, and no secret is exposed to a fork's PR. |

## Scope

In scope:

- `src/` — pages, layouts, components, and the helpers in `src/lib/`
- `astro.config.mjs`, `vercel.json` — build and deploy configuration
- `.github/workflows/` — supply-chain and permissions issues in CI
- `scripts/` — the Google Docs → Markdown authoring converter
- The dependency tree reachable from `package-lock.json`

Out of scope:

- Vulnerabilities in Astro, React, Tailwind, Vite or Vercel themselves —
  report those upstream.
- Vulnerabilities in CommentBox.io or Vercel Analytics — report those to their
  vendors. Do tell me as well.
- The contents of `PUBLIC_*` variables being visible in the page source. That
  is what the prefix means.
- Spam or abuse in post comments. That is moderation, not a vulnerability —
  see the [Code of Conduct](CODE_OF_CONDUCT.md).

## Coordinated disclosure

I follow standard 90-day coordinated-disclosure practice and will work with
reporters on a public-disclosure timeline once a fix has shipped.
