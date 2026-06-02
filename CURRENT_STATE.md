# StudioOS — Current State

**Last Updated:** 2026-06-02
**Active Branch:** `feature/sprint-1-workspace`
**Latest Merge Commit:** `ccf4924`

---

## Repository State

| Branch | Status | Description |
|--------|--------|-------------|
| `main` | Stable | Repository bootstrap — commit `88d46a9` |
| `develop` | Active | Sprint 1 Dashboard merged — `ccf4924` |
| `feature/sprint-1-shared` | Merged | `@studioos/shared` package |
| `feature/sprint-1-auth` | Merged | Authentication layer |
| `feature/sprint-1-dashboard` | Merged | Dashboard layer |
| `feature/sprint-1-workspace` | Active | Sprint 3 Workspace — in progress |

---

## Sprint History

### Bootstrap — `main` @ `88d46a9`
Monorepo foundation. pnpm workspaces, Turborepo, Next.js 15, Tailwind CSS v4,
shadcn/ui, ESLint v9, TypeScript strict mode, six `@studioos/*` package stubs.

### Sprint 1 — Shared Package — `ce05abc`
`@studioos/shared` fully implemented.

**Deliverables:**
- Types: `User`, `UserProfile`, `Project`, `ProjectCore`, `Block`, `CreativeCompass`, `Asset`, `KnowledgeEntry`, `Conversation`, `Message`
- Utils: `formatDate`, `formatRelativeDate`, `generateId`, `isValidId`, `slugify`, `truncate`, `capitalize`
- Constants: `PROJECT_FORMATS`, `PROJECT_STATUSES`

### Sprint 1 — Authentication — `dcbb7c4`
Authentication layer fully implemented and merged.

**Deliverables:**
- Supabase SSR three-client setup (browser, server, middleware)
- `middleware.ts` — route protection for `/dashboard`, `/workspace`
- `app/(auth)/` — sign-in, sign-up pages and centered layout
- `app/auth/callback/route.ts` — PKCE code exchange
- `database/migrations/001_users.sql` — `user_profiles` table, RLS, auto-create trigger
- shadcn `input`, `label` components

### Sprint 1 — Dashboard — `123182e`
Dashboard layer fully implemented and merged. All Sprint 1 auth follow-up items resolved.

**Deliverables:**
- `app/(app)/layout.tsx` — authenticated shell with TopNav
- `app/(app)/dashboard/page.tsx` + `loading.tsx` — project grid
- `app/actions/auth.ts` — `signOut` Server Action
- `app/actions/projects.ts` — `getProjects`, `createProject` Server Actions
- `components/nav/top-nav.tsx`, `user-menu.tsx` — navigation
- `components/dashboard/project-grid.tsx`, `project-card.tsx` — project display
- `components/dashboard/create-project-button.tsx`, `create-project-dialog.tsx` — project creation
- `database/migrations/002_projects.sql` — `projects` table, `owner_id` FK, index, RLS
- shadcn: card, dropdown-menu, avatar, select, badge, skeleton, sonner, dialog, separator
- Auth follow-ups resolved: `signOut`, `next` param validation, callback refactor, migration idempotency guards
- `packages/shared/src/types/project.ts` — `user_id` → `owner_id`

---

## Follow-Up Tasks

### Sprint 3 — Resolve during or after Workspace implementation
- [ ] Implement `/workspace/[projectId]` route — project cards currently 404
- [ ] Add `updated_at` auto-update triggers for `user_profiles` and `projects` tables
- [ ] Mount `ThemeProvider` when dark mode enters scope

### Future
- [ ] `UserProfile` type has `user_id` field that does not match the DB schema (`user_profiles.id` IS the user ID — no separate `user_id` column exists). Reconcile type with schema.
- [ ] `Asset.user_id` naming inconsistency with `Project.owner_id` — align before Sprint 4 assets migration.

---

## Database Migrations

| File | Status | Description |
|------|--------|-------------|
| `database/migrations/001_users.sql` | Applied | `user_profiles` table, RLS, auto-create trigger, idempotency guards |
| `database/migrations/002_projects.sql` | Applied | `projects` table, `owner_id` FK+index, RLS |
| `database/migrations/003_project_core.sql` | Planned | `project_core` table — Sprint 3 |
| `database/migrations/004_assets.sql` | Planned | `assets` table — Sprint 4 |

---

## Next Sprint

**Sprint 3 — Workspace**
Branch: `feature/sprint-1-workspace` (active)

See Sprint 3 Workspace Architecture Review for full scope.
