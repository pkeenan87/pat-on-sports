# Plan 1 — Move comments and article recordings onto Vercel

**Status:** proposed · **Written:** 2026-09-14 · **Repo:** `pat-on-sports`

## Goal

Own the two pieces of the site that currently live outside the repo and outside
Vercel: the comment threads (CommentBox.io) and the narrated recordings (binary
files committed to git). After this plan, both are hosted on Vercel-billed
services, the data is ours, and the site keeps its core constraint — pages are
static HTML, JavaScript is the exception, and the build needs no secrets.

## Where things stand today

**Comments**

- `src/components/CommentBox.tsx` is a React island that lazy-imports the
  `commentbox.io` vendor bundle (path-aliased in `astro.config.mjs` because the
  package's `module` entry points at unpublished source).
- Threads are keyed by post slug (`boxId={meta.slug}`).
- Rendering is gated on `PUBLIC_COMMENTBOX_PROJECT_ID`. When it is unset the
  post page shows "Comments are coming soon." `.env.example` ships it empty, so
  the first task is to confirm whether comments have ever been live in
  production (check the Vercel project's environment variables).
- All comment data lives on CommentBox's servers. The repo has no copy and no
  export.

**Recordings**

- One file so far: `public/audio/2025-season-recap-and-looking-ahead-to-2026.m4a`
  (6.6 MB), committed to git and served as a Vercel static asset.
- `audio:` in front matter is a root-relative path. `src/content.config.ts`
  validates it only as a string.
- `src/components/AudioPlayer.tsx` takes a `src` and does not care where it
  points.
- `src/pages/rss.xml.ts` emits an `<enclosure>` and reads the byte length with
  `statSync` against `public/`. That coupling is the only thing that breaks when
  audio leaves the repo.
- Every future recording adds ~7 MB to git history permanently, and Vercel's
  Git integration clones that history on every build.

## Target architecture

| Concern | Today | After |
|---|---|---|
| Audio storage | git + `public/audio/` | **Vercel Blob** (public store) |
| Audio upload | git commit | `npm run upload-audio` writes Blob URL, byte length and duration into front matter |
| Audio delivery | Vercel static CDN | Blob CDN; legacy `/audio/*` paths 308-redirect |
| Comment storage | CommentBox.io | **Neon Postgres** via the Vercel Marketplace (billed through Vercel) |
| Comment API | vendor script | Astro on-demand routes deployed as **Vercel Functions** via `@astrojs/vercel` |
| Comment UI | vendor widget | our own `Comments.tsx` island in the same slot |
| Spam and abuse | vendor | Vercel BotID + honeypot + per-IP rate limit + moderation queue |
| Moderation | vendor dashboard | `/admin/comments` behind a password and signed cookie; optional email via Resend (Marketplace) |
| Data retention | vendor policy | ours; IP hashes pruned by **Vercel Cron** |

Constraints that survive the migration:

- Every page stays prerendered. Only `/api/*` and `/admin/*` opt into on-demand
  rendering with `export const prerender = false`.
- `npm run build` still needs no secrets. Front matter carries everything the
  RSS feed needs about a recording.
- The comments island stays the only comment-related JavaScript. The post page
  renders completely without it.

Part A and Part B are independent. Ship A first; it is a one-session change
with low risk.

---

## Part A — Recordings to Vercel Blob

### A1. Provision the store

1. Vercel dashboard → project → Storage → Create → Blob. Public access.
2. Connect it to the `pat-on-sports` project. Vercel adds
   `BLOB_READ_WRITE_TOKEN` to the project's environment.
3. Locally: `vercel link` (once) then `vercel env pull .env.local`. The token is
   used only by the upload script on your machine. It is never read during
   `astro build` and must not be added to the CI workflow.

### A2. Front matter schema

In `src/content.config.ts`:

```ts
audio: z.string().url().optional(),
audioBytes: z.number().int().positive().optional(),
audioDurationSeconds: z.number().int().positive().optional(),
audioType: z.enum(["audio/mp4", "audio/mpeg"]).optional(),
```

Add a `.superRefine` so that when `audio` is set, `audioBytes` and `audioType`
are required. `astro check` (already in CI) then fails a post that references a
recording without the metadata the feed needs, instead of shipping
`length="0"`.

Mirror the new fields in `BlogEntry` and `PostMeta` in `src/lib/posts.ts` and in
`toPostMeta`.

### A3. Upload script

`scripts/upload-audio.ts`, run as `npm run upload-audio -- ./recording.m4a --post <slug>`:

1. Validate the extension (`.m4a` or `.mp3`) and that `posts/<slug>.md` exists.
2. Read duration with the `music-metadata` package (pure JS, no ffmpeg
   dependency).
3. Upload with `@vercel/blob`:
   `put("audio/<slug>.m4a", stream, { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType, cacheControlMaxAge: 31536000 })`.
   Deterministic paths mean re-running the script for a re-recorded episode
   replaces the file at the same URL.
4. Rewrite the post's front matter: set `audio` to the returned URL,
   `audioBytes`, `audioDurationSeconds`, `audioType`. Use `gray-matter` to
   round-trip the YAML rather than regex edits.
5. Print the URL and a reminder to commit the post.

Add the script to `tsconfig.json`'s `exclude` list alongside the existing
`scripts` entry, and unit-test the pure parts (argument parsing, front matter
rewrite) with a fixture post.

### A4. RSS feed

- Extract `audioEnclosure` into `src/lib/rss.ts` as a pure function of
  `PostMeta` and cover it with Vitest (URL passthrough, type by `audioType`,
  length from `audioBytes`, omitted when no audio).
- Delete the `statSync` path. The feed uses the Blob URL verbatim.
- Add `<itunes:duration>` from `audioDurationSeconds` so podcast apps show a
  runtime. The feed already declares the iTunes namespace.

### A5. Player

`AudioPlayer.tsx` needs no code change. Verification, not implementation:

- Seeking works on the Blob URL in Safari on iOS (this exercises HTTP Range
  requests; test before cutting over).
- The player still uses `preload="none"` so listing pages do not pull audio.

### A6. Migrate the existing recording

1. Run the upload script for `2025-season-recap-and-looking-ahead-to-2026`.
2. Delete `public/audio/*.m4a`. Remove the directory and the `.gitkeep`.
3. Add `public/audio/` to `.gitignore` so a future recording cannot be
   committed by accident.
4. Add a redirect in `vercel.json` so old RSS enclosure URLs and any shared
   links keep working:

   ```json
   "redirects": [
     { "source": "/audio/:file", "destination": "https://<store-id>.public.blob.vercel-storage.com/audio/:file", "permanent": true }
   ]
   ```

   A redirect rather than a rewrite: the client fetches from Blob directly, so
   the bytes are not proxied through a Vercel Function and Range requests reach
   Blob untouched.
5. Leave git history alone. Rewriting history to drop the 6.6 MB is not worth
   the disruption for one file. Revisit with `git filter-repo` only if the repo
   picks up more contributors.

### A7. Docs and guardrails

- README "Audio" row, `CONTRIBUTING.md` (new "Adding a recording" section),
  `CLAUDE.md` and `.env.example` (`BLOB_READ_WRITE_TOKEN`, local only, and drop
  the line that says nothing in the project needs a secret).
- CI: a small step that fails if any file under `public/` exceeds 2 MB. Hero
  images are all well under that today.

### A8. Follow-on (not in scope, worth knowing)

`public/images/` is 19 MB and growing by a few hundred KB per post. The same
upload-script pattern moves hero images to Blob later. Not urgent; images are
small and the Astro image pipeline benefits from having them local.

---

## Part B — Comments on Neon + Vercel Functions

### B1. Product decisions (made here so the work is unambiguous; change if you disagree)

- **No accounts.** Name (required, ≤ 60 chars) and optional email (never
  displayed, stored only as a salted SHA-256 hash).
- **Plain text bodies** ≤ 2,000 chars. Line breaks preserved, URLs auto-linked
  with `rel="nofollow ugc noopener"`. No HTML, no Markdown. This removes the
  entire XSS surface from user content.
- **One level of replies** (`parent_id`). Matches what CommentBox offered and
  keeps the UI flat.
- **Moderate-first.** A first-time commenter's post is `pending` until you
  approve it. Approving also records their email hash in `trusted_commenters`,
  and their later comments go live immediately. Commenters with no email are
  always moderated.
- **Author replies** carry `is_author = true` and render with a "Pat" badge.
- **Report and block** are part of v1, not later. The iOS and Android apps
  (Plans 2 and 3) will surface these same comments, and Apple's guideline 1.2
  on user-generated content requires a report mechanism, a way to block a
  user, and published contact info. Building them into the API now avoids
  reworking it when the app ships.

### B2. Provision the database

1. Vercel Marketplace → Neon → install, create a database, attach to the
   project. Vercel injects `DATABASE_URL` (pooled) into the environment. Hobby
   projects map to Neon's free plan and bill through Vercel.
2. Enable the Neon integration's preview-branch option: every Vercel preview
   deployment gets its own Neon branch, so PRs can be tested against real
   endpoints without touching production comments.
3. Driver and ORM: `@neondatabase/serverless` (HTTP driver, suited to short
   function invocations) with **Drizzle ORM**. Schema lives in
   `src/db/schema.ts`; migrations are generated into `drizzle/` and committed.
   Migrations run from your machine or a manual GitHub Action
   (`drizzle-kit migrate`), never inside the Vercel build.

Schema:

```sql
create table comments (
  id                uuid primary key default gen_random_uuid(),
  post_slug         text not null,
  parent_id         uuid references comments(id) on delete cascade,
  author_name       text not null,
  author_email_hash text,
  body              text not null,
  status            text not null default 'pending'
                    check (status in ('pending','approved','spam','deleted')),
  is_author         boolean not null default false,
  ip_hash           text,
  user_agent        text,
  report_count      int not null default 0,
  created_at        timestamptz not null default now(),
  approved_at       timestamptz
);
create index comments_post_idx on comments (post_slug, status, created_at);

create table trusted_commenters (
  email_hash  text primary key,
  approved_at timestamptz not null default now()
);

create table blocked_commenters (
  email_hash text,
  ip_hash    text,
  reason     text,
  created_at timestamptz not null default now()
);

create table rate_limits (
  key          text primary key,
  window_start timestamptz not null,
  count        int not null
);
```

### B3. Add the Vercel adapter

- `npm i @astrojs/vercel` (the current major that supports Astro 7) and add
  `adapter: vercel()` to `astro.config.mjs`. Leave `output` at its default
  (static). Only routes that export `prerender = false` become functions.
- Remove `outputDirectory` from `vercel.json`. With an adapter, Astro emits the
  Build Output API layout under `.vercel/output` and Vercel picks it up.
- `astro preview` does not support the Vercel adapter. Local testing of the
  on-demand routes uses `astro dev` (with `.env.local`) or `vercel dev`. Note
  this in README's command table.
- CI's `npm run build` step keeps working unchanged.

### B4. Endpoints

All under `src/pages/api/` with `export const prerender = false`. Validation
with Zod (already a transitive dependency via Astro).

| Route | Purpose | Notes |
|---|---|---|
| `GET /api/comments/[slug].json` | Approved comments for a post, as a tree | `Cache-Control: public, s-maxage=60, stale-while-revalidate=600`. Sixty seconds of staleness after approval is acceptable. |
| `POST /api/comments/[slug]` | Submit a comment | Checks in order: `Origin` header matches the site, honeypot field empty, BotID verdict, rate limit (5 per hour per IP hash), blocklist, then insert. Returns `201 { status: "pending" \| "approved" }` so the island can show the right message. |
| `POST /api/comments/[id]/report` | Reader flags a comment | Increments `report_count`; at 3 reports the comment flips to `pending` automatically and disappears from the feed until you look at it. Rate limited. |
| `GET /api/cron/prune` | Nightly | Nulls `ip_hash` and `user_agent` on comments older than 30 days; deletes `rate_limits` rows older than a day. Protected by `CRON_SECRET`; scheduled in `vercel.json` `crons`. |

Admin, under `src/pages/admin/`, all on-demand and `noindex`:

| Route | Purpose |
|---|---|
| `GET /admin/login`, `POST /admin/login` | Password from `ADMIN_PASSWORD`, compared with `timingSafeEqual`; on success sets an HMAC-signed cookie (`SESSION_SECRET`), `HttpOnly; Secure; SameSite=Lax`, 7-day expiry. |
| `GET /admin/comments` | Pending queue first, then reported, then recent approved. Plain server-rendered HTML with forms, no island needed. |
| `POST /admin/comments/[id]/approve` `/spam` `/delete` `/reply` `/block` | State changes. Every POST re-checks the cookie and the `Origin`. |

IP handling: take the first address from `x-forwarded-for`, hash with
`IP_HASH_SALT`. Raw IPs are never stored.

Add `Disallow: /admin` and `Disallow: /api` to `src/pages/robots.txt.ts`.

### B5. The island

Replace `CommentBox.tsx` with `Comments.tsx`:

- `client:visible`, fetches `/api/comments/<slug>.json` when scrolled into
  view, renders the thread and the form.
- Form fields: name, email (optional, with a one-line note that it is never
  shown), comment, hidden honeypot. Reply buttons expand an inline form with
  `parent_id`.
- After submit: append optimistically with a "Awaiting moderation" or
  "Posted" note based on the response.
- Each comment has a "Report" control that calls the report endpoint and
  disables itself.
- Accessibility: labelled inputs, `aria-live="polite"` region for status,
  focus moves to the status message after submit.
- Tests: React Testing Library with a mocked `fetch` for load, submit, pending
  versus approved, and report.

Cleanup in the same PR: delete `commentbox.io` from `package.json`, the alias
in `astro.config.mjs`, `src/types/commentbox.io.d.ts`, and
`PUBLIC_COMMENTBOX_PROJECT_ID` from `env.d.ts`, `.env.example`, `CLAUDE.md`,
`AGENTS.md` and README. In `src/pages/blog/[slug].astro`, drop the
`commentProjectId` gate; the Comments section always renders.

Not in v1: prerendering approved comments into the static HTML at build time.
It would make comments visible without JavaScript, but it makes the build
depend on a database secret, which breaks the no-secrets-at-build rule. Revisit
if search indexing of comments ever matters.

### B6. Migrate existing CommentBox data

1. Check the Vercel project's environment for `PUBLIC_COMMENTBOX_PROJECT_ID`.
   If it was never set in production, there is nothing to migrate and this
   step is done.
2. If threads exist: export them from the CommentBox dashboard. Verify what
   export the dashboard offers before relying on it; if it only offers a
   per-thread view, capture each post's thread from the widget's network
   responses before cutting over (there are fewer than 30 posts).
3. `scripts/import-commentbox.ts` maps exported records to the schema:
   `status = 'approved'`, original `created_at`, threading via `parent_id`,
   `author_email_hash = null`. Run against a Neon branch first, inspect in
   `/admin/comments`, then against production.

### B7. Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | Vercel (injected by Neon) + `.env.local` | Postgres connection |
| `ADMIN_PASSWORD` | Vercel + `.env.local` | Admin login |
| `SESSION_SECRET` | Vercel + `.env.local` | Signs the admin cookie |
| `IP_HASH_SALT` | Vercel + `.env.local` | Hashes commenter IPs |
| `CRON_SECRET` | Vercel | Authorizes the prune cron |
| `RESEND_API_KEY` | Vercel (optional) | Email you when a comment lands in the queue |
| `BLOB_READ_WRITE_TOKEN` | `.env.local` only | Part A upload script |

`.env.example` documents each with a blank value. gitleaks in CI already
catches an accidental commit of a real value.

### B8. Rollout

1. Merge Part A. Confirm the recap post plays and seeks from the Blob URL, and
   that `/rss.xml` shows the Blob enclosure with a non-zero length.
2. Open the Part B PR. The Neon preview branch and Vercel preview URL let you
   post, moderate and report end to end before merge. Run the import script
   against the preview branch if there is data to migrate.
3. Merge. Run the import against production. Watch Vercel Functions logs and
   the Neon dashboard for the first day.
4. After a week with no issues, cancel the CommentBox account.

Rollback at any point before step 4 is a revert of the PR; CommentBox data is
untouched until you cancel.

---

## Security and privacy checklist

- [ ] No HTML or Markdown accepted in comment bodies; rendering escapes everything.
- [ ] `Origin` check on every POST; admin actions also require the signed cookie.
- [ ] BotID on the submit endpoint. BotID's basic mode is included on all plans; Deep Analysis is a paid add-on and not needed here.
- [ ] Per-IP rate limit on submit and report.
- [ ] Emails stored only as salted hashes; raw IPs never stored; hashes pruned after 30 days.
- [ ] Admin routes `noindex` and disallowed in `robots.txt`.
- [ ] A short privacy note in the site footer (what a comment stores, how to ask for deletion). Plans 2 and 3 need a full `/privacy` page anyway; this can be the seed.
- [ ] `npm audit`, CodeQL and gitleaks already run in CI; the new dependencies (`@vercel/blob`, `@neondatabase/serverless`, `drizzle-orm`, `music-metadata`, `gray-matter`) fall under the existing Dependabot groups.

## Cost

| Service | Hobby allowance | Expected use | Note |
|---|---|---|---|
| Vercel Blob | 1 GB storage, 10 GB transfer / month | ~7 MB × 30 posts ≈ 210 MB stored; 10 GB ≈ 1,400 full listens | On Hobby, exceeding the allowance pauses Blob until the cycle resets rather than billing overage. If listens climb, move to Pro before that happens. |
| Neon (via Vercel) | Free plan, scale-to-zero | tens of MB | First request after idle pays a cold start of a few hundred ms. Fine for a comments feed behind a 60 s cache. |
| Vercel Functions | Hobby quota | a few thousand invocations / month | Well inside limits. |
| Vercel Cron | Hobby: daily jobs allowed | 1 job / day | |
| Resend (optional) | 3,000 emails / month | a handful | |

Pro at $20 / month is the single upgrade if any of these become a concern.

## Acceptance criteria

- `npm run build` succeeds in CI with no new secrets.
- Every post page is still a static file in the build output; only `/api/*`
  and `/admin/*` appear as functions.
- The recap post streams and seeks from Blob on desktop Safari, iOS Safari and
  Chrome. `/rss.xml` carries the Blob enclosure with the correct byte length
  and an `itunes:duration`.
- A first-time comment shows "awaiting moderation," appears in
  `/admin/comments`, and is visible on the post within 60 seconds of approval.
- A second comment from the same email is live immediately.
- A comment reported three times disappears from the post until reviewed.
- Submitting from a `curl` with a mismatched `Origin`, or six times in an hour,
  is rejected.
- `commentbox.io` is gone from `package.json` and the lockfile.

## Order of work and rough effort

| Step | Effort |
|---|---|
| Part A end to end | one working session |
| B2–B3 provisioning and adapter | half a session |
| B4 endpoints + tests | one to two sessions |
| B5 island + tests + cleanup | one session |
| Admin pages | one session |
| B6 import (only if data exists) | half a session |

## Sources

- Vercel Blob usage and pricing: https://vercel.com/docs/vercel-blob/usage-and-pricing
- Vercel limits: https://vercel.com/docs/limits
- Neon on the Vercel Marketplace: https://vercel.com/marketplace/neon
- Vercel Postgres → Neon transition: https://neon.com/docs/guides/vercel-postgres-transition-guide
- Astro Vercel adapter: https://docs.astro.build/en/guides/integrations-guide/vercel/
- Astro on Vercel: https://vercel.com/docs/frameworks/frontend/astro
