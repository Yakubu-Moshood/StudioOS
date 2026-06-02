# StudioOS — Sprint Template

**Status:** Active
**Issued:** 2026-06-02

---

## Purpose

This template defines the exact structure and required content for every sprint deliverable: the Architecture Review, the Review Report, and the merge commit. Copy and fill in the bracketed fields for each new sprint.

---

## Template A — Sprint Architecture Review

Use this template when presenting an architecture for approval before implementation begins.

---

```
# Sprint [N] — [Sprint Name] Architecture Review

**Branch:** feature/sprint-[N]-[scope]
**Base:** develop @ [commit hash]
**Date:** [YYYY-MM-DD]

---

## 1. Sprint Scope

[One paragraph describing what this sprint delivers and what it explicitly does not deliver.]

**In scope:**
- [Item 1]
- [Item 2]

**Out of scope (explicitly):**
- [Item 1]
- [Item 2]

---

## 2. Type Changes (`packages/shared`)

[List any additions, removals, or renames to types in @studioos/shared.]

If none: "No changes to @studioos/shared in this sprint."

---

## 3. Database Migration

**File:** `database/migrations/[NNN]_[noun].sql`

[Describe table structure, constraints, indexes, and RLS strategy.]

**RLS pattern used:** [Direct ownership / Join-through ownership / None]

If none: "No new migrations in this sprint."

---

## 4. Storage

[Describe any new buckets, path conventions, or Storage RLS policies.]

If none: "No storage changes in this sprint."

---

## 5. Server Actions

**File:** `app/actions/[noun].ts`

For each action:

**`actionName(input)`**
- Input: `{ field: type, ... }`
- Returns: `ActionResult<ReturnType>` or `ReturnType`
- Auth: [how owner_id is sourced]
- Side effects: [revalidatePath targets]
- Error cases: [what is validated]

---

## 6. Component Breakdown

For each component:

| Component | File | Type | Description |
|-----------|------|------|-------------|
| [Name] | `components/[dir]/[file].tsx` | Server / Client | [What it renders] |

**Client Component justification:** [Why each Client Component needs to be a Client Component.]

---

## 7. Page Changes

[Describe any changes to page files in `app/(app)/`.]

---

## 8. Security Considerations

- [How owner_id is enforced]
- [What keys are in browser scope]
- [Any new input validation requirements]
- [Any new RLS considerations]

---

## 9. Scope Boundary Confirmation

Confirm that no work in this sprint touches:
- [ ] `@studioos/ai-service`
- [ ] `@studioos/context-engine`
- [ ] `@studioos/dependency-engine`
- [ ] `@studioos/assembly-engine`
- [ ] Panel stubs not in scope for this sprint
- [ ] Any feature not listed in Section 1

---

## 10. Open Questions

[List any decisions that require input before implementation can begin. If none, write "None."]
```

---

## Template B — Sprint Review Report

Use this template when producing the formal Review Report after implementation and validation.

---

```
# Sprint [N] — [Sprint Name] Review Report

**Branch:** feature/sprint-[N]-[scope]
**Date:** [YYYY-MM-DD]
**Reviewer:** Claude Code (Sonnet 4.6)
**Status:** Pre-merge review — branch not merged

---

## 1. Lint Results

**[PASS / PASS WITH NOTES / FAIL]**

[Paste turbo lint summary. Note any inline disables with justification.]

---

## 2. Typecheck Results

**[PASS / PASS WITH NOTES / FAIL]**

[Paste turbo typecheck summary. Document any fixes applied during this sprint.]

---

## 3. Build Results

**[PASS / PASS WITH NOTES / FAIL]**

[Paste compilation summary and route manifest.]

---

## 4. [Feature-Specific Section — e.g., Schema Review]

**[PASS / PASS WITH NOTES / FAIL]**

[Review the specific implementation details for this sprint's primary feature area.]

---

## 5. Server Action Review

**[PASS / PASS WITH NOTES / FAIL]**

For each action, verify:
- [ ] `auth.getUser()` called, result checked
- [ ] `owner_id` sourced server-side
- [ ] Input validation present for all user-supplied values
- [ ] `revalidatePath` called after mutations
- [ ] `ActionResult<T>` return type
- [ ] Error messages are human-readable

---

## 6. Component Review

**[PASS / PASS WITH NOTES / FAIL]**

For each component, verify:
- [ ] Server vs. Client designation is correct
- [ ] Client Components have `'use client'` directive
- [ ] Mutations use `useTransition` + Server Actions
- [ ] Pending state disables interactive elements
- [ ] No secrets or server-only imports in Client Components

---

## 7. Security Review

**[PASS / PASS WITH NOTES / FAIL]**

| Concern | Finding | Status |
|---------|---------|--------|
| `owner_id` sourced from `auth.getUser()` | [Finding] | [✓ / ✗] |
| No client-controlled identity fields | [Finding] | [✓ / ✗] |
| No secrets in client scope | [Finding] | [✓ / ✗] |
| RLS enabled and correct | [Finding] | [✓ / ✗] |
| No direct AI provider calls | [Finding] | [✓ / ✗] |
| Input validation at boundaries | [Finding] | [✓ / ✗] |

---

## 8. Scope Compliance Review

**[PASS / PASS WITH NOTES / FAIL]**

| Package / Area | Changes | Status |
|----------------|---------|--------|
| [Package name] | [Description or "No changes"] | [✓ / ✗] |

[Confirm no scope creep into engine packages or unscoped panel implementations.]

---

## 9. Risks Identified

| Risk | Severity | Notes |
|------|----------|-------|
| [Risk description] | High / Medium / Low | [Mitigation or carry-forward] |

[If no risks: "No significant risks identified."]

---

## 10. Recommended Improvements

[List carry-forward items — not blockers for merge, but should be tracked.]

1. [Item]
2. [Item]

[If none: "No improvements recommended at this time."]

---

## 11. Merge Recommendation

**[APPROVED / APPROVED WITH PREREQUISITES / NOT APPROVED]**

[One paragraph: summary of why the branch is or is not ready to merge.]

**Prerequisites (if applicable):**
- [ ] [Prerequisite 1]
- [ ] [Prerequisite 2]
```

---

## Template C — Merge Commit Message

```
merge: feature/sprint-[N]-[scope] into develop

[Sprint Name] complete. [One sentence describing the primary deliverable.]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## Template D — Feature Commit Message

```
feat([scope]): implement Sprint [N] [Sprint Name]

- [Bullet 1: primary deliverable]
- [Bullet 2]
- [Bullet 3]
- [Any notable architectural decisions or amendments]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## Template E — CURRENT_STATE.md Sprint History Entry

Add after the previous sprint entry:

```markdown
### Sprint [N] — [Sprint Name] — `[feature commit hash]` (merged `[merge commit hash]`)
[One sentence summary of what was delivered.]

**Deliverables:**
- [Deliverable 1]
- [Deliverable 2]
- [Deliverable 3]
```

---

## Rating Definitions

| Rating | Meaning |
|--------|---------|
| **PASS** | Requirement fully met. No action required. |
| **PASS WITH NOTES** | Requirement met. Minor observation documented. No action required before merge. |
| **FAIL** | Requirement not met. Must be resolved before merge proceeds. |

---

## Checklist — Pre-Merge

Before marking any sprint ready for merge, confirm all items:

- [ ] Architecture review produced and approved
- [ ] All approved amendments implemented
- [ ] `pnpm lint` — 0 errors
- [ ] `pnpm typecheck` — 0 errors
- [ ] `pnpm build` — compiled successfully
- [ ] Review Report produced (all 10+ sections)
- [ ] Review Report approved
- [ ] Runtime prerequisites documented with exact steps
- [ ] Runtime prerequisites confirmed complete
- [ ] Merge commit uses `--no-ff`
- [ ] `CURRENT_STATE.md` updated and committed
