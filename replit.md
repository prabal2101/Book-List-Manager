# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: JWT + bcryptjs (stored in localStorage as `library_token`)

## Artifacts

### Library Book Tracker System (`artifacts/library-tracker`)
- **Type**: react-vite
- **Preview Path**: `/`
- Full-stack library management app with AI chatbot
- Pages: Login, Register, Dashboard (role-based), Books, Book Detail, Borrow History, Wishlist, Admin Dashboard, Admin Books, Admin Users, Chat

### API Server (`artifacts/api-server`)
- **Preview Path**: `/api`
- Express 5 REST API serving all routes

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Schema

- **users**: id, name, email, password, role (student|librarian|admin), createdAt
- **books**: id, title, author, subject, branch (CSE|IT|Civil|Mechanical|Electrical), availability, section, rack_number, row_number, shelf_number, isbn, createdAt
- **borrows**: id, user_id, book_id, borrow_date, due_date, return_date, createdAt
- **wishlists**: id, user_id, book_id, createdAt

## Important Notes

- `lib/api-zod/src/index.ts` only exports from `./generated/api` (not types) to avoid name conflicts
- After running codegen, fix index.ts to only export from `./generated/api`
- AI chatbot uses OpenAI API (key optional, falls back to smart rule-based responses)
- 25 sample books pre-seeded across all 5 branches

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
