# StudioOS — Current State

**Last Updated:** 2026-06-02
**Active Branch:** `develop`
**Latest Merge Commit:** `04da94d`

---

## Repository State

| Branch | Status | Description |
|--------|--------|-------------|
| `main` | Stable | Repository bootstrap — commit `88d46a9` |
| `develop` | Active | Sprint 1 complete — auth merged |
| `feature/sprint-1-shared` | Merged | `@studioos/shared` package |
| `feature/sprint-1-auth` | Merged | Authentication layer |

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
- `@supabase/ssr` installed and configured
- `lib/supabase/client.ts` — browser client
- `lib/supabase/server.ts` — server client
- `lib/supabase/middleware.ts` — session refresh helper
- `middleware.ts` — route protection (`/dashboard`, `/workspace`)
- `app/(auth)/layout.tsx` — centered auth shell
- `app/(auth)/sign-in/page.tsx` + `SignInForm`
- `app/(auth)/sign-up/page.tsx` + `SignUpForm`
- `app/auth/callback/route.ts` — PKCE code exchange
- `database/migrations/001_users.sql` — `user_profiles` table, RLS, auto-create trigger
- shadcn `input` and `label` components installed

**Review result:** APPROVED FOR MERGE WITH FOLLOW-UP TASKS

---

## Follow-Up Tasks

Tasks identified during Sprint 1 Authentication review. Must be resolved
during or before the sprint that introduces user-facing navigation.

### HIGH — Resolve in Sprint 2 Dashboard (first task)
- [ ] Implement `signOut` Server Action (`app/actions/auth.ts`)
- [ ] Wire logout into dashboard user menu

### LOW — Resolve at convenience
- [ ] Validate `next` parameter in `app/auth/callback/route.ts` as a relative path
- [ ] Refactor `app/auth/callback/route.ts` to import `createClient` from `lib/supabase/server.ts`
- [ ] Add `DROP POLICY IF EXISTS` / `DROP TRIGGER IF EXISTS` idempotency guards to `database/migrations/001_users.sql`
- [ ] Add `updated_at` auto-update trigger for `user_profiles` via a future migration

---

## Database Migrations

| File | Status | Description |
|------|--------|-------------|
| `database/migrations/001_users.sql` | Applied | `user_profiles` table, RLS, auto-create trigger |
| `database/migrations/002_projects.sql` | Planned | `projects` table — Sprint 2 |
| `database/migrations/003_project_core.sql` | Planned | `project_core` table — Sprint 3 |
| `database/migrations/004_assets.sql` | Planned | `assets` table — Sprint 4 |

---

## Next Sprint

**Sprint 2 — Dashboard**
Branch: `feature/sprint-1-dashboard` (to be created from `develop`)

See planning report for full scope.
