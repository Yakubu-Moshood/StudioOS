# @studioos/ui

Shared StudioOS UI components.

---

## Responsibility

Contains StudioOS-specific composite components built on top of shadcn/ui primitives. These components are shared across StudioOS applications.

**Note:** Raw shadcn/ui base components live in `apps/web/components/ui/`. This package contains StudioOS-specific components such as `ProjectCard`, `BlockViewer`, and `CompassPanel`.

---

## Status

⚠️ Stub — implementation begins in Sprint 2.

---

## Planned Exports

- `ProjectCard`
- `BlockCard`
- `CompassPanel`
- `DependencyBadge`
- `AssemblyTimeline`

---

## Rules

- May import from `@studioos/shared`.
- May compose shadcn/ui primitives.
- Must not contain business logic.
- All components must be RSC-compatible or explicitly marked `'use client'`.
