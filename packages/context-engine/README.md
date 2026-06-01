# @studioos/context-engine

Context Package assembly engine for StudioOS.

---

## Responsibility

Consumes structured project data and produces a Context Package — a rich, AI-ready representation of the current production state passed to `@studioos/ai-service` for generation.

---

## Status

⚠️ Stub — implementation begins in Sprint 4.

---

## Inputs

- Project Core
- Creative Compass
- Current Block
- Assets
- Knowledge base entries

## Output

- `ContextPackage` — structured object ready for AI consumption

---

## Planned Exports

- `buildContextPackage` — primary assembly function
- `ContextPackage` — output type
- `ContextInput` — input type

---

## Rules

- **Server-side only.** Never import in Client Components.
- Must not call AI providers directly. Pass the `ContextPackage` to `@studioos/ai-service`.
- Depends on `@studioos/shared` for type definitions.
