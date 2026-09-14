# Plan 2 — Pat on Sports for iOS

**Status:** proposed · **Written:** 2026-09-14 · **Depends on:** nothing to start; Plan 1 (comments API) for in-app comments

> **Phase 0 / Part A note (site repo):** A1–A4 (privacy, support, `/api/v1/*`, AASA, tests) ship on their own. **A5** (push broadcast endpoint + GitHub Action) stays with **Plan 1 / Phase 4** — it needs the Vercel adapter, Neon `push_tokens`, and Expo Push secrets that Plan 1 introduces.

## Goal

An App Store app that readers install to read every article, listen to the
narrated ones, and get a push when a new recap lands. It should feel like a
native reader, not the website in a box, because Apple rejects the latter
under guideline 4.2 and because the website already works fine on a phone.

## Non-goals for v1

- Accounts, sign-in, paywalls, subscriptions.
- Writing or publishing posts from the app. Posts stay Markdown in the repo.
- iPad layouts. Ship iPhone-only (`supportsTablet: false`) to keep the
  screenshot and review surface small; iPad can follow.
- Live scores, schedules, or anything that needs an NFL data licence.

## The one decision that shapes everything: Expo

Build the app with **Expo (React Native, TypeScript, Expo Router)** and ship
it with **EAS Build / EAS Submit**.

Why, for this project specifically:

- The site is TypeScript and React. The Pros & Cons parser, the category
  logic and the post types in `src/lib/` port over as-is.
- The same codebase is Plan 3. One app, two stores, one set of bugs.
- EAS handles signing, provisioning profiles and the App Store upload from the
  command line. For a solo maintainer that removes most of the Xcode ceremony.
- Expo's `expo-audio`, `expo-notifications`, `expo-file-system` and
  `expo-sqlite` cover every native feature in this plan without writing Swift.

The alternative is SwiftUI. It gives the most platform-native feel and the
easiest widget story, at the cost of a second codebase for Android and a
language the site does not use. If Android is ever dropped from the roadmap,
SwiftUI becomes the better answer; until then, Expo.

Repo layout: a new repository, `pat-on-sports-app`, rather than a monorepo.
The site's CI is tuned for a static build and should not grow an iOS
toolchain. The contract between the two repos is the JSON API below, versioned
with a `schemaVersion` field.

---

## Part A — Content API on the site (changes in `pat-on-sports`)

The site is prerendered, so the API is also prerendered: JSON files generated
at build time from the `blog` collection, served from Vercel's CDN, and
invalidated automatically by every deploy. No functions, no secrets, no
runtime cost.

### A1. Endpoints

| Route | Contents |
|---|---|
| `GET /api/v1/posts.json` | `schemaVersion`, `generatedAt`, `site`, and an array of every post's metadata: `slug`, `title`, `date`, `description`, `tags`, `category` (label + slug + colour token), `heroImage` (absolute URL), `heroAlt`, `season`, `week`, `round`, `opponent`, score fields, `result`, `readingTimeMinutes`, `audio` (absolute URL or null), `audioDurationSeconds`, `bodyHash`. |
| `GET /api/v1/posts/[slug].json` | Everything above plus `markdown` (the raw body), `prosCons` (output of `parseProsConsMarkdown`, so Pros & Cons posts render as native panels), `heroCaption`, and `related` (three slugs, from `getRelatedPosts`). |
| `GET /api/v1/manifest.json` | App-facing config the app reads on launch: minimum supported `schemaVersion`, the comments API base, and a `message` field for an emergency banner. Lets you fix or announce things without an app release. |

Implementation: `src/pages/api/v1/posts.json.ts` and
`src/pages/api/v1/posts/[slug].json.ts` are static endpoints using
`getStaticPaths`, exactly like `rss.xml.ts` today. The shape lives in
`src/lib/api.ts` as Zod schemas, exported types, and pure builder functions,
so it is unit-tested and the app can copy the schema file verbatim.

`bodyHash` is a SHA-256 of the Markdown body. The app uses it to decide
whether a cached article needs re-downloading after a correction is published.

### A2. Delivery details

- `vercel.json` headers for `/api/v1/(.*)`:
  `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=86400`
  and `Access-Control-Allow-Origin: *` (harmless for a public read-only feed,
  useful if the site's own search ever wants it).
- Hero images keep their existing URLs. They are 1200×675 already. If list
  scrolling ever feels heavy, add a 600-wide variant via Astro's image
  pipeline; not needed for launch.
- Add `/api` to `robots.txt` disallow. Feeds are for the app, not Google.

### A3. Pages the stores require

Both Apple and Google require a public privacy policy URL, and Apple requires
a support URL. Add to the site:

- `/privacy` — what the app collects (push token if enabled, comment name and
  email hash if you comment, nothing else), no analytics SDKs, no ads, how to
  request deletion.
- `/support` — a contact email and a link to the GitHub issue templates.

These are ordinary Astro pages with `BaseLayout`. Do them first; everything in
App Store Connect links to them.

### A4. Universal Links

Serve `public/.well-known/apple-app-site-association` (no extension) with
`Content-Type: application/json` via a `vercel.json` header rule. It lists the
app's Team ID + bundle ID and the paths `/blog/*`, `/category/*`, `/tag/*`.
After this, tapping a shared patonsports.com link on a phone with the app
installed opens the article in the app.

### A5. New-post signal for push

A GitHub Actions workflow in the site repo, triggered on push to `main` with
`paths: posts/**`, diffs the commit for added `posts/*.md` files and calls
`POST /api/push/broadcast` on the site with a bearer secret and the new slug.
The broadcast endpoint is a Vercel Function (Plan 1 added the adapter; if Plan
1 has not shipped, this is the first on-demand route and pulls the adapter in
on its own). It reads tokens from a `push_tokens` table in Neon and sends via
the Expo Push API.

Sending from the deploy pipeline rather than from the app keeps the app free of
any polling logic.

---

## Part B — The app

### B1. Project setup

- `npx create-expo-app pat-on-sports-app --template tabs` on the current Expo
  SDK, TypeScript strict, Expo Router, New Architecture (default).
- Bundle identifier `com.patonsports.app`. App name "Pat on Sports".
- `eas init`, then `eas build:configure` with three profiles: `development`
  (dev client, simulator), `preview` (internal distribution, ad hoc), and
  `production` (App Store).
- EAS Update enabled with `runtimeVersion: { policy: "appVersion" }`, so
  JS-only fixes ship over the air without a store review. Apple allows this
  for interpreted code that does not change the app's purpose.
- Lint and test: ESLint (Expo config), Jest with `@testing-library/react-native`,
  Maestro for a handful of on-simulator flows. GitHub Actions runs lint and
  tests on PRs; EAS Build runs on tag.

### B2. Screens

Tab bar with four tabs. Names mirror the site so the mental model transfers.

| Tab | Content |
|---|---|
| **Latest** | Featured lead card, then the reverse-chronological feed. Pull to refresh. Category chips (Pros & Cons, Preview, NFL, UCLA) at the top, the same order as `CATEGORY_ORDER`. |
| **Archive** | Search box over title, description, tags and body (the body is available once cached; otherwise metadata only). Grouped by season with the playoff-run shelf, as on the homepage. |
| **Listen** | Only posts with audio. Shows duration, download state, and a resume marker. Mini-player docked above the tab bar while something is playing. |
| **About** | The site's About text, a link to the website, RSS, privacy, support, and the "not affiliated" line. |

**Article screen**

- Header: category pill, scoreline badge (`W 27–20`), date, reading time,
  opponent tags — same hierarchy as `src/pages/blog/[slug].astro`.
- Body rendered natively from Markdown with `react-native-markdown-display`,
  styled to the site's type scale. No WebView anywhere in the app. This is the
  single most important 4.2 mitigation.
- Pros & Cons posts render `prosCons` as two native cards, swipeable
  side-by-side on narrow screens.
- Audio player row when `audio` is set.
- Share sheet (native `Share`) with the canonical URL.
- Older / Newer navigation and the three related posts.
- Comments section (see B6).

### B3. Data and offline

- **TanStack Query** with a persisted cache in **MMKV** for `posts.json` and
  `manifest.json`. Stale-while-revalidate: show cached instantly, refresh in
  the background.
- **Article bodies** cached in `expo-sqlite` keyed by slug + `bodyHash`. On
  Wi-Fi, prefetch the ten newest bodies after the list loads, so the app reads
  fully offline on a plane or in a stadium with no signal.
- **Hero images** via `expo-image` with its disk cache.
- **Audio downloads** via `expo-file-system` into the app's documents
  directory, with a per-post download button, progress, and a "Downloads"
  filter on the Listen tab. Playback prefers the local file when present.

### B4. Audio

`expo-audio` with:

- `UIBackgroundModes: ["audio"]` so playback continues with the screen locked.
- Now Playing metadata (title, "Pat on Sports", hero art) so the lock screen,
  Control Center and AirPods controls work.
- Speeds 1× to 2× in the same steps as the web player.
- Resume position saved per slug on pause and every 10 seconds; a "Continue
  listening" card on Latest.
- Skip ±15 s, matching the web player.

### B5. Push notifications

- `expo-notifications`. Ask for permission only after a reader has opened two
  articles, with a one-screen explanation ("one notification per new post, a
  couple a week in season"). Asking on first launch is the fastest way to a
  "no".
- Register the Expo push token with `POST /api/push/register` (Neon
  `push_tokens` table: token, platform, created_at, last_seen). Unregister on
  opt-out.
- Tapping a notification deep-links to the article via Expo Router.
- Send is triggered by the site's GitHub Action (Part A5). Tokens that Expo
  reports as invalid are deleted on the next broadcast.

### B6. Comments (requires Plan 1)

Native list and form calling the Plan 1 endpoints:

- `GET /api/comments/[slug].json` for the thread; `POST` to submit; `POST
  /api/comments/[id]/report` to flag.
- **Block** is client-side: a blocked commenter's name hash is stored locally
  and their comments are hidden on this device. Apple's UGC guideline (1.2)
  asks for the ability to block abusive users; a per-device block satisfies
  it for anonymous commenting.
- The About tab and the App Store listing carry the support email, which
  closes the last 1.2 requirement (published contact information).

If Plan 1 has not shipped when the app is ready, launch the app with comments
read-only from CommentBox's public thread, or omit the section and add it in
an update. Do not embed CommentBox's web widget in a WebView.

### B7. Guideline 4.2 checklist

The reviewer needs to see native value the website cannot offer. The app has:

- [ ] Native rendering of every article (no WebView).
- [ ] Offline reading with automatic prefetch.
- [ ] Downloaded audio with background playback and lock-screen controls.
- [ ] Push notifications for new posts.
- [ ] Native tab navigation, pull to refresh, share sheet, Universal Links.
- [ ] Continue-listening and reading-position resume.

Say so in the App Review notes, briefly.

### B8. Intellectual property (guideline 5.2)

The site is independent commentary and says so. The app must too:

- App icon and screenshots use the site's own wordmark and navy/red palette.
  No Patriots, NFL, UCLA or NCAA logos, uniforms or trademarked marks
  anywhere in the icon, screenshots, or App Store text.
- App name "Pat on Sports". Subtitle "Patriots & UCLA recaps by Pat" is fine;
  "Patriots" as a descriptive word is not a trademark use, a logo is.
- Description ends with the same not-affiliated sentence the README uses.
- Hero images inside the app are the ones already published on the site under
  the site's content licence; nothing new is introduced.

### B9. App Store Connect

- Apple Developer Program, individual, $99 / year. No D-U-N-S number needed.
- App record with bundle ID, primary category **Sports**, secondary **News**.
- Age rating questionnaire: none of the flagged content; the "unrestricted web
  access" answer is No (no WebView); "user-generated content" Yes if comments
  ship.
- App Privacy: Push token → "Device ID, used for app functionality, not linked
  to identity." Comments → "Name, Email Address (optional), User Content,
  linked to identity if the user gives their name." No tracking. No
  third-party analytics SDK in v1 so the form stays short.
- Privacy policy URL `/privacy`, support URL `/support`, marketing URL the
  homepage.
- Screenshots: 6.9-inch set is required; Apple scales it for smaller phones.
  Five screens: Latest, an article, a Pros & Cons article, Listen with the
  mini-player, and a notification example.
- Review notes: no login required; mention the native features list; note
  that comments are moderated.

### B10. Build, test, submit

1. `eas build -p ios --profile development` → run on the simulator and on
   your phone via the dev client. Iterate here.
2. `eas build -p ios --profile preview` → install on a few friends' phones via
   ad hoc distribution for a first pass.
3. `eas build -p ios --profile production --auto-submit` → App Store Connect
   → TestFlight (10 to 15 minutes to process).
4. TestFlight internal group (you), then an external group of readers.
   External TestFlight builds get a light review of their own.
5. Submit for review from App Store Connect with the screenshots, text and
   notes above. Choose manual release so you control the day.
6. After approval: phased release over 7 days is optional but cheap
   insurance.

Post-launch: JS fixes via `eas update --branch production`; anything touching
native modules or `app.json` permissions needs a new build and review.

### B11. Optional, after launch

- **Home Screen widget** ("latest post" small and medium sizes) via a config
  plugin such as `@bacons/apple-targets`. This is the one feature that needs
  a little Swift. It is also a strong 4.2 differentiator if review pushes
  back.
- **Live Activity** for game day is tempting but needs a live-score source the
  site does not have. Skip.
- iPad layout.
- Dark mode. The site is light-only; the app can be too, but `userInterfaceStyle: "automatic"` with a navy dark palette is a small win for a reading app.

---

## Phases and effort

| Phase | Work | Effort |
|---|---|---|
| 0 | Site: `/privacy`, `/support`, `/api/v1/*`, AASA file, tests | 1–2 sessions |
| 1 | App scaffold, Latest + Archive + Article with native Markdown and Pros & Cons | 3–4 sessions |
| 2 | Offline cache, image cache, prefetch | 1–2 sessions |
| 3 | Audio: player, background, downloads, resume | 2 sessions |
| 4 | Push: register endpoint, GitHub Action, broadcast function | 1–2 sessions |
| 5 | Comments (after Plan 1) | 1–2 sessions |
| 6 | Icon, screenshots, App Store Connect, TestFlight, review | 1–2 sessions plus Apple's queue |

Realistic calendar time for a solo maintainer working evenings: four to six
weeks to TestFlight, another one to two to approval.

## Costs

| Item | Cost |
|---|---|
| Apple Developer Program | $99 / year |
| EAS | Free tier covers a small number of builds per month with a slower queue; the paid tier ($19 / month at time of writing, verify) makes sense during the build-heavy weeks and can be cancelled after. |
| Expo Push, Vercel Functions, Neon | Within free allowances at this readership |

## Risks

- **4.2 rejection.** Mitigated by B7. If it happens anyway, the widget (B11)
  is the standard second submission.
- **5.2 IP flag** on team imagery. Mitigated by B8; review hero images once
  more before submission for any that show a logo prominently.
- **Plan 1 timing.** Comments depend on it. The app can launch without
  comments; the section is additive.
- **Audio in git.** If Plan 1 Part A has not happened, audio URLs in the JSON
  feed still point at `public/audio/`, which works. Nothing here blocks on it.

## Acceptance criteria

- Airplane mode: the app opens, shows the feed, opens any of the ten newest
  articles, and plays a downloaded recording.
- Lock the phone mid-recording: audio continues; lock-screen controls work.
- Publish a post on the site: the phone receives a notification within a few
  minutes and tapping it opens that article.
- Tap a patonsports.com link in Messages: it opens in the app.
- No WebView in the bundle (`grep -r WebView` in the app repo returns nothing).
- App Store listing has no NFL, Patriots, UCLA or NCAA marks.

## Sources

- Expo EAS Build: https://docs.expo.dev/build/introduction/
- Submit to app stores: https://docs.expo.dev/deploy/submit-to-app-stores/
- Apple guideline 4.2 explained: https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper
- App Store rejection guide (1.2 UGC, 4.2, 5.2): https://www.revenuecat.com/blog/growth/the-ultimate-guide-to-app-store-rejections
