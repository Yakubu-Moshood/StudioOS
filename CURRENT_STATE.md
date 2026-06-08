# StudioOS — Current State

**Last Updated:** 2026-06-08
**Active Branch:** `feature/sprint-14-project-management`
**Latest Commit:** `9ff76ea` (feat — Sprint 14 Project Management)

---

## Repository State

| Branch | Status | Description |
|--------|--------|-------------|
| `main` | Stable | Repository bootstrap — commit `88d46a9` |
| `develop` | Active | Sprint 13 Knowledge Base Panel merged — `85e7d8b` |
| `feature/sprint-1-shared` | Merged | `@studioos/shared` package |
| `feature/sprint-1-auth` | Merged | Authentication layer |
| `feature/sprint-1-dashboard` | Merged | Dashboard layer |
| `feature/sprint-1-workspace` | Merged | Workspace layer |
| `feature/sprint-1-assets` | Merged | Asset Library — complete |
| `feature/sprint-5-compass` | Merged | Creative Compass — complete |
| `feature/sprint-10-core` | Merged | Core Panel — complete |
| `feature/sprint-11-map` | Merged | Production Map Panel — complete |
| `feature/sprint-12-ai-chat` | Merged | AI Chat Panel — complete |
| `feature/sprint-13-knowledge` | Merged | Knowledge Base Panel — complete |
| `feature/sprint-14-project-management` | Pending merge | Project Management — complete |

---

## Sprint History

### Sprint 14 — Project Management — `9ff76ea`
Full project lifecycle management. Archive, restore, rename, and delete projects from the dashboard. Archived projects remain fully accessible in the workspace with a restoration banner. Bundles three carry-forward cleanup items from Asset Library review (AssetSourceType export, external_url link rendering, bulk signed URLs). `010_project_archiving.sql` and `011_updated_at_triggers.sql` applied to Supabase 2026-06-08.

**Deliverables:**
- `database/migrations/010_project_archiving.sql` — `ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL`; idempotent; no index (per CTO decision); no RLS changes required
- `database/migrations/011_updated_at_triggers.sql` — `CREATE OR REPLACE FUNCTION public.set_updated_at()` RETURNS trigger LANGUAGE plpgsql; SECURITY INVOKER (default — no elevated permissions); `DROP TRIGGER IF EXISTS / CREATE TRIGGER` pattern applied to `user_profiles`, `projects`, `project_core`, `assets`, `knowledge_entries`; BEFORE UPDATE FOR EACH ROW
- `packages/shared/src/types/project.ts` — `archived_at: string | null` added to `Project` interface
- `packages/shared/src/types/index.ts` + `packages/shared/src/index.ts` — `AssetSourceType` added to barrel exports (carry-forward from Sprint 4)
- `apps/web/app/actions/projects.ts` — `ProjectFilter` type (`'all' | 'active' | 'archived'`); `getProjects` updated with filter param (default `'active'`); `renameProject` (auth + `.update({title}).eq('id').eq('owner_id')` + dual revalidatePath); `archiveProject` (dual-writes `archived_at` + `status: 'archived'`); `restoreProject` (clears `archived_at`, sets `status: 'active'`); `deleteProject` (fetch-then-delete ownership pattern — non-owner gets same "not found" response as missing project, no enumeration; `revalidatePath('/dashboard')`)
- `apps/web/app/(app)/dashboard/page.tsx` — `searchParams: Promise<{filter?}>` awaited; `ProjectFilterValue` coercion guard; `ProjectFilter` tab bar rendered; `CreateProjectButton` unconditional (no longer hidden when project count > 0)
- `apps/web/components/dashboard/project-filter.tsx` — NEW; Link-based Active/Archived/All tab bar; `'active'` default links to `/dashboard` (no query param); `ProjectFilterValue` exported as single source of truth
- `apps/web/components/dashboard/project-grid.tsx` — `filter: ProjectFilterValue` prop; per-filter empty states (`active`: show Create; `archived`/`all`: no Create prompt)
- `apps/web/components/dashboard/project-card.tsx` — converted to `'use client'`; `useState(false)` for `deleteOpen`; stretched-link pattern (`before:absolute before:inset-0 before:content-['']` on title link; `relative` Card; `relative z-10` actions div) — avoids invalid `<button>` inside `<a>`; `Archived` badge when `archived_at !== null`; `ProjectActionsMenu` receives `onDeleteSelect`; `DeleteProjectDialog` mounted at root level
- `apps/web/components/dashboard/project-actions-menu.tsx` — NEW `'use client'`; MoreHorizontal trigger (h-7 w-7 ghost); Rename → `setRenameOpen(true)`; Archive|Restore toggle driven by `isArchived`; `DropdownMenuSeparator`; Delete → `onDeleteSelect` prop call (text-destructive); `RenameProjectDialog` mounted here
- `apps/web/components/dashboard/rename-project-dialog.tsx` — NEW `'use client'`; `useEffect(() => { if (open) setTitle(project.title) }, [open, project.title])` ensures dialog pre-fills current title after server re-render; Save disabled when `!title.trim() || title.trim() === project.title || isPending`; close blocked during pending
- `apps/web/components/dashboard/delete-project-dialog.tsx` — NEW `'use client'`; typed title confirmation (exact match `=== project.title`, no trim — user must type exactly); Destructive button disabled until match; `useTransition + useRouter`; `router.refresh()` on success; confirmation reset on close; close blocked during pending
- `apps/web/components/workspace/archived-project-banner.tsx` — NEW `'use client'`; amber strip (`border-amber-200 bg-amber-50`); Archive icon + "This project is archived."; Restore Project button (`border-amber-300 hover:bg-amber-100`); `useTransition + router.refresh()` after `restoreProject` success
- `apps/web/app/(app)/workspace/[projectId]/layout.tsx` — `ArchivedProjectBanner` imported; rendered between `WorkspaceHeader` and flex-1 content div when `project.archived_at !== null`; archived projects remain fully accessible — no redirect
- `apps/web/components/assets/asset-card.tsx` — `ExternalLink` added to lucide-react imports; `asset.external_url` rendered as `<a href target="_blank" rel="noopener noreferrer">` with icon and `truncate hover:underline` (carry-forward from Sprint 4)
- `apps/web/app/actions/assets.ts` — `Promise.all(N × createSignedUrl)` replaced with single `createSignedUrls(uploadedPaths, 3600)` bulk call; results keyed by `path` into `Map<string, string>` (response order not guaranteed); mixed `uploaded`/`external` asset lists handled correctly (carry-forward from Sprint 4)

### Sprint 13 — Knowledge Base Panel — `8326e29`
Sixth and final workspace panel. Per-project knowledge base for research notes, URL references, and working documents. All entries assembled into AI context under `full_context` mode, completing data domain coverage across core, compass, production map, assets, and knowledge. `009_knowledge.sql` applied to Supabase 2026-06-07.

**Deliverables:**
- `database/migrations/009_knowledge.sql` — `knowledge_entries` table (10 columns); Pattern B RLS (`project_id → projects.owner_id`) consistent with all workspace-content tables; `user_id` stored as attribution field (set from `auth.getUser()` on insert, not the RLS gate); `source_title text` nullable (Amendment A); `knowledge_entries_project_id_idx`; `type` CHECK constraint (`text | document | url | other`, default `text`)
- `apps/web/app/actions/knowledge.ts` — `getKnowledgeEntries`, `addKnowledgeEntry`, `updateKnowledgeEntry`, `deleteKnowledgeEntry`; 100-entry limit enforced in `addKnowledgeEntry`; `user_id` always sourced from `auth.getUser()` server-side; `source_url`/`source_title` normalized (`.trim() || null` on add and update); `updated_at` set manually on update; double-filter (`.eq('id').eq('project_id')`) on update/delete as defensive hardening
- `packages/shared/src/types/knowledge.ts` — `source_title: string | null` added to `KnowledgeEntry` (required by Amendment A; type must match DB schema)
- `packages/context-engine/src/types.ts` — `KnowledgeContext` interface (`id`, `title`, `content`, `type`, `source_url`, `source_title`); `knowledge: KnowledgeContext[]` added to `ProjectContext`
- `packages/context-engine/src/assemble.ts` — `knowledge_entries` query added to `Promise.all` (selects 6 columns, orders by `created_at ASC`); `rawKnowledge` cast; `knowledgeContexts` mapping (all field names match DB columns — no remapping needed); `knowledge: knowledgeContexts` in return value
- `packages/context-engine/src/serialize.ts` — `buildKnowledgeBlock` (format: `- [type] title — "source_title" (source_url)` with indented content snippet ≤300 chars); trim priority updated (Amendment B): assets → knowledge → compass → blocks → core (blocks now most protected after core; compass trimmed before blocks); `knowledgeBlock` inserted between `blocksBlock` and `assetsBlock` in `parts[]` (prompt order: core → compass → production map → knowledge base → assets); `total()` includes `estimateTokens(knowledgeBlock)`
- `packages/assembly-engine/src/build.ts` — `filterContextByMode` updated: `compass_only`, `core_only`, `bare` all include `knowledge: []`; `full_context` passes knowledge through unchanged; `knowledgeCharCount` computed; `knowledge` segment added to `segments[]` between `blocks` and `assets`
- `apps/web/components/workspace/workspace-sidebar.tsx` — `BookOpen` added to lucide-react imports; `{ segment: 'knowledge', label: 'Knowledge', icon: BookOpen }` added as 6th nav item
- `apps/web/app/(app)/workspace/[projectId]/knowledge/page.tsx` — dynamic `generateMetadata`; async `KnowledgePage` awaiting `params`; renders `KnowledgePanel`
- `apps/web/components/workspace/panels/knowledge-panel.tsx` — panel wrapper; renders `KnowledgeView`
- `apps/web/components/knowledge/knowledge-view.tsx` — async Server Component; fetches `getKnowledgeEntries`; header (title + description) + `AddKnowledgeButton`; conditionally renders `KnowledgeEmptyState` or `KnowledgeList`
- `apps/web/components/knowledge/knowledge-list.tsx` — no directive; maps `KnowledgeEntry[]` to `KnowledgeCard`
- `apps/web/components/knowledge/knowledge-card.tsx` — `'use client'`; inline edit (5 fields: type, title, source title, source URL, content); native `<select>` for type (consistent with `SectionCard` pattern); source row shows `ExternalLink` icon + `<a>` link when `source_url` present (link text = `source_title || source_url`); plain `<span>` when only `source_title`; `line-clamp-3` content preview in display mode; edit/delete buttons on hover (`opacity-0 group-hover:opacity-100`); single `useTransition` for both save and delete; edit state resets from current `entry` prop on `handleEdit()`
- `apps/web/components/knowledge/add-knowledge-button.tsx` — `'use client'`; `useState(open)` → `AddKnowledgeDialog`
- `apps/web/components/knowledge/add-knowledge-dialog.tsx` — `'use client'`; 5 fields (type, title, source title, source URL, content); all optional except title; source URL visible for all types (Amendment D7); `onOpenChange` guarded by `isPending`; `reset()` on close
- `apps/web/components/knowledge/knowledge-empty-state.tsx` — no directive; `BookOpen` icon; dashed border; "No knowledge entries yet" prompt

### Sprint 12 — AI Chat Panel — `a11a86b`
In-project AI assistant panel. Users send messages and receive AI responses grounded in the complete project context (core, compass, production map, assets). Conversations persisted to the database. `008_conversations.sql` applied to Supabase 2026-06-07.

**Deliverables:**
- `database/migrations/008_conversations.sql` — `conversations` table (`UNIQUE(project_id)` — one per project, concurrent-creation race guarded at DB level); `messages` table (`project_id` denormalized for single-hop RLS); RLS Pattern B on both tables
- `apps/web/app/actions/chat.ts` — `getOrCreateConversation` (lifecycle contract: sole entry point for all conversation access; handles 23505 race via re-SELECT) and `sendMessage` (takes `{ projectId, content }` only — no `conversationId` from client; AI-first atomicity: no DB writes on AI failure; orphan cleanup on assistant INSERT failure; calls `getOrCreateConversation` internally)
- `packages/context-engine/src/types.ts` — `BlockContext` interface; `blocks: BlockContext[]` added to `ProjectContext`
- `packages/context-engine/src/assemble.ts` — `blocks` query added to `Promise.all`; `sort_order → order` mapping consistent with Sprint 11 `rowToBlock` pattern
- `packages/context-engine/src/serialize.ts` — `buildBlocksBlock`; trim priority at Sprint 12: assets → blocks → compass → core (superseded by Sprint 13 Amendment B)
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

### Sprint 1 — Bootstrap → Auth → Dashboard → Workspace
*(Sprints 1–3 history preserved — see git log for full detail)*

---

## Follow-Up Tasks

### Carry Forward from Asset Library Review
- [x] Export `AssetSourceType` from `@studioos/shared` public API — resolved Sprint 14
- [x] Render `external_url` as a clickable link in `AssetCard` — resolved Sprint 14
- [x] Replace `createSignedUrl` loop with bulk `createSignedUrls` call in `getAssets` — resolved Sprint 14
- [ ] Storage cleanup on `uploadAsset` DB failure (prevent orphaned storage files)
- [ ] Add DB-level `source_type` exclusivity CHECK constraint to `assets` table

### Carry Forward from Workspace Review
- [x] Handle "no `project_core` row" state — resolved Sprint 10 via upsert
- [x] Add `generateMetadata` to Core panel page — resolved Sprint 10
- [ ] Replace `h-[calc(100vh-3.5rem)]` with a layout token when nav height stabilizes

### Future
- [x] Add `updated_at` auto-update triggers for `user_profiles`, `projects`, `project_core`, `assets`, `knowledge_entries` — resolved Sprint 14 (`011_updated_at_triggers.sql`)
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
| `database/migrations/009_knowledge.sql` | Applied 2026-06-07 | `knowledge_entries` table, Pattern B RLS, `source_title`/`source_url`, attribution `user_id` |
| `database/migrations/010_project_archiving.sql` | Applied 2026-06-08 | `projects.archived_at timestamptz DEFAULT NULL` |
| `database/migrations/011_updated_at_triggers.sql` | Applied 2026-06-08 | `set_updated_at()` BEFORE UPDATE trigger on 5 tables |

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

Sprint 14 Project Management complete and fully deployed. Merged to `develop`, pushed to `origin/develop` (merge commit `0c42a2a`). Migrations `010_project_archiving.sql` and `011_updated_at_triggers.sql` applied to Supabase 2026-06-08. Typecheck PASS, lint PASS (7/7).

Sprint 15 Architecture Review completed 2026-06-08. Export Layer selected as recommended Sprint 15 scope. Sprint 15 Handoff Summary created 2026-06-08. Sprint 15 implementation not yet approved — awaiting CTO authorization.

## Next Sprint

**Sprint 15 — Export Layer**

Architecture review completed 2026-06-08. Handoff Summary created 2026-06-08. Implementation not yet approved.

**Recommended scope:** Markdown Project Bible export only. PDF and DOCX deferred to Sprint 16.

**Key decisions from architecture review:**
- Delivery via Next.js Route Handler (`app/api/export/[projectId]/route.ts`) — Server Actions cannot return file responses
- New `export_bible` value added to `AssemblyMode` in `packages/assembly-engine`
- Existing Context Engine and Assembly Engine used without modification
- No new database tables in Sprint 15
- Streaming deferred — blocking loading state acceptable for MVP

**Decisions pending CTO input before implementation:**
- `maxTokens` ceiling for export generation (recommended 4,000–6,000)
- Export button placement (workspace header vs dedicated `/export` panel)
- Assembly mode approach (`export_bible` mode vs `full_context` with custom system prompt)

**Candidates reviewed and deferred:**
- AI Memory — explicit user-created memory viable; AI-inferred memory (embeddings/pgvector) deferred
- Publishing Layer — prerequisite on Export Layer; deferred to Sprint 16+
