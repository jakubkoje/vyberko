# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vyberko is a Nuxt 4 application built with TypeScript, Vue 3, and Nuxt UI. It's a dashboard application with authentication, customer management, and settings functionality. The application uses PostgreSQL with Drizzle ORM for database operations and is configured as a client-side only app (SSR disabled).

## Package Manager

This project uses **pnpm** (version 10.18.1) as the package manager. Always use `pnpm` commands, not npm or yarn.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server (runs on http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Linting and formatting
pnpm lint

# Type checking
pnpm typecheck

# Database operations
pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Run database migrations
```

## Architecture

### Application Structure

- **`app/`** - Client-side Nuxt application code
  - `pages/` - File-based routing with nested routes for admin and auth
  - `layouts/` - Three layouts: `default.vue`, `auth.vue`, and `admin.vue`
  - `components/` - Vue components organized by feature (home, customers, inbox, settings)
  - `composables/` - Reusable composition functions (e.g., `useDashboard.ts`)
  - `utils/` - Shared utility functions
  - `types/` - TypeScript type definitions
  - `assets/css/` - Global CSS styles

- **`server/`** - Server-side API and utilities
  - `api/` - API route handlers (e.g., `hello.get.ts`)
  - `database/` - Database schema and migrations
  - `utils/` - Server utilities including Drizzle setup

### Key Architectural Patterns

1. **Database Layer**:
   - Schema defined in `server/database/schema.ts` using Drizzle ORM
   - Database connection utility in `server/utils/drizzle.ts` exports `useDrizzle()` function
   - Migrations stored in `server/database/migrations/`
   - Type inference available via `typeof schema.users.$inferSelect`

2. **Layouts System**:
   - `admin.vue` - Full dashboard layout with sidebar navigation, search, user menu, teams menu, and notifications slideover
   - `auth.vue` - Simple layout for authentication pages
   - `default.vue` - Basic layout for other pages

3. **Navigation & Shortcuts**:
   - Global keyboard shortcuts defined in `useDashboard` composable:
     - `g-h`: Navigate to home
     - `g-i`: Navigate to inbox
     - `g-c`: Navigate to customers
     - `g-s`: Navigate to settings
     - `n`: Toggle notifications slideover
   - Sidebar navigation with collapsible/resizable sidebar
   - Command palette search (`UDashboardSearch`)

4. **Component Organization**:
   - Feature-based component folders (home, customers, inbox, settings)
   - Shared components at root level (UserMenu, TeamsMenu, NotificationsSlideover)

## Configuration

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (format: `postgresql://user@host:port/database`)
- Configured in `.env` file (not committed to git)
- Also set in `nuxt.config.ts` under `runtimeConfig.databaseUrl`

### Nuxt Configuration

- **SSR disabled** (`ssr: false`) - This is a client-side only application
- **Modules**: @nuxt/eslint, @nuxt/image, @nuxt/ui
- **ESLint**: Configured with stylistic rules enabled
- **Devtools**: Enabled for development

### Drizzle Configuration

- Output directory: `./server/database/migrations`
- Schema file: `./server/database/schema.ts`
- Dialect: PostgreSQL

## Database Schema

Current schema includes a `users` table with:
- `id` (serial, primary key)
- `name`, `email` (unique), `password`, `avatar` (text fields)
- `createdAt`, `updatedAt` (timestamps with timezone)
- Auto-updating `updatedAt` field using Luxon

## Node Version

This project requires Node.js version **22.20.0** as specified in `package.json` engines.
