# StudioOS — Master Architecture

**Status:** Active
**Last Updated:** 2026-06-02
**Reflects:** `develop` @ `db43dda` (post-Sprint 4)

---

## System Overview

StudioOS is a Creative Production Intelligence System designed to guide filmmakers, creative agencies, and content creators from Idea to First Cut through a context-aware production workflow.

The system is built as a Next.js 15 monorepo hosted on Vercel, backed by Supabase (PostgreSQL + Auth + Storage), with a planned AI layer routed through an internal service package.

---

## Monorepo Structure

```
StudioOS/
├── apps/
│   └── web/                    # Next.js 15 application
├── database/
│   ├── migrations/             # SQL migrations, applied in numeric order
│   ├── storage/                # Storage bucket setup documentation
│   ├── schema/                 # Reference schema (not applied directly)
│   └── seed/                   # Seed data (not yet used)
├── docs/                       # Governance and architecture documents
├── packages/
│   ├── shared/                 # Types, utils, constants — zero dependencies
│   ├── ui/                     # StudioOS composite components
│   ├── ai-service/             # All AI provider calls (not yet implemented)
│   ├── context-engine/         # Context assembly for AI (not yet implemented)
│   ├── dependency-engine/      # Production dependency tracking (not yet implemented)
│   └── assembly-engine/        # Output assembly (not yet implemented)
├── scripts/                    # Build and utility scripts
└── CURRENT_STATE.md            # Authoritative project state (read each session)
```

---

## Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js | 15 | App Router, Server Components, Server Actions |
| Language | TypeScript | 5.x | Strict mode, `exactOptionalPropertyTypes` |
| Styling | Tailwind CSS | v4 | `@theme inline`, OKLCH colors, no config file |
| UI Components | shadcn/ui | Latest | Installed to `apps/web/components/ui/` |
| Database | Supabase PostgreSQL | — | Row Level Security on all tables |
| Auth | Supabase Auth | `@supabase/ssr` | SSR three-client pattern |
| Storage | Supabase Storage | — | Private buckets, signed URLs, Storage RLS |
| Package manager | pnpm | 9.x | Workspaces |
| Build orchestration | Turborepo | 2.x | `build`, `dev`, `lint`, `typecheck` tasks |
| Linting | ESLint | 9 | Flat config, FlatCompat for Next.js rules |
| Toast notifications | Sonner | — | Used in client mutations |

---

## `apps/web` Application Architecture

### Route Structure

```
app/
├── (auth)/                     # Unauthenticated routes — centered layout
│   ├── layout.tsx
│   ├── sign-in/page.tsx
│   └── sign-up/page.tsx
├── (app)/                      # Authenticated routes — TopNav shell
│   ├── layout.tsx              # TopNav, UserMenu, sign-out
│   ├── dashboard/
│   │   ├── page.tsx            # Project grid, create-project dialog
│   │   └── loading.tsx         # Skeleton
│   └── workspace/
│       └── [projectId]/
│           ├── layout.tsx      # WorkspaceHeader + WorkspaceSidebar + project ownership check
│           ├── page.tsx        # Redirect to /core
│           ├── core/page.tsx
│           ├── compass/page.tsx
│           ├── map/page.tsx
│           └── assets/page.tsx # Asset Library (full implementation)
├── auth/
│   └── callback/route.ts       # PKCE code exchange
└── actions/
    ├── auth.ts                 # signOut
    ├── projects.ts             # getProject, getProjects, createProject
    └── assets.ts               # getAssets, uploadAsset, addReference, deleteAsset
```

### Layout Hierarchy

```
RootLayout (app/layout.tsx)
└── (auth) layout — centered, unauthenticated
└── (app) layout — TopNav, authenticated shell
    └── workspace/[projectId] layout — WorkspaceHeader + WorkspaceSidebar
        └── panel pages (core, compass, map, assets)
```

### Middleware

`middleware.ts` protects `/dashboard` and all `/workspace/*` routes. It is the single enforcement point — not layouts. Layout-level redirects (`if (!project) redirect('/dashboard')`) are belt-and-suspenders only.

---

## Supabase Auth — Three-Client Pattern

| Client | File | Used By | Key |
|--------|------|---------|-----|
| Server | `lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers | Anon key via cookies |
| Browser | `lib/supabase/client.ts` | Client Components (upload-dialog) | `NEXT_PUBLIC_ANON_KEY` |
| Middleware | `lib/supabase/middleware.ts` | `middleware.ts` | Anon key via cookies |

**Rule:** Always call `supabase.auth.getUser()`, never `getSession()`. `getUser()` validates the JWT with Supabase Auth on every call. `getSession()` reads from cookie without re-validation.

---

## Database Schema

### `public.user_profiles` — Migration 001

Extends `auth.users`. Auto-created by trigger on new sign-up.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, FK → `auth.users` ON DELETE CASCADE |
| `display_name` | text | nullable |
| `avatar_url` | text | nullable |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() |

RLS: view own, update own (`auth.uid() = id`).
Trigger: `on_auth_user_created` — inserts row after `auth.users` INSERT.

### `public.projects` — Migration 002

Top-level creative project.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` |
| `owner_id` | uuid | NOT NULL, FK → `auth.users` ON DELETE CASCADE |
| `title` | text | NOT NULL |
| `format` | text | NOT NULL, CHECK (Film/Series/Commercial/Documentary/YouTube/Other) |
| `status` | text | NOT NULL, DEFAULT 'active', CHECK (active/archived) |
| `created_at` | timestamptz | NOT NULL |
| `updated_at` | timestamptz | NOT NULL |

Index: `projects_owner_id_idx` on `owner_id`.
RLS: four separate policies — select, insert, update, delete. All `auth.uid() = owner_id`.

### `public.project_core` — Migration 003

Creative foundation data. One row per project.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` |
| `project_id` | uuid | NOT NULL, FK → `projects` ON DELETE CASCADE |
| `synopsis` | text | nullable |
| `genre` | text | CHECK (drama/comedy/thriller/horror/action/romance/documentary/other) |
| `tone` | text | CHECK (dark/light/satirical/dramatic/comedic/neutral/other) |
| `themes` | text[] | NOT NULL, DEFAULT '{}' |
| `created_at` | timestamptz | NOT NULL |
| `updated_at` | timestamptz | NOT NULL |

Unique index: `project_core_project_id_idx` on `project_id` — enforces one row per project.
RLS: single `for all` policy. Ownership validated via EXISTS subquery through `projects`.

### `public.assets` — Migration 004

Project asset library — files and external references.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` |
| `project_id` | uuid | NOT NULL, FK → `projects` ON DELETE CASCADE |
| `owner_id` | uuid | NOT NULL, FK → `auth.users` ON DELETE CASCADE |
| `name` | text | NOT NULL |
| `type` | text | CHECK (image/video/audio/document/reference/other) |
| `source` | text | CHECK (upload/external/generated) |
| `source_type` | text | NOT NULL, CHECK (uploaded/external) |
| `storage_path` | text | nullable — Supabase Storage path for uploads |
| `external_url` | text | nullable — URL for external references |
| `size` | bigint | nullable |
| `mime_type` | text | nullable |
| `description` | text | nullable |
| `notes` | text | nullable |
| `tags` | text[] | NOT NULL, DEFAULT '{}' |
| `created_at` | timestamptz | NOT NULL |
| `updated_at` | timestamptz | NOT NULL |

Indexes: `assets_project_id_idx`, `assets_owner_id_idx`.
RLS: single `for all` policy. Direct `auth.uid() = owner_id`.

**`source_type` semantics:**
- `'uploaded'` — file stored in Supabase Storage; `storage_path` is non-null, `external_url` is null.
- `'external'` — URL reference; `external_url` is non-null, `storage_path` is null.

---

## RLS Strategy — Two Patterns

**Pattern A — Direct ownership (top-level tables):**
Used by `projects`, `assets`.
```sql
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id)
```

**Pattern B — Join-through ownership (child tables):**
Used by `project_core` (no `owner_id` column; ownership validated through parent `projects`).
```sql
using (
  exists (
    select 1 from public.projects
    where projects.id = project_core.project_id
      and projects.owner_id = auth.uid()
  )
)
```

Choose Pattern A when the table has a direct `owner_id` FK to `auth.users`.
Choose Pattern B when the table belongs to an intermediate entity (e.g., project_core belongs to a project, not directly to a user).

---

## Supabase Storage Architecture

### Bucket: `assets`

| Property | Value |
|----------|-------|
| Access | Private |
| Path convention | `{owner_id}/{project_id}/{asset_id}/{filename}` |
| Upload method | Direct browser-to-storage via anon key (browser Supabase client) |
| Read method | Server-side signed URLs via `createSignedUrl()` — 1-hour expiry |
| Delete method | Server Action via server Supabase client |

### Storage RLS

Three policies on `storage.objects`:
- INSERT (`authenticated`): `(storage.foldername(name))[1] = auth.uid()::text`
- SELECT (`authenticated`): same
- DELETE (`authenticated`): same

The first path segment (`owner_id`) is the isolation boundary. A user cannot read, write, or delete another user's files regardless of whether they know the path.

### Upload Flow

```
Client                          Storage                     Server
  │                                │                           │
  ├── crypto.randomUUID() ─────────┼───────────────────────────┤
  ├── construct storagePath ───────┼───────────────────────────┤
  ├── upload(storagePath, file) ──▶│                           │
  │   (browser Supabase client)    │                           │
  │◀── success ────────────────────┤                           │
  ├── uploadAsset(Server Action) ──┼──────────────────────────▶│
  │                                │                 auth.getUser()
  │                                │               insert DB row
  │◀── ActionResult ───────────────┼───────────────────────────┤
```

`owner_id` in the DB insert comes from `auth.getUser()` server-side. Never from the client-supplied `userId` prop.

### Delete Flow (Storage-First Ordering)

```
1. If storage_path is non-null:
   a. Delete storage object via server Supabase client
   b. If storage delete fails → return error, DO NOT touch DB row
2. Delete DB row
3. revalidatePath
```

Rationale: Storage-first ordering prevents invisible orphaned files. If the DB row survives a failed storage delete, the user can retry. If the DB row is deleted first and storage fails, the orphan is invisible and unrecoverable through the UI.

---

## `@studioos/shared` — Public API

### Types

| Type | Status |
|------|--------|
| `User` | Active |
| `UserProfile` | Active — note: `user_id` field does not match DB schema (carry-forward) |
| `Project` | Active |
| `ProjectFormat` | Active |
| `ProjectStatus` | Active |
| `ProjectCore` | Active |
| `Genre` | Active |
| `Tone` | Active |
| `Block` | Active |
| `BlockType` | Active |
| `BlockStatus` | Active |
| `CreativeCompass` | Active |
| `CompassSection` | Active |
| `Asset` | Active — updated Sprint 4 |
| `AssetType` | Active |
| `AssetSource` | Active |
| `AssetSourceType` | Defined, not yet re-exported (carry-forward) |
| `KnowledgeEntry` | Active |
| `KnowledgeType` | Active |
| `Conversation` | Active |
| `Message` | Active |
| `MessageRole` | Active |

### Utils
`formatDate`, `formatRelativeDate`, `generateId`, `isValidId`, `slugify`, `truncate`, `capitalize`

### Constants
`PROJECT_FORMATS`, `PROJECT_STATUSES`

---

## Workspace Panel Architecture

The workspace uses Next.js App Router sub-routes for panel navigation.

```
/workspace/[projectId]/         → redirect to /core
/workspace/[projectId]/core     → Core panel (stub)
/workspace/[projectId]/compass  → Compass panel (stub)
/workspace/[projectId]/map      → Map panel (stub)
/workspace/[projectId]/assets   → Asset Library (implemented)
```

`WorkspaceSidebar` uses `useSelectedLayoutSegment()` to determine the active panel. This is a Client Component. The sidebar renders links; active state is computed from the current URL segment.

The workspace layout validates project ownership via `getProject(projectId)`. If the project does not exist or does not belong to the authenticated user, it redirects to `/dashboard`.

---

## Component Directory Conventions

| Location | Contents |
|----------|---------|
| `apps/web/components/ui/` | Raw shadcn/ui components — do not modify |
| `apps/web/components/nav/` | TopNav, UserMenu |
| `apps/web/components/dashboard/` | ProjectGrid, ProjectCard, CreateProjectDialog |
| `apps/web/components/workspace/` | WorkspaceHeader, WorkspaceSidebar, panel shells |
| `apps/web/components/assets/` | Asset Library components |
| `packages/ui/` | StudioOS composite components (not yet used) |

---

## Unimplemented Packages (Stubs)

These packages exist as stubs and will be implemented in future sprints:

| Package | Planned Purpose |
|---------|----------------|
| `@studioos/ai-service` | OpenAI / Anthropic / Gemini routing, prompt construction |
| `@studioos/context-engine` | Assembles project context for AI calls (project core, assets, compass) |
| `@studioos/dependency-engine` | Tracks dependencies between scenes, blocks, assets |
| `@studioos/assembly-engine` | Assembles final outputs from blocks |
| `packages/ui` | StudioOS composite components beyond shadcn primitives |

No code in `apps/web` may call AI providers directly. All AI calls must route through `@studioos/ai-service` when that package is implemented.

---

## Known Technical Debt

| Item | Location | Priority |
|------|---------|---------|
| `UserProfile.user_id` does not match DB schema (`id`) | `packages/shared/src/types/user.ts` | Medium |
| `AssetSourceType` not re-exported from `@studioos/shared` | `packages/shared/src/types/index.ts` | Low |
| `storage_path`/`external_url` exclusivity not enforced at DB level | `004_assets.sql` | Low |
| `createSignedUrl` N+1 in `getAssets` | `app/actions/assets.ts` | Low |
| Orphaned storage files on `uploadAsset` DB failure | `components/assets/upload-dialog.tsx` | Medium |
| `external_url` not rendered as clickable link in AssetCard | `components/assets/asset-card.tsx` | Low |
| `updated_at` auto-update triggers missing on all tables | All migrations | Medium |
| `h-[calc(100vh-3.5rem)]` not replaced with layout token | `workspace/[projectId]/layout.tsx` | Low |
| `generateMetadata` missing from panel pages | All panel pages | Low |
