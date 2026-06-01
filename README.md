# StudioOS

Creative Production Intelligence System

A context-aware production workflow platform that helps filmmakers, creative agencies, and content creators move from **Idea → First Cut**.

---

## Repository Structure

```
StudioOS/
├── apps/web                   Primary Next.js application
├── packages/ui                Shared StudioOS UI components
├── packages/shared            Shared types, utilities, and constants
├── packages/ai-service        Unified AI provider interface
├── packages/context-engine    Context Package assembly
├── packages/dependency-engine Dependency tracking and impact analysis
├── packages/assembly-engine   Production assembly and Remotion blueprints
├── database/                  Supabase migrations, schema, and seed data
├── docs/                      Project documentation
├── assets/                    Branding, diagrams, and references
└── scripts/                   Development automation
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Package Manager | pnpm |
| Monorepo | Turborepo |

---

## Prerequisites

- Node.js 20 LTS or later
- pnpm 9 or later

```bash
node --version   # >= 20.0.0
pnpm --version   # >= 9.0.0
```

Install pnpm if needed:

```bash
npm install -g pnpm
```

---

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/your-org/studioos.git
cd studioos

# 2. Install all dependencies
pnpm install

# 3. Set up environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local with your Supabase and API keys

# 4. Start the development server
pnpm dev
```

The application runs at http://localhost:3000.

---

## Available Scripts

All scripts run from the repository root.

| Script | Description |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Build all packages and the application |
| `pnpm lint` | Lint all packages and the application |
| `pnpm typecheck` | Type-check all packages and the application |
| `pnpm format` | Format all files with Prettier |
| `pnpm format:check` | Check formatting without writing |

---

## Package Architecture

All packages live in `packages/` and are scoped under `@studioos/*`.

| Package | Responsibility | Status |
|---|---|---|
| `@studioos/ui` | Shared StudioOS UI components | Stub — Sprint 2 |
| `@studioos/shared` | Types, utilities, constants | Stub — Sprint 1 |
| `@studioos/ai-service` | AI provider interface | Stub — Sprint 3 |
| `@studioos/context-engine` | Context Package assembly | Stub — Sprint 4 |
| `@studioos/dependency-engine` | Dependency tracking | Stub — Sprint 5 |
| `@studioos/assembly-engine` | Production assembly | Stub — Sprint 6 |

**Dependency rules:**

- Packages may only import from `@studioos/shared`
- No circular dependencies
- All AI interactions route through `@studioos/ai-service` only
- Engine packages are server-side only — never import in Client Components

---

## Adding shadcn/ui Components

```bash
cd apps/web
npx shadcn@latest add [component-name]
```

Components install into `apps/web/components/ui/`. Always use `shadcn@latest` to ensure Tailwind v4 compatibility.

---

## Environment Variables

Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in your values. See that file for the complete variable reference and documentation.

Never commit `.env.local` or any file containing real credentials.

---

## Development Standards

- TypeScript only — no `.js` files
- No use of `any`
- Prefer explicit types
- File names: `kebab-case`
- Component names: `PascalCase`
- Variables: `camelCase`
- Server Components by default
- Client Components only when required (interactivity, browser APIs)
- No business logic in UI components
- Feature-based folder organization in `apps/web`

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code |
| `develop` | Integration branch — all PRs target here |
| `feature/*` | Feature development branches |
