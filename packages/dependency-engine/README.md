# @studioos/dependency-engine

Dependency tracking and impact analysis engine for StudioOS.

---

## Responsibility

Tracks relationships between production blocks, detects dirty states, and generates impact reports when upstream blocks change.

---

## Status

⚠️ Stub — implementation begins in Sprint 5.

---

## Features

- Dependency Graph construction and traversal
- Dirty state detection
- Impact report generation
- Rebuild suggestion engine

---

## Planned Exports

- `buildDependencyGraph` — constructs the dependency graph from project blocks
- `detectDirtyBlocks` — identifies blocks that require regeneration
- `generateImpactReport` — produces a structured impact analysis
- `DependencyGraph` — graph type
- `ImpactReport` — report type

---

## Rules

- **Server-side only.** Never import in Client Components.
- Must not contain UI logic.
- Depends on `@studioos/shared` for type definitions.
