# Contributing

Thanks for your interest. This guide covers everything needed to land a change,
whether that's a post, a bug fix, or a feature.

By participating you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

For **security vulnerabilities**, follow [SECURITY.md](SECURITY.md) instead of
opening a public issue.

---

## Project layout

```
pat-on-sports/
├── posts/                  # the blog itself — one Markdown file per post
├── public/images/          # hero images, organised by season and week
├── src/
│   ├── pages/              # file-based routes (index, blog, category, tag, rss, robots)
│   ├── layouts/            # BaseLayout — <head>, nav, footer, SEO tags
│   ├── components/         # .astro components + the two React islands
│   ├── lib/                # posts.ts and prosCons.ts — all the real logic
│   ├── content.config.ts   # the Zod schema every post is validated against
│   └── styles/global.css   # Tailwind v4 entry and theme tokens
├── scripts/                # Google Docs export → Markdown converter
└── test/                   # shared Vitest setup
```

## The one architectural rule

**Pages are static HTML; JavaScript is the exception, not the default.**

Only two components hydrate in the browser: `Header.tsx` (search box and
category filters) and `Comments.tsx` (the comment thread). Everything else —
post pages, the homepage shelves, category and tag pages, Pros & Cons blocks,
share buttons — renders to plain HTML at build time and ships no JavaScript.

Keep it that way. It's what makes the site load instantly on a phone on stadium
Wi-Fi, keeps it fully readable with JavaScript disabled, and means a rendering
bug can always be reproduced by looking at the built file in `dist/`.

When a change seems to need interactivity, reach for an `.astro` component and
CSS first. If it genuinely needs an island, add it deliberately and say so in
the PR.

## Local setup

```bash
git clone https://github.com/pkeenan87/pat-on-sports
cd pat-on-sports
nvm use          # Node 24, pinned in .nvmrc
npm install
cp .env.example .env
npm run dev      # http://localhost:4321
```

The `.env.local` file holds server secrets for comments and the audio upload
script. Copy from `.env.example` or run `vercel env pull .env.local`. The build
itself still needs no secrets — see [SECURITY.md](SECURITY.md).

## Adding a post

A post is a Markdown file in `posts/`. The filename becomes the URL slug —
`posts/week-01-pros-cons-pats-vs-seahawks.md` publishes at
`/blog/week-01-pros-cons-pats-vs-seahawks`. There is no registry to update.

```markdown
---
title: "Week 1 Pros & Cons: Patriots 27, Seahawks 20"
date: 2026-09-10
description: "One sentence — this is the card blurb, the meta description, and the RSS summary."
tags:
  - NFL
  - "Pros & Cons"
  - "Seattle Seahawks"
heroImage: "/images/2026/prosandcons/week-01/pats-vs-seahawks-hero.jpg"
heroAlt: "Describe the photograph for a screen reader"
heroCaption: "Optional credit line"
season: 2026
week: 1
opponent: "Seattle Seahawks"
scoreUs: 27
scoreThem: 20
result: "W"
---

Content here.
```

`title`, `date`, `description` and `tags` are required; everything else is
optional. The full schema is `src/content.config.ts`, and `npm run lint`
validates every post against it — a malformed date or a missing description
fails the build rather than shipping broken.

Some things worth knowing:

- **Tags decide the category.** `getCategory()` in `src/lib/posts.ts` maps tags
  onto one of Pros & Cons, Preview, NFL, or UCLA, which drives the badge colour,
  the category page, and the homepage shelves. Tags that aren't category
  keywords — opponent names, mostly — become filter tags instead.
- **Set the score fields when you have them.** `scoreUs` / `scoreThem` /
  `result` render the scoreline badge. Without them the site falls back to
  parsing the score out of the title, which works but is fragile.
- **`season` and `week`** feed the homepage shelves and "related posts". A recap
  without them still publishes, but sorts as a loose post.
- **Hero images** go in `public/images/<season>/<type>/<week>/`. Commit the
  image, keep it under ~300 KB, and always write `heroAlt`.

To convert a Google Doc instead of writing Markdown by hand, export it as
"Web page (.html, zipped)" and run:

```bash
npm run new-post -- ./export.zip
```

It writes a post into `posts/` with front matter scaffolded. Read the result
before committing — it's a starting point, not a finished post.

## Adding a recording

Recordings are **not** committed under `public/audio/`. Upload them to Vercel
Blob and let the script write the front-matter fields the player and RSS feed
need:

```bash
vercel env pull .env.local   # once; needs BLOB_READ_WRITE_TOKEN
npm run upload-audio -- ./recording.m4a --post <slug>
```

That sets `audio` (Blob URL), `audioBytes`, `audioDurationSeconds`, and
`audioType`. Commit the updated Markdown post — not the binary. Legacy
`/audio/:file` URLs permanently redirect to the Blob store.

## Tests

```bash
npm run test        # watch mode
npm run test:run    # single run, what CI runs
npm run test:coverage
```

Vitest with React Testing Library and jsdom. Tests live next to their source
(`src/lib/posts.test.ts`, `src/components/Header.test.tsx`) or in `test/`.

The logic worth testing lives in `src/lib/`. `posts.ts` in particular carries
the accumulated edge cases — legacy `?tag=` URLs that have to keep resolving,
category normalisation, score parsing out of titles, related-post scoring. If
you change any of it, a test should fail; if none does, add one before you
change it.

## Before opening a PR

```bash
npm run lint        # astro check: typechecks the app AND validates every post
npm run test:run
npm run build       # catches broken canonical URLs, sitemap and RSS entries
```

All three run in CI, along with CodeQL, a secret scan, and `npm audit`.

For UI changes, look at the result at mobile width — most readers are on a
phone — and confirm the page still reads with JavaScript disabled.

## Commit style

Write the subject as a complete sentence describing what the commit does:

```
Restore UCLA as a top filter without a homepage shelf.
```

Explain *why* in the body when the reason isn't obvious from the diff. A
handful of decisions in `src/lib/posts.ts` look arbitrary until you know which
old URL or which malformed title they exist to handle, and the commit message
is where that gets recorded.

## Deployment

`main` deploys automatically to Vercel at <https://patonsports.com>. Every PR
gets a preview deployment — check it before merging, particularly for anything
touching layout, routing, or the feed.
