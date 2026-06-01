# @studioos/assembly-engine

Production assembly engine for StudioOS.

---

## Responsibility

Processes edit scripts and production state to generate Remotion Blueprint objects for video output.

---

## Status

⚠️ Stub — implementation begins in Sprint 6.

Remotion integration requires a dedicated architecture review before Sprint 6 begins.

---

## Features

- Edit Script processing
- Timeline construction
- Asset resolution
- Remotion Blueprint generation

---

## Planned Exports

- `assembleTimeline` — constructs the production timeline from blocks
- `generateRemotionBlueprint` — produces a Remotion-compatible blueprint object
- `RemotionBlueprint` — blueprint type
- `Timeline` — timeline type
- `EditScript` — edit script type

---

## Rules

- **Server-side only.** Never import in Client Components.
- Remotion rendering infrastructure is out of scope until Sprint 6.
- Depends on `@studioos/shared` for type definitions.
