# Repository Guidelines

## Project Structure & Module Organization

Planwise is split into two Node/TypeScript packages:

- `web/`: Next.js 16 App Router frontend with React 19 and Tailwind CSS 4.
- `server/`: Express 5 API backed by Prisma and PostgreSQL.
- `web/src/app/`: routes, layouts, global CSS, and API handlers.
- `web/src/components/`: reusable client UI components.
- `web/src/types/` and `web/src/lib/`: shared frontend types and helpers.
- `server/src/index.ts`: backend API entry point.
- `server/prisma/` and `web/prisma/`: Prisma schemas; keep them in sync. Server migrations live under `server/prisma/migrations/`.
- `web/public/`: static frontend assets.

## Build, Test, and Development Commands

Run commands from the package directory unless noted.

- `cd web && npm run dev`: start the frontend at `http://localhost:3000`.
- `cd web && npm run build`: build the Next.js production bundle.
- `cd web && npm run lint`: run ESLint for the frontend.
- `cd server && npm run dev`: start the API in watch mode, normally on port `4000`.
- `cd server && npm run build`: compile TypeScript into `dist/`.
- `cd server && npm run start`: run the compiled backend.
- `cd server && npx prisma migrate dev`: apply database migrations from the authoritative server schema.
- `npx prisma studio`: inspect local database data.

## Coding Style & Naming Conventions

Use TypeScript throughout. Follow the existing two-space indentation and semicolon style. React components use PascalCase exports and kebab-case filenames, such as `project-row.tsx`. Shared types belong in `web/src/types/` and use descriptive PascalCase names. Use the `@/*` alias for imports from `web/src/*`. Prefer small components and route-level data loading in App Router pages.

## Testing Guidelines

No automated test framework is currently configured. For now, verify changes with `npm run build` in the touched package and `npm run lint` for frontend changes. When adding tests, colocate them near the code or place integration tests in `tests/`, using filenames such as `project-row.test.tsx` or `projects-api.test.ts`.

## Commit & Pull Request Guidelines

Recent commit messages are short imperative summaries, often ending with a period, for example `Added backlog.` or `Factored out components from projects-dashboard.tsx.` Keep messages focused on behavior changed. Pull requests should include a description, verification steps, linked issue when available, and screenshots for UI changes. Call out schema or migration changes explicitly.

## Security & Configuration Tips

Do not commit real `.env` files. Copy `server/.env.example` and `web/.env.local.example` for local setup. Keep `DATABASE_URL`, OAuth credentials, and `AUTH_SECRET` private. The frontend expects `NEXT_PUBLIC_API_URL=http://localhost:4000` during local development.
