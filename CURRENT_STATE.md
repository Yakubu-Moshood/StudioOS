# StudioOS — Current State

**Last Updated:** 2026-06-07
**Active Branch:** `feature/sprint-12-ai-chat`
**Latest Commit:** `a11a86b` (feat — Sprint 12 AI Chat Panel)

---

## Repository State

| Branch | Status | Description |
|--------|--------|-------------|
| `main` | Stable | Repository bootstrap — commit `88d46a9` |
| `develop` | Active | Sprint 11 Production Map Panel merged — `d08ee40` |
| `feature/sprint-1-shared` | Merged | `@studioos/shared` package |
| `feature/sprint-1-auth` | Merged | Authentication layer |
| `feature/sprint-1-dashboard` | Merged | Dashboard layer |
| `feature/sprint-1-workspace` | Merged | Workspace layer |
| `feature/sprint-1-assets` | Merged | Asset Library — complete |
| `feature/sprint-5-compass` | Merged | Creative Compass — complete |
| `feature/sprint-10-core` | Merged | Core Panel — complete |
| `feature/sprint-11-map` | Merged | Production Map Panel — complete |
| `feature/sprint-12-ai-chat` | Pending merge | AI Chat Panel — complete |

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

### Sprint 12 — AI Chat Panel — `a11a86b`
In-project AI assistant panel. Users send messages and receive AI responses grounded in the complete project context (core, compass, production map, assets). Conversations persisted to the database. `008_conversations.sql` applied to Supabase 2026-06-07.

**Deliverables:**
- `database/migrations/008_conversations.sql` — `conversations` table (`UNIQUE(project_id)` — one per project, concurrent-creation race guarded at DB level); `messages` table (`project_id` denormalized for single-hop RLS); RLS Pattern B on both tables
- `apps/web/app/actions/chat.ts` — `getOrCreateConversation` (lifecycle contract: sole entry point for all conversation access; handles 23505 race via re-SELECT) and `sendMessage` (takes `{ projectId, content }` only — no `conversationId` from client; AI-first atomicity: no DB writes on AI failure; orphan cleanup on assistant INSERT failure; calls `getOrCreateConversation` internally)
- `packages/context-engine/src/types.ts` — `BlockContext` interface; `blocks: BlockContext[]` added to `ProjectContext`
- `packages/context-engine/src/assemble.ts` — `blocks` query added to `Promise.all`; `sort_order → order` mapping consistent with Sprint 11 `rowToBlock` pattern
- `packages/context-engine/src/serialize.ts` — `buildBlocksBlock`; trim priority updated: assets → blocks → compass → core (core never trimmed)
- `packages/assembly-engine/src/build.ts` — `filterContextByMode` strips `blocks: []` from `compass_only`, `core_only`, `bare`; `blocks` segment added to `AssemblyRequest.segments[]`; `packages/assembly-engine/tsconfig.json` — `"types": ["node"]` added (resolved pre-existing masked typecheck error)
- `apps/web/components/chat/chat-view.tsx` — async Server Component; calls `getOrCreateConversation(projectId)`; passes `initialMessages` to `ChatInterface`
- `apps/web/components/chat/chat-interface.tsx` — Client Component; `useOptimistic` for immediate user message display; `useTransition` for `sendMessage`; `isPending` "Thinking…" pulse; Enter-to-send; 2,000 char limit with counter; auto-scroll to latest message
- `apps/web/components/chat/message-list.tsx` — maps `Message[]` → `MessageBubble`; shows `ChatEmptyState` when empty
- `apps/web/components/chat/message-bubble.tsx` — role-aware layout (user: right/primary; assistant: left/muted); `whitespace-pre-wrap`
- `apps/web/components/chat/chat-empty-state.tsx` — presentational
- `apps/web/components/workspace/panels/ai-panel.tsx` — panel wrapper
- `apps/web/app/(app)/workspace/[projectId]/ai/page.tsx` — dynamic `generateMetadata` with `getProject`; async `AiPage` awaiting `params`
- `apps/web/components/workspace/workspace-sidebar.tsx` — AI nav item (`Sparkles` icon, `segment: 'ai'`) — workspace now has 5 panel links
- `@studioos/shared` frozen — `Conversation`/`Message` types consumed as-is; no changes

### Sprint 11 — Production Map Panel — `616de9e`
Second functional workspace panel. Full CRUD block management with inline edit, reorder, and delete. `007_blocks.sql` applied to Supabase 2026-06-07.

**Deliverables:**
- `database/migrations/007_blocks.sql` — `blocks` table; `sort_order integer not null default 0` (no UNIQUE constraint); `parent_id uuid references public.blocks(id) on delete set null`; `type` and `status` CHECK constraints; `blocks_project_id_idx` and `blocks_parent_id_idx` indexes; RLS Pattern B (EXISTS through `projects.owner_id`)
- `apps/web/app/actions/blocks.ts` — `getBlocks`, `addBlock`, `updateBlock`, `deleteBlock`, `reorderBlock` Server Actions; `BlockRow` interface with `sort_order: number`; `rowToBlock` function maps `sort_order → Block.order` (single translation point); 200-block limit in `addBlock`; two direct UPDATEs in `reorderBlock` (no temp value — no UNIQUE constraint); `auth.getUser()` guard in all four write actions
- `apps/web/components/map/map-view.tsx` — async Server Component; fetches `getBlocks`; renders `AddBlockButton` in header always; shows `MapEmptyState` or `BlockList`
- `apps/web/components/map/block-list.tsx` — Server Component; maps `Block[]` to `BlockCard`; computes `isFirst`/`isLast` from index
- `apps/web/components/map/block-card.tsx` — Client Component; inline edit (type, title, content, status via shadcn Select); reorder up/down (ChevronUp/ChevronDown); delete; single `useTransition` shared across all interactions; edit state resets to current block values on open
- `apps/web/components/map/add-block-button.tsx` — Client Component; `useState(open)`; renders `AddBlockDialog`
- `apps/web/components/map/add-block-dialog.tsx` — Client Component; `<form onSubmit>` + `e.preventDefault()` pattern; shadcn Select for type (default: `scene`) and status (default: `draft`); `reset()` on close; `handleOpenChange` guards close during pending transition
- `apps/web/components/map/map-empty-state.tsx` — presentational; no directive
- `apps/web/components/workspace/panels/map-panel.tsx` — replaced stub; renders `<MapView projectId={projectId} />`
- `apps/web/app/(app)/workspace/[projectId]/map/page.tsx` — replaced stub; dynamic `generateMetadata` with `getProject`; async `MapPage` awaiting `params`
- `Block.order` frozen in `@studioos/shared` — no changes to shared package; `sort_order` lives only in DB schema and `BlockRow` persistence interface

### Sprint 10 — Core Panel — `9dd351f`
First functional workspace panel. `project_core` data entry with save and AI generation.

**Deliverables:**
- `apps/web/app/actions/core.ts` — `getProjectCore`, `saveProjectCore` Server Actions
- `saveProjectCore` — upsert on `project_id` (resolves carry-forward missing-row case); `auth.getUser()` guard; themes parsed server-side from comma-separated string to `string[]`; `revalidatePath` on success
- `apps/web/components/core/core-view.tsx` — async Server Component; fetches `getProjectCore`; renders `CoreForm` with initial data
- `apps/web/components/core/core-form.tsx` — Client Component; synopsis (Textarea), genre (Select), tone (Select), themes (Input, comma-separated); explicit Save button via `useTransition`; AI Generate section with user instruction Textarea and Generate button calling `executeProjectAssembly(core_only)`
- `apps/web/components/core/core-generate-panel.tsx` — presentational component; displays AI output with loading state; no `'use client'` directive
- `apps/web/components/workspace/panels/core-panel.tsx` — wired to `CoreView` with `projectId`
- `apps/web/app/(app)/workspace/[projectId]/core/page.tsx` — dynamic `generateMetadata` with project title (resolves carry-forward item)
- No new database migrations — `project_core` table from Sprint 3 consumed as-is
- No changes to engine packages or `@studioos/shared`

### Sprint 9 — AI Service — `eaf8ee3`
Real Anthropic provider integration. Replaces `generate()` stub with a layered provider architecture.

**Deliverables:**
- `packages/ai-service/src/types/generate-input.ts` — `GenerateInput`: `prompt`, `systemPrompt?`, `maxTokens?`
- `packages/ai-service/src/types/generate-output.ts` — `GenerateOutput`: `text`, `inputTokens?`, `outputTokens?`, `model`, `provider`
- `packages/ai-service/src/providers/ai-provider.ts` — `AIProvider` interface
- `packages/ai-service/src/providers/anthropic-provider.ts` — `AnthropicProvider` class; all SDK logic isolated; reads `ANTHROPIC_API_KEY` from `process.env`; default model `claude-haiku-4-5-20251001`
- `packages/ai-service/src/services/generate-text.ts` — `generate()` — delegates to `AnthropicProvider`; no direct SDK imports
- `packages/ai-service/src/index.ts` — public API exports only: `generate`, `GenerateInput`, `GenerateOutput`, `AIProvider`
- `@anthropic-ai/sdk@0.26.1` in `dependencies` (runtime); `@types/node` added to `devDependencies`
- No changes to assembly-engine, context-engine, dependency-engine, shared, apps/web, or database

### Sprint 8 — Assembly Engine — `ce638b7`
AI prompt assembly layer. Composes final prompts from assembled context and user input, routes through `@studioos/ai-service`, returns structured responses.

**Deliverables:**
- `packages/assembly-engine/` package — `buildRequest`, `executeAssembly`
- `AssemblyMode`, `AssemblyRequest` (with `promptVersion: 1`), `PromptSegment`, `TokenUsage`, `AssemblyResult`, `AssemblyOptions` types — local to assembly-engine
- Dependency injection — `SupabaseClient` passed by caller; no internal instantiation
- `filterContextByMode` — filters assembled `ProjectContext` by mode before serialization
- Four `AssemblyMode` values: `full_context`, `compass_only`, `core_only`, `bare`
- `userInstruction` capped at 2,000 characters
- Four `PromptSegment` entries per request: `core`, `compass`, `assets`, `user_instruction` — each with `segmentName`, `included`, `characterCount`
- `TokenUsage` — `estimatedPromptTokens`, `estimatedCompletionTokens`, `estimatedTotalTokens` — all derived from `Math.ceil(length / 4)`
- `packages/ai-service/src/index.ts` — `GenerateInput`, `GenerateOutput`, `generate()` stub (returns placeholder; wired to real provider in Sprint 9)
- `apps/web/app/actions/assembly.ts` — `buildAssemblyRequest`, `executeProjectAssembly` Server Actions
- No UI, no database migrations, no `@studioos/shared` changes, no Context Engine changes

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
- [x] Handle "no `project_core` row" state — resolved in Sprint 10 via upsert
- [x] Add `generateMetadata` to Core panel page — resolved in Sprint 10
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
| `database/migrations/007_blocks.sql` | Applied 2026-06-07 | `blocks` table, `project_id`/`parent_id` indexes, RLS Pattern B |
| `database/migrations/008_conversations.sql` | Applied 2026-06-07 | `conversations` (UNIQUE project_id) + `messages` tables, RLS Pattern B |

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

Sprint 12 AI Chat Panel complete on `feature/sprint-12-ai-chat` @ `a11a86b`. Database migrations `007_blocks.sql` and `008_conversations.sql` both applied to Supabase 2026-06-07. Lint PASS, typecheck PASS, build PASS. Pending merge to `develop`.

## Next Sprint

**Sprint 13 — TBD**
Sprint 12 merge to `develop` required before Sprint 13 planning begins.
