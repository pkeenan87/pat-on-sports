# CLAUDE.md

## Project Overview

This is an **Astro sports blog** focused on New England Patriots analysis. It's a content-driven static site that transforms Markdown posts into a searchable, filterable blog.

**Tech Stack**: Astro 5, React 19 (islands), TypeScript 6 (strict), Tailwind CSS 4, Vitest

## Quick Commands

```bash
npm run dev # Start dev server at localhost:4321
npm run build # Production build
npm run preview # Preview the production build
npm run lint # astro check
npm run test # Vitest watch mode
npm run test:run # Vitest single run
npm run test:coverage # Coverage report
npm run new-post -- ./export.zip # Convert a Google Doc HTML/zip export to Markdown
```

## Project Structure

```
src/                  # Astro app (pages, layouts, components, content config)
  pages/              # File-based routes
  components/         # Astro + React islands (Header, Comments, PostCard)
  layouts/            # BaseLayout
  lib/                # Post helpers (sort, tags, search filter)
  content.config.ts   # Blog collection schema
posts/                # Markdown content files (blog posts)
public/images/        # Hero images for posts
scripts/              # Google Docs -> Markdown converter
test/                 # Vitest setup
```

## Key Files

- `src/content.config.ts` - Blog collection loader + Zod schema
- `src/lib/posts.ts` - Sort, tags, category badges, search filter
- `src/pages/blog/[slug].astro` - Static post pages
- `src/pages/blog/index.astro` - Blog index with client-side search/tag filtering
- `src/components/Header.tsx` - Navigation with search bar and tag filters

## Content Format

Posts use YAML front matter in `/posts/`:

```markdown
---
title: "Post Title"
date: 2025-01-25
description: "Brief description"
tags:
  - NFL
  - "New England Patriots"
heroImage: "/images/week-01/hero.jpg" # Optional
heroAlt: "Alt text" # Optional
heroCaption: "Caption" # Optional
---

Content here...
```

The slug is the filename (without `.md`). No registry file is required.

## Development Notes

- All post metadata flows through the `blog` content collection
- Posts are statically generated at build time via `getStaticPaths()`
- Search and tag filters are client-side (`?q=` and `?tag=` on `/blog`)
- Header and Comments are React islands; everything else is static HTML
- Public env vars: `PUBLIC_SITE_URL`, `PUBLIC_TWITTER_SITE`, `PUBLIC_COMMENTS_API_BASE`, `PUBLIC_APP_BANNER_MESSAGE`
- App content API (static JSON): `/api/v1/posts.json`, `/api/v1/posts/[slug].json`, `/api/v1/manifest.json`
- Push API (on-demand): `POST /api/push/register`, `POST /api/push/unregister`,
  `POST /api/push/broadcast` (bearer `PUSH_BROADCAST_SECRET`)
- Server secrets (comments / push / upload script): `DATABASE_URL`, `ADMIN_PASSWORD`,
  `SESSION_SECRET`, `IP_HASH_SALT`, `CRON_SECRET`, `PUSH_BROADCAST_SECRET`,
  `BLOB_READ_WRITE_TOKEN` (optional: `EXPO_ACCESS_TOKEN`)
- `npm run build` needs no secrets; `/api/*` and `/admin/*` opt out of prerender

## Testing

Framework: Vitest + React Testing Library + jsdom

Place tests next to source (`src/**/*.test.ts`) or in `/test/` with `.test.ts` / `.test.tsx` naming.
