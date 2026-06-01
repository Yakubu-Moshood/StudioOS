# @studioos/shared

Shared utilities, types, constants, and validation helpers for StudioOS.

---

## Responsibility

The foundation package. All other packages and applications import from here. Contains no business logic — only pure utilities, type definitions, and constants.

---

## Status

⚠️ Stub — implementation begins in Sprint 1.

---

## Planned Exports

### Types

- `Project`
- `ProjectCore`
- `Block`
- `CreativeCompass`
- `Asset`
- `ContextPackage`
- `DependencyGraph`
- `AssemblyTimeline`

### Utilities

- `formatDate`
- `slugify`
- `generateId`

### Validation

- Common Zod schemas for shared data structures

---

## Rules

- Must not import from any other `@studioos/*` package.
- No side effects.
- No server-only code — this package is safe to use anywhere.
- Pure TypeScript only.
