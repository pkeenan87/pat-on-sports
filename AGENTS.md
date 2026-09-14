# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Astro pages, layouts, components, and shared utilities.
- `posts/`: Markdown blog posts (source of truth for content).
- `public/`: Static assets served by Astro.
- `scripts/`: Authoring helpers (Google Docs HTML/zip to Markdown).
- `test/`: Shared Vitest setup.

## Build, Test, and Development Commands
- `npm run dev`: Start the local Astro dev server.
- `npm run build`: Create a production build.
- `npm run preview`: Serve the production build locally.
- `npm run lint`: Run `astro check` for type/content validation.
- `npm run test`: Run Vitest in watch mode.
- `npm run test:run`: Run Vitest once.
- `npm run test:coverage`: Run tests with coverage reporting.
- `npm run new-post`: Convert a Google Doc export into `posts/*.md`.

## Coding Style & Naming Conventions
- Language: TypeScript + Astro (with React islands only where interactivity is needed).
- Formatting: follow existing file patterns; keep JSX, Astro, and TS consistent with surrounding code.
- Linting: use `npm run lint` before submitting changes.
- Content: Markdown posts live in `posts/` and should use clear, descriptive filenames.

## Testing Guidelines
- Framework: Vitest with React Testing Library.
- Location: colocate tests with source (`*.test.ts` / `*.test.tsx`) or place them in `test/`.
- Run targeted tests with `vitest <pattern>` or use the scripts above.

## Commit & Pull Request Guidelines
- Commit messages: no strict convention found; recent history uses short, present-tense summaries (e.g., “added unit tests”).
- PRs: include a concise description, link related issues if applicable, and add screenshots for UI changes.

## Configuration & Secrets
- Local configuration can use `.env`; never commit secrets.
- Public runtime vars use the `PUBLIC_` prefix (`PUBLIC_SITE_URL`, `PUBLIC_TWITTER_SITE`, `PUBLIC_COMMENTS_API_BASE`, `PUBLIC_APP_BANNER_MESSAGE`).
- Comment/admin secrets (`DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`,
  `IP_HASH_SALT`, `CRON_SECRET`) and `BLOB_READ_WRITE_TOKEN` stay server-side /
  local-only — never `PUBLIC_`, never required for `npm run build`.
- Deployment builds should rely on `npm run build` with environment variables set by the host (Vercel).
