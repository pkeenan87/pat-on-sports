## What this changes

<!-- And why. One or two sentences is usually enough. -->

## Checks

- [ ] `npm run lint` clean (typechecks the app *and* validates every post's front matter)
- [ ] `npm run test:run` passes
- [ ] `npm run build` succeeds
- [ ] Checked the change in `npm run dev`

## If this adds or edits a post

- [ ] Front matter has `title`, `date`, `description`, and `tags`
- [ ] Tags put it in the intended category — see `CATEGORY_TAG_NAMES` in `src/lib/posts.ts`
- [ ] `heroImage` is committed under `public/images/` and `heroAlt` describes it
- [ ] Scores and names verified against a box score

## If this touches the UI

- [ ] Renders correctly at mobile width and on desktop
- [ ] Still works with JavaScript disabled, or degrades gracefully
- [ ] No new client-side JavaScript on a page that didn't already ship some

## If this touches search, filters, or routing

- [ ] Existing `?q=` / `?tag=` / `?category=` links still resolve
- [ ] Covered by a test in `src/lib/posts.test.ts`
