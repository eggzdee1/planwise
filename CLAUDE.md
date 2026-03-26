# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Planwise** is a full-stack project management app with:
- **Backend:** `server/` — Express.js + Prisma + PostgreSQL (port 4000)
- **Frontend:** `web/` — Next.js 16 (App Router) + React 19 + Tailwind CSS 4 (port 3000)
- **Auth:** Google OAuth via NextAuth.js v4, database sessions stored in PostgreSQL

## Commands

### Backend (`server/`)
```bash
npm run dev      # ts-node-dev watch mode
npm run build    # tsc → dist/
npm run start    # node dist/index.js
npx prisma migrate dev   # run migrations
npx prisma studio        # open Prisma Studio
```

### Frontend (`web/`)
```bash
npm run dev      # next dev
npm run build    # next build
npm run lint     # eslint
npx prisma migrate dev   # run migrations (web has its own schema copy)
```

## Environment Setup

**Server** (`server/.env`): Copy from `server/.env.example`
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/planwise
WEB_APP_URL=http://localhost:3000
PORT=4000
```

**Web** (`web/.env.local`): Copy from `web/.env.local.example`
```
NEXT_PUBLIC_API_URL=http://localhost:4000
DATABASE_URL=postgresql://postgres:password@localhost:5432/planwise
AUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Architecture

### Database / Prisma
Both `server/prisma/schema.prisma` and `web/prisma/schema.prisma` are **identical** — they share the same PostgreSQL database. When adding models or migrations, update **both** schema files. The server schema is the authoritative one for running migrations.

**Models:** `User`, `Account`, `Session`, `VerificationToken` (NextAuth), `Project` (with many-to-many member relationship via implicit join table).

### Authentication Flow
- NextAuth handles OAuth at `web/src/app/api/auth/[...nextauth]/route.ts`
- Sessions are stored in the database (`Session` model)
- The Express backend validates sessions by reading the NextAuth session token from the `Bearer` header or cookies, then looking it up in the database directly (no shared secret — it queries Prisma)
- Frontend sends `credentials: "include"` on all API requests to the backend

### Backend API (`server/src/index.ts`)
- Custom auth middleware checks `Authorization: Bearer <token>` or cookie
- Routes: `GET /auth/me`, `GET /projects`, `POST /projects`, `PATCH /projects/:id`, `DELETE /projects/:id`
- Project mutations verify the user is a member (or owner for delete)

### Frontend Structure
- `web/src/auth.ts` — NextAuth config (Google provider, PrismaAdapter, database sessions)
- `web/src/lib/prisma.ts` — singleton Prisma client with dev logging
- Pages use server components for auth checks; interactive UI is in client components
- `web/src/components/projects-dashboard.tsx` — main CRUD UI for projects (client component, calls backend API)
- Path alias `@/*` maps to `web/src/*`

### Known Issues / Notes
- Profile images from Google are disabled due to API rate limits; a caching solution is needed before re-enabling
- The `web/src/app/projects/[id]/page.tsx` page is a placeholder — project workspace not yet implemented
