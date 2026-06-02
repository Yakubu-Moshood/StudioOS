# StudioOS — Current State

**Last Updated:** 2026-06-02
**Active Branch:** `develop`
**Latest Commit:** `47f52ba`

---

## Repository State

| Branch | Status | Description |
|--------|--------|-------------|
| `main` | Stable | Repository bootstrap — commit `88d46a9` |
| `develop` | Active | Sprint 7 Dependency Engine committed — `47f52ba` |
| `feature/sprint-1-shared` | Merged | `@studioos/shared` package |
| `feature/sprint-1-auth` | Merged | Authentication layer |
| `feature/sprint-1-dashboard` | Merged | Dashboard layer |
| `feature/sprint-1-workspace` | Merged | Workspace layer |
| `feature/sprint-1-assets` | Merged | Asset Library — complete |
| `feature/sprint-5-compass` | Merged | Creative Compass — complete |

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

### Sprint 7 — Dependency Engine — `47f52ba`
Dependency Engine fully implemented. Artifact relationship tracking layer.

**Deliverables:**
- `packages/dependency-engine/` package — `addDependency`, `removeDependency`, `getDependencies`, `getDependencyGraph`
- `ArtifactType`, `DependencyType`, `ArtifactRef`, `Dependency`, `DependencyGraph` types — local to dependency-engine
- Dependency injection — `SupabaseClient` passed by caller; no internal instantiation
- `addDependency` validates source and target existence before insert; conflict-fetch on 23505
- Uniqueness on `(project_id, source_type, source_id, target_type, target_id, dependency_type)` — same two artifacts may have multiple relationship types
- `getDependencyGraph` — Option B adjacency map `{ [artifactId]: { dependsOn, dependedOnBy } }`, `MAX_GRAPH_DEPTH = 10`
- `database/migrations/006_artifact_dependencies.sql` — table, 6-field unique index, two lookup indexes, RLS Pattern B, `delete_artifact_dependencies()` trigger function, `BEFORE DELETE` triggers on `assets`, `compass_sections`, `project_core`
- `apps/web/app/actions/dependencies.ts` — four Server Action wrappers
- No UI, no ai-service changes, no `@studioos/shared` changes

### Sprint 6 — Context Engine — `4e4745e`
Context Engine fully implemented. Headless AI context assembly layer.

**Deliverables:**
- `packages/context-engine/` package — `assembleContext`, `serializeContext`, `getContextSummary`
- `ProjectContext`, `AssembledPromptContext`, `ContextSummary` types — local to context-engine, not in `@studioos/shared`
- Dependency injection — `SupabaseClient` passed by caller; no internal instantiation
- 8,000 token soft limit with priority trimming: Core never trimmed → Compass trimmed second → Assets trimmed first
- Asset inclusion limited to `image` and `document` types at DB query level
- `ContextSummary` fields: `contextWordCount`, `compassSectionCount`, `assetCount`, `estimatedTokens`
- Token estimation: `Math.ceil(text.length / 4)` — approximation, no tokenizer dependency
- `apps/web/app/actions/context.ts` — `getProjectContextSummary` Server Action wrapper
- No database migrations, no UI, no ai-service changes

### Sprint 5 — Creative Compass — `1ae5ad8` (merged `fa130e3`)
Creative Compass fully implemented.

**Deliverables:**
- `CompassSection` and `SectionType` types added to `@studioos/shared`
- `database/migrations/005_compass_sections.sql` — `compass_sections` table, `sort_order`, `section_type`, `UNIQUE(project_id, sort_order)`, EXISTS RLS
- `app/actions/compass.ts` — `getSections`, `addSection`, `updateSection`, `deleteSection`, `reorderSection` Server Actions
- 50-section limit enforced in `addSection`
- Three-step sort_order swap in `reorderSection` — satisfies UNIQUE constraint without deferred transactions
- `components/compass/` — `CompassView` (Server Component), `SectionList`, `SectionCard` (inline edit + reorder), `AddSectionButton`, `AddSectionDialog`, `CompassEmptyState`
- `/workspace/[projectId]/compass` — full implementation replacing placeholder shell

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
| `database/migrations/005_compass_sections.sql` | Applied | `compass_sections`, sort_order, UNIQUE(project_id, sort_order), EXISTS RLS |
| `database/migrations/006_artifact_dependencies.sql` | Applied | `artifact_dependencies`, 6-field unique index, trigger-based orphan cleanup, EXISTS RLS |

---

## Storage

| Bucket | Access | Status | Description |
|--------|--------|--------|-------------|
| `assets` | Private | Active | File uploads — path `{owner_id}/{project_id}/{asset_id}/{filename}` |

---

## Governance Documents

| Document | Purpose |
|----------|---------|
| [docs/README.md](docs/README.md) | Documentation index and reading order |
| [docs/STUDIOOS_CTO_DIRECTIVE.md](docs/STUDIOOS_CTO_DIRECTIVE.md) | Non-negotiable engineering standards |
| [docs/STUDIOOS_DEVELOPMENT_PROTOCOL.md](docs/STUDIOOS_DEVELOPMENT_PROTOCOL.md) | Sprint lifecycle — 10-phase process |
| [docs/STUDIOOS_MASTER_ARCHITECTURE.md](docs/STUDIOOS_MASTER_ARCHITECTURE.md) | System architecture snapshot (post-Sprint 4) |
| [docs/STUDIOOS_SPRINT_TEMPLATE.md](docs/STUDIOOS_SPRINT_TEMPLATE.md) | Reusable templates for reviews, reports, commits |

---

## Development Status

Sprint 7 Dependency Engine complete. Implementation committed to `develop`. Assembly Engine architecture review in progress.

## Next Sprint

**Sprint 8 — Assembly Engine**
Branch: TBD (pending architecture review approval)

AI prompt assembly layer — composes final prompts from assembled context and user input, routes them through `@studioos/ai-service`, and returns structured AI responses. Architecture review in progress.
