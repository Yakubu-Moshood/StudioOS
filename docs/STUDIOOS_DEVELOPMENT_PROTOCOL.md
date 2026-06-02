# StudioOS — Development Protocol

**Status:** Active
**Issued:** 2026-06-02
**Applies To:** All sprints on `feature/*` branches

---

## Purpose

This document defines the repeatable process every sprint follows from branch creation to merge. Following this protocol ensures consistent quality, predictable review cycles, and a clean git history.

---

## Sprint Lifecycle

Every sprint follows this exact sequence. No step may be skipped.

```
1. Architecture Review
2. Architecture Approval (with or without amendments)
3. Branch Creation
4. Implementation
5. Validation (lint → typecheck → build)
6. Review Report
7. Review Approval
8. Prerequisite Completion (if applicable)
9. Merge
10. CURRENT_STATE.md Update
```

---

## Phase 1 — Architecture Review

Before any code is written, an architecture review is produced for the sprint. The review covers:

- Data model decisions (new types, schema changes)
- Database migration requirements
- API / Server Action design
- Component breakdown (Server vs. Client)
- Security considerations
- RLS strategy
- Scope boundary confirmation

The architecture review is presented for approval. The response will either:
- **Approve** — proceed to implementation.
- **Approve with amendments** — implement with the stated amendments only. Amendments are binding.
- **Reject** — revise and re-present.

Do not begin implementation until approval is received.

---

## Phase 2 — Branch Creation

Create the feature branch from `develop`:

```bash
git checkout develop
git checkout -b feature/<sprint-name>
```

The branch name follows the pattern `feature/sprint-<N>-<scope>`, e.g.:
- `feature/sprint-1-shared`
- `feature/sprint-1-auth`
- `feature/sprint-1-assets`

---

## Phase 3 — Implementation

### Implementation order

For each sprint, implement in dependency order:

1. Shared type changes (`packages/shared/`) — must come first; other packages depend on them.
2. Database migration files (`database/migrations/`).
3. Storage setup documentation (`database/storage/`) if applicable.
4. Server Actions (`apps/web/app/actions/`).
5. Components (`apps/web/components/`), leaf components before composite components.
6. Page-level integration (`apps/web/app/`).

### Code standards during implementation

**No speculative code.** Implement exactly what the approved architecture specifies. Do not add features, error handlers, fallbacks, or abstractions not in scope.

**No comments describing what code does.** Identifiers are self-describing. Write comments only when the *why* is non-obvious: a hidden constraint, a workaround, a subtle invariant.

**Server Actions pattern:**

```typescript
'use server'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export async function doSomething(input: { ... }): Promise<ActionResult<SomeType>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated.' }
  }

  // mutation using user.id as owner_id — never input-supplied identity
  const { data, error } = await supabase.from('table').insert({ owner_id: user.id, ... })

  if (error) {
    return { success: false, error: 'Human-readable error message.' }
  }

  revalidatePath('/path/to/affected/route')
  return { success: true, data: data as SomeType }
}
```

**Client component mutation pattern:**

```typescript
'use client'

const [isPending, startTransition] = useTransition()

function handleAction() {
  startTransition(async () => {
    const result = await someServerAction(input)
    if (result.success) {
      toast.success('Success message.')
    } else {
      toast.error(result.error)
    }
  })
}
```

**`exactOptionalPropertyTypes` pattern:**

When a function parameter should accept `T | undefined`, declare it as `param: T | undefined` (explicit union), not `param?: T` (optional), to allow callers to explicitly pass `undefined`.

---

## Phase 4 — Validation

Run all three gates in order. Fix all failures before producing the Review Report.

```bash
pnpm lint       # Must exit 0, 0 errors
pnpm typecheck  # Must exit 0, 0 errors
pnpm build      # Must compile successfully
```

If a gate fails:
1. Read the error output.
2. Identify the root cause.
3. Fix the source — do not suppress or bypass.
4. Re-run the gate.
5. Document any non-obvious fixes in the Review Report.

---

## Phase 5 — Review Report

Produce a formal Review Report by reading every file changed in the sprint. The report is not written from memory — it is written from the source code.

**Report structure:**

Every report must include these sections, each rated PASS / PASS WITH NOTES / FAIL:

1. **Lint Results** — exact output summary
2. **Typecheck Results** — exact output summary, note any fixes applied
3. **Build Results** — route manifest, compilation time
4. **Schema Review** — for sprints touching `packages/shared` or migrations
5. **Server Action Review** — for sprints adding or modifying Server Actions
6. **Component Review** — for sprints adding UI
7. **Security Review** — mandatory for every sprint
8. **Scope Compliance Review** — mandatory for every sprint
9. **Risks Identified** — honest assessment, no omissions
10. **Recommended Improvements** — carry-forward items
11. **Merge Recommendation** — APPROVED / APPROVED WITH PREREQUISITES / NOT APPROVED

**Risks must be included even if minor.** Omitting a known risk from the report is a protocol violation. The risk section is where honest engineering assessment lives — it is not a failure to list risks; it is a failure to omit them.

---

## Phase 6 — Review Approval

The Review Report is submitted for approval. Possible responses:

- **Approved** — proceed to merge.
- **Approved with prerequisites** — complete the stated prerequisites, then merge.
- **Not approved** — address the findings and re-report.

Do not merge until explicit approval is given.

---

## Phase 7 — Prerequisites

Some sprints require runtime prerequisites that cannot be automated:

- Supabase database migrations (applied via SQL Editor)
- Storage bucket creation (manual dashboard)
- Storage RLS policies (applied via SQL Editor)
- Environment variable configuration

When prerequisites are required, provide exact step-by-step instructions before asking for confirmation. Wait for explicit confirmation that all prerequisites are complete before merging.

---

## Phase 8 — Merge

```bash
git checkout develop
git merge --no-ff feature/<sprint-name> -m "merge: <description>

<one-line summary of what this sprint delivered>.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

No fast-forward merges. The merge commit preserves the sprint boundary in git history.

---

## Phase 9 — CURRENT_STATE.md Update

After merge, update `CURRENT_STATE.md`:

1. Update **Last Updated** date.
2. Update **Active Branch** to `develop`.
3. Update **Latest Merge Commit** to the new merge commit hash.
4. Update the **Repository State** table: mark the feature branch as Merged, update `develop` description.
5. Add a new **Sprint History** entry with the merge commit hash and full deliverables list.
6. Move completed prerequisite items out of Follow-Up Tasks.
7. Add any new carry-forward items from the review.
8. Update the **Database Migrations** table.
9. Update the **Next Sprint** section.

Commit the update:

```bash
git add CURRENT_STATE.md
git commit -m "docs(state): update CURRENT_STATE.md — <sprint> complete"
```

---

## Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Feature branches | `feature/sprint-<N>-<scope>` | `feature/sprint-1-assets` |
| Commit types | conventional commits | `feat(assets): implement upload flow` |
| Table columns (ownership) | `owner_id` | `assets.owner_id` |
| Server Action files | `app/actions/<noun>.ts` | `app/actions/assets.ts` |
| Component directories | `components/<feature>/` | `components/assets/` |
| Component files | kebab-case | `asset-type-filter.tsx` |
| Migration files | `NNN_<noun>.sql` | `004_assets.sql` |

---

## What This Protocol Prevents

- Merging code that fails validation
- Merging without a review
- Merging without runtime prerequisites being met
- Sprint scope creep going undetected
- Security regressions (owner_id from client, exposed secrets)
- Orphaned database state (migrations not applied before code ships)
- Broken git history (fast-forward merges obscuring sprint boundaries)
