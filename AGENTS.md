# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router routes, layouts, and page components.
- `components/`: Reusable UI components.
- `lib/`: Shared utilities (e.g., Markdown parsing helpers).
- `posts/`: Markdown content files (source of blog posts).
- `public/`: Static assets served by Next.js.
- `test/`: Unit tests.
- `types/`: Shared TypeScript types.

## Build, Test, and Development Commands
- `npm run dev`: Start the local Next.js dev server.
- `npm run build`: Create a production build.
- `npm run start`: Run the production server from the build output.
- `npm run lint`: Run ESLint for code quality checks.
- `npm run test`: Run Vitest in watch mode.
- `npm run test:run`: Run Vitest once.
- `npm run test:coverage`: Run tests with coverage reporting.

## Coding Style & Naming Conventions
- Language: TypeScript + React (Next.js App Router).
- Formatting: follow existing file patterns; keep JSX and TS consistent with surrounding code.
- Linting: use `npm run lint` before submitting changes.
- Content: Markdown posts live in `posts/` and should use clear, descriptive filenames.

## Testing Guidelines
- Framework: Vitest with React Testing Library.
- Location: place tests in `test/` and name files with `.test.ts` or `.test.tsx`.
- Run targeted tests with `vitest <pattern>` or use the scripts above.

## Commit & Pull Request Guidelines
- Commit messages: no strict convention found; recent history uses short, present-tense summaries (e.g., “added unit tests”).
- PRs: include a concise description, link related issues if applicable, and add screenshots for UI changes.

## Configuration & Secrets
- Local configuration can use `.env`; never commit secrets.
- Deployment builds should rely on `npm run build` with environment variables set by the host.
