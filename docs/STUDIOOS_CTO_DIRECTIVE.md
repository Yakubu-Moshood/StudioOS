# StudioOS — CTO Directive

**Status:** Active
**Issued:** 2026-06-02
**Applies To:** All development on the `develop` branch and all feature branches

---

## Purpose

This directive establishes non-negotiable engineering standards for StudioOS development. Every sprint, every feature branch, and every pull request must comply. These standards are not suggestions — they are gates.

---

## 1. Branch and Merge Discipline

**Branching model:**
- `main` — stable, production-ready only. Never develop directly on main.
- `develop` — integration branch. All feature branches merge here.
- `feature/*` — one branch per sprint deliverable. Branch from `develop`, merge back to `develop`.

**Merge requirements:**
- No fast-forward merges. All merges to `develop` use `--no-ff`.
- Every feature branch must pass lint, typecheck, and build before merge is permitted.
- A formal Review Report must be produced and approved before merge.
- Do not merge automatically after implementation. Review first. Merge second.

**Commit discipline:**
- Conventional commit format: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`
- Co-authored commits include: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

---

## 2. Validation Gates

Every feature branch must clear all three gates before merge:

| Gate | Command | Required Result |
|------|---------|----------------|
| Lint | `pnpm lint` | 0 errors, 0 warnings |
| Typecheck | `pnpm typecheck` | 0 errors |
| Build | `pnpm build` | Compiled successfully, 0 errors |

If any gate fails, the issue must be diagnosed and fixed before proceeding. Disabling checks (`--no-verify`, `// @ts-ignore`, `eslint-disable` for anything other than justified inline suppressions) requires explicit documentation of the reason.

---

## 3. Security Non-Negotiables

These rules are absolute. No exceptions.

**Secrets:**
- Never hardcode secrets in source code.
- Never commit secrets to any branch, including `main`.
- Local development: `.env.local` only, listed in `.gitignore`.
- Production: platform-managed secrets (Supabase dashboard, Vercel environment variables).

**Key exposure:**
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are the only Supabase keys permitted in browser scope.
- The Supabase service role key must never appear in any client-side file.
- AI provider keys (OpenAI, Anthropic, Gemini) must never be exposed to the browser. All AI calls route through `packages/ai-service`.

**Authentication:**
- Always call `supabase.auth.getUser()`. Never `supabase.auth.getSession()`.
- `owner_id` in all mutations must be sourced from `auth.getUser()` in Server Actions. Never from client-supplied input.
- Middleware is the single enforcement point for route protection. Layout redirects are belt-and-suspenders only.

**Database:**
- Row Level Security must be enabled on every table in `public.*`.
- Every new table requires a RLS policy before it can be used.
- RLS policies are verified as part of every database migration review.

---

## 4. TypeScript Standards

StudioOS uses TypeScript strict mode across all packages and the web app. The following compiler options are active and must not be weakened:

- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `exactOptionalPropertyTypes: true`

`exactOptionalPropertyTypes` is the most frequently tripped of these. Key implications:
- An optional property `foo?: T` cannot be assigned `undefined` explicitly. It must be omitted or typed as `foo?: T | undefined`.
- Function parameters that accept `T | undefined` must be declared as `param: T | undefined`, not `param?: T`, when callers may explicitly pass `undefined`.

Casting with `as` is permitted only when the cast is safe and verifiable (e.g., casting a Supabase query result to a known type). Do not use `as unknown as T` to paper over type errors.

---

## 5. Package Boundaries

| Package | Purpose | May import from |
|---------|---------|----------------|
| `@studioos/shared` | Types, utils, constants | Nothing — zero dependencies on other StudioOS packages |
| `@studioos/ui` | StudioOS composite components | `@studioos/shared` |
| `@studioos/ai-service` | All AI provider calls | `@studioos/shared` |
| `@studioos/context-engine` | Context assembly for AI | `@studioos/shared` |
| `@studioos/dependency-engine` | Production dependency tracking | `@studioos/shared` |
| `@studioos/assembly-engine` | Output assembly | `@studioos/shared`, `@studioos/context-engine` |
| `apps/web` | Next.js application | Any `@studioos/*` package |

**Critical:** `apps/web` must never call AI provider APIs directly. All AI interactions route through `@studioos/ai-service`. This boundary is enforced as part of every sprint scope review.

---

## 6. Database and Storage Standards

**Migrations:**
- One file per migration, numerically prefixed: `001_`, `002_`, etc.
- All migrations must be idempotent: `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `DROP POLICY IF EXISTS` before `CREATE POLICY`, `CREATE OR REPLACE FUNCTION`, `DROP TRIGGER IF EXISTS` before `CREATE TRIGGER`.
- Migrations are applied in numeric order. Never skip a number.
- `owner_id` is the standard column name for user ownership on all tables. Never `user_id`.

**RLS pattern:**
- Top-level tables (owned directly by user): `using (auth.uid() = owner_id)`
- Child tables (owned indirectly through a parent): EXISTS subquery joining back to the parent and checking `owner_id` there.
- Every migration review must confirm RLS is enabled and policies are correct before merge.

**Storage:**
- All buckets are private. No public buckets without explicit justification and review.
- Storage path convention: `{owner_id}/{project_id}/{asset_id}/{filename}`
- Storage RLS enforces folder-level isolation via `(storage.foldername(name))[1] = auth.uid()::text`
- Signed URLs are generated server-side only. Never in client components.

---

## 7. Next.js Architectural Standards

**Server vs. Client Components:**
- Default to Server Components. Add `'use client'` only when the component requires browser APIs, React hooks, or event handlers.
- Never access `cookies()`, `headers()`, or Supabase server client from Client Components.

**Server Actions:**
- All mutations go through `'use server'` functions in `app/actions/`.
- Return type: `ActionResult<T>` = `{ success: true; data: T } | { success: false; error: string }`
- Always call `auth.getUser()` inside the action. Never trust client-supplied identity.
- Call `revalidatePath()` after every successful mutation.

**Route parameters (Next.js 15):**
- `params` and `searchParams` are Promises. Always `await` them.
- `searchParams` values are `string | string[] | undefined`. Always validate before use.

**Route protection:**
- Middleware in `apps/web/middleware.ts` is the authoritative guard for `/dashboard` and `/workspace`.
- Layout-level redirects are belt-and-suspenders — they redirect but do not replace middleware.

---

## 8. Scope Discipline

Each sprint delivers exactly what is in scope. Nothing more.

- Stub panels (Compass, Map, Core) remain as stubs until their sprint.
- Engine packages (`context-engine`, `dependency-engine`, `assembly-engine`) are not touched until their sprint.
- AI integration does not begin until `@studioos/ai-service` is officially scoped.
- Scope creep into adjacent features during a sprint is a review failure.

Every Review Report includes an explicit Scope Compliance section confirming that no out-of-scope work was introduced.

---

## 9. Review Report Standard

Every sprint produces a formal Review Report before merge. The report covers:

1. Lint Results (PASS / PASS WITH NOTES / FAIL)
2. Typecheck Results
3. Build Results
4. Feature-specific section reviews
5. Security Review
6. Scope Compliance Review
7. Risks Identified
8. Recommended Improvements
9. Merge Recommendation

Reports are produced by reviewing the actual source files, not from memory or assumptions. The reviewer reads every file in scope before writing the report.

---

## 10. Documentation Requirements

After every sprint merge, `CURRENT_STATE.md` must be updated to reflect:
- The new latest merge commit
- The active branch
- The completed sprint's deliverables
- Updated migration status table
- Any new carry-forward items

`CURRENT_STATE.md` is the authoritative record of where the project stands. It is read at the start of every session.
