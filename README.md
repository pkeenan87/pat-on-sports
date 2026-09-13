# Pat on Sports

**A weekly New England Patriots column, published as a static site.**

[![CI](https://github.com/pkeenan87/pat-on-sports/actions/workflows/ci.yml/badge.svg)](https://github.com/pkeenan87/pat-on-sports/actions/workflows/ci.yml)
[![Astro](https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white)](https://astro.build)
[![Node](https://img.shields.io/badge/Node-24-5FA04E?logo=node.js&logoColor=white)](.nvmrc)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Live at **[patonsports.com](https://patonsports.com)**.

Every game gets a Pros & Cons recap — what worked, what didn't, what it means
for the rest of the season. The archive covers the full 2025 Patriots run from
the opener in Las Vegas through the playoffs, plus UCLA Bruins recaps as the
2026 college season goes.

---

## What it is, technically

A Markdown folder that compiles to a website. Posts live in `posts/`, one file
per article, and Astro renders every route to static HTML at build time.

The design constraint the whole thing is built around: **pages are static HTML
and JavaScript is the exception**. Only two components hydrate in the browser —
the header (search and filters) and the comment thread. Post pages, the
homepage, category and tag pages, Pros & Cons blocks and share buttons all ship
as plain HTML with no JavaScript at all. The site loads instantly on a phone,
stays fully readable with scripting disabled, and every rendering bug is
reproducible by opening the built file in `dist/`.

### What the site does

| | |
|---|---|
| **Typed content** | Every post is validated against a Zod schema at build time. A malformed date or a missing description fails the build instead of shipping. |
| **Pros & Cons layout** | The recap format is parsed out of plain Markdown headings and rendered into side-by-side panels — no special syntax to learn when writing. |
| **Scorelines** | `W 27–20` badges from front-matter scores, falling back to parsing the score out of the post title for older posts. |
| **Categories and tags** | Posts sort into Pros & Cons, Preview, NFL or UCLA from their tags, each with its own page. Opponent tags get their own pages too. |
| **Search and filters** | Client-side, over titles, descriptions, tags and post bodies, driven by `?q=` and `?category=` so any filtered view is a shareable URL. |
| **Related posts** | Scored by shared opponent, category and season, so a Bills recap surfaces the other Bills games. |
| **Homepage shelves** | A featured lead, a latest feed, and a separate shelf for the 2025 playoff run. |
| **Audio** | Posts can carry a narrated version, surfaced with a custom player. |
| **Feeds and SEO** | RSS, a sitemap, `robots.txt`, canonical URLs, Open Graph and Twitter cards, all generated. |
| **Comments** | A CommentBox.io thread per post. |

## Stack

Astro 7 · React 19 (two islands) · TypeScript 5 strict · Tailwind CSS 4 ·
Vitest · deployed on Vercel · Node 24.

## Quick start

```bash
nvm use          # Node 24, pinned in .nvmrc
npm install
npm run dev      # http://localhost:4321
```

No configuration required — every environment variable has a working default.
Copy `.env.example` to `.env` if you want to override one.

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload at `localhost:4321` |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | `astro check` — typechecks the app **and** validates every post |
| `npm run test` | Vitest in watch mode |
| `npm run test:run` | Vitest once (what CI runs) |
| `npm run test:coverage` | Coverage report |
| `npm run new-post -- ./export.zip` | Convert a Google Doc export into a Markdown post |

## Writing a post

Drop a Markdown file in `posts/`. The filename is the URL slug — no registry to
update, no index to regenerate.

```markdown
---
title: "Week 1 Pros & Cons: Patriots 27, Seahawks 20"
date: 2026-09-10
description: "One sentence — the card blurb, the meta description, and the RSS summary."
tags:
  - NFL
  - "Pros & Cons"
  - "Seattle Seahawks"
heroImage: "/images/2026/prosandcons/week-01/pats-vs-seahawks-hero.jpg"
heroAlt: "Describe the photograph for a screen reader"
season: 2026
week: 1
opponent: "Seattle Seahawks"
scoreUs: 27
scoreThem: 20
result: "W"
---

Content here.
```

`title`, `date`, `description` and `tags` are required. The rest is optional but
earns you the scoreline badge, the homepage shelf placement, and better related
posts. Full schema: `src/content.config.ts`. Full guide:
[CONTRIBUTING.md](CONTRIBUTING.md#adding-a-post).

Tags decide the category — see `getCategory()` in `src/lib/posts.ts`.

## Layout

```
posts/                  # the blog itself — one Markdown file per post
public/images/          # hero images, by season and week
src/
├── pages/              # file-based routes (index, blog, category, tag, rss, robots)
├── layouts/            # BaseLayout — <head>, nav, footer, SEO
├── components/         # .astro components + the two React islands
├── lib/                # posts.ts and prosCons.ts — where the real logic lives
├── content.config.ts   # the Zod schema every post is validated against
└── styles/global.css   # Tailwind v4 entry and theme tokens
scripts/                # Google Docs export → Markdown converter
test/                   # shared Vitest setup
```

`src/lib/posts.ts` is the file to read first. Sorting, tag and category
resolution, search matching, score parsing and related-post scoring all live
there, and it's the only part of the codebase with real accumulated edge cases —
legacy `?tag=` URLs that still have to resolve, scores parsed out of titles
written before the front-matter fields existed.

## CI

Every push and pull request runs typecheck and content validation, the test
suite, a production build, `npm audit`, CodeQL on `security-extended`, and a
gitleaks secret scan. Actions are pinned to full commit SHAs and the workflow
runs with `contents: read`.

`main` deploys to Vercel automatically; every PR gets a preview URL.

## Contributing

Corrections to a published post are especially welcome — there's an
[issue template](.github/ISSUE_TEMPLATE/post_correction.yml) for them. See
[CONTRIBUTING.md](CONTRIBUTING.md) for everything else, and
[SECURITY.md](SECURITY.md) to report a vulnerability privately.

## License

Source code is [MIT](LICENSE).

The editorial content — the posts under `posts/` and the images under
`public/images/` — is © 2026 Patrick Keenan, all rights reserved. Quote it with
attribution and a link, as you would any article.

Independent commentary. Not affiliated with the NFL, the New England Patriots,
the NCAA, or UCLA.
