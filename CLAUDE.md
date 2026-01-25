# CLAUDE.md

## Project Overview

This is a **Next.js 16 sports blog** focused on New England Patriots analysis. It's a content-driven static site that transforms Markdown posts into a searchable, filterable blog.

**Tech Stack**: Next.js 16.1.1 (App Router), React 19, TypeScript 5 (strict), Tailwind CSS 4, Vitest

## Quick Commands

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run lint         # ESLint check
npm run test         # Vitest watch mode
npm run test:run     # Vitest single run
npm run test:coverage # Coverage report
```

## Project Structure

```
app/                  # Next.js App Router pages
  blog/[slug]/        # Dynamic post pages
components/           # React components (Header, CommentBox, Breadcrumbs)
lib/                  # Utilities - posts.ts is the core Markdown parser
posts/                # Markdown content files (blog posts)
public/images/        # Hero images for posts
test/                 # Unit tests
types/                # TypeScript type definitions
```

## Key Files

- `lib/posts.ts` - Core post parsing logic (getAllPosts, getPostBySlug, getAllTags)
- `app/blog/[slug]/page.tsx` - Dynamic post rendering with static generation
- `app/blog/page.tsx` - Blog index with search and tag filtering
- `components/Header.tsx` - Navigation with search bar and tag filters

## Content Format

Posts use YAML front matter in `/posts/`:

```markdown
---
title: "Post Title"
date: "2025-01-25"
description: "Brief description"
tags:
  - NFL
  - "New England Patriots"
heroImage: "/images/week-01/hero.jpg"  # Optional
heroAlt: "Alt text"                     # Optional
heroCaption: "Caption"                  # Optional
---

Content here...
```

## Development Notes

- All post data flows through `lib/posts.ts` (single source of truth)
- Posts are statically generated at build time via `generateStaticParams()`
- Markdown uses remark-gfm (GitHub Flavored) and remark-breaks (line breaks)
- Tests mock the `fs` module since posts directory is computed at import time
- Place tests in `/test/` with `.test.ts` or `.test.tsx` naming

## Testing

Framework: Vitest + React Testing Library + jsdom

When testing `lib/posts.ts`, mock `process.cwd()` before importing since the posts directory path is computed at module load time.
