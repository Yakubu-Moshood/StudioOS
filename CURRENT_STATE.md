# StudioOS — Current State

**Last Updated:** 2026-06-02
**Active Branch:** `develop`
**Latest Merge Commit:** `b09ad0e`

---

## Repository State

| Branch | Status | Description |
|--------|--------|-------------|
| `main` | Stable | Repository bootstrap — commit `88d46a9` |
| `develop` | Active | Sprint 4 Asset Library merged — `b09ad0e` |
| `feature/sprint-1-shared` | Merged | `@studioos/shared` package |
| `feature/sprint-1-auth` | Merged | Authentication layer |
| `feature/sprint-1-dashboard` | Merged | Dashboard layer |
| `feature/sprint-1-workspace` | Merged | Workspace layer |
| `feature/sprint-1-assets` | Merged | Asset Library — complete |

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
Authentication layer fully implemented.

**Deliverables:**
- Supabase SSR three-client setup (browser, server, middleware)
- `middleware.ts` — route protection for `/dashboard`, `/workspace`
- `app/(auth)/` — sign-in, sign-up pages and centered layout
- `app/auth/callback/route.ts` — PKCE code exchange with validated `next` param
- `database/migrations/001_users.sql` — `user_profiles` table, RLS, auto-create trigger

### Sprint 1 — Dashboard — `123182e`
Dashboard layer fully implemented. All Sprint 1 auth follow-up items resolved.

**Deliverables:**
- `app/(app)/layout.tsx` — authenticated shell with TopNav, UserMenu, sign-out
- `app/(app)/dashboard/` — project grid, create-project dialog, loading skeleton
- `app/actions/auth.ts`, `app/actions/projects.ts` — Server Actions
- `database/migrations/002_projects.sql` — `projects` table, `owner_id` FK+index, RLS

### Sprint 3 — Workspace — `5cc8e06`
Workspace shell fully implemented.

**Deliverables:**
- Sub-route panel architecture (`/core`, `/compass`, `/map`, `/assets`)
- `WorkspaceHeader` — back navigation, project title, format badge
- `WorkspaceSidebar` — `useSelectedLayoutSegment()` active state, four panel links
- `app/(app)/workspace/[projectId]/layout.tsx` — project ownership validation
- `app/(app)/workspace/[projectId]/page.tsx` — redirect to `/core`
- Four panel shell pages + components (Core, Compass, Map, Assets)
- `app/actions/projects.ts` — `getProject(id)` added
- `database/migrations/003_project_core.sql` — `project_core` table, unique index, RLS join-through

### Sprint 4 — Asset Library — `1c38950` (merged `b09ad0e`)
Asset Library fully implemented. Database bootstrap complete.

**Deliverables:**
- `Asset` type updated: `owner_id` (renamed from `user_id`), `source_type`, `storage_path`, `external_url` (replaced `url`)
- `AssetSourceType` union type added to `@studioos/shared`
- `database/migrations/004_assets.sql` — `assets` table, dual FK constraints, two indexes, RLS
- `database/storage/assets-bucket.md` — private bucket setup and Storage RLS documentation
- `app/actions/assets.ts` — `getAssets`, `uploadAsset`, `addReference`, `deleteAsset` Server Actions
- Storage-first delete ordering — prevents orphaned files, keeps deletion retryable
- Signed URLs generated server-side at read time (1-hour expiry)
- `components/assets/` — `AssetLibrary`, `AssetTypeFilter`, `AssetGrid`, `AssetCard`, `UploadButton`, `UploadDialog`, `AddReferenceButton`, `AddReferenceDialog`
- `/workspace/[projectId]/assets` — full implementation replacing placeholder shell
- shadcn `tabs` and `textarea` installed

---

## Follow-Up Tasks

### Carry Forward from Asset Library Review
- [ ] Export `AssetSourceType` from `@studioos/shared` public API (`types/index.ts` + `index.ts`)
- [ ] Render `external_url` as a clickable link in `AssetCard`
- [ ] Replace `createSignedUrl` loop with bulk `createSignedUrls` call in `getAssets`
- [ ] Storage cleanup on `uploadAsset` DB failure (prevent orphaned storage files)
- [ ] Add DB-level `source_type` exclusivity CHECK constraint to `assets` table

### Carry Forward from Workspace Review
- [ ] Handle "no `project_core` row" state when Core panel becomes functional (future Core sprint)
- [ ] Add `generateMetadata` to panel pages to include project title when content is added
- [ ] Replace `h-[calc(100vh-3.5rem)]` with a layout token when nav height stabilizes

### Future
- [ ] Add `updated_at` auto-update triggers for `user_profiles`, `projects`, `project_core`, `assets` tables
- [ ] Mount `ThemeProvider` when dark mode enters scope
- [ ] `UserProfile` type has `user_id` field that does not match DB schema — reconcile

---

## Database Migrations

| File | Status | Description |
|------|--------|-------------|
| `database/migrations/001_users.sql` | Applied | `user_profiles`, RLS, auto-create trigger |
| `database/migrations/002_projects.sql` | Applied | `projects`, `owner_id` FK+index, RLS |
| `database/migrations/003_project_core.sql` | Applied | `project_core`, unique index, EXISTS RLS |
| `database/migrations/004_assets.sql` | Applied | `assets`, dual FK+indexes, RLS |

---

## Storage

| Bucket | Access | Status | Description |
|--------|--------|--------|-------------|
| `assets` | Private | Active | File uploads — path `{owner_id}/{project_id}/{asset_id}/{filename}` |

---

## Development Status

Feature development paused. Governance documentation in progress.

## Next Sprint

**Sprint 5 — Creative Compass**
Branch: TBD (pending governance review)

Creative direction panel — vision, tone, and guiding principles for each project.
Panel shell exists at `/workspace/[projectId]/compass`. Full implementation deferred.
