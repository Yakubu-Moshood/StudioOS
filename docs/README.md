# StudioOS — Documentation Index

**Last Updated:** 2026-06-02

---

## Governance

Active engineering standards. Read before starting any sprint.

| Document | Purpose |
|----------|---------|
| [CTO Directive](STUDIOOS_CTO_DIRECTIVE.md) | Non-negotiable engineering standards — security, TypeScript, RLS, package boundaries, scope discipline |
| [Development Protocol](STUDIOOS_DEVELOPMENT_PROTOCOL.md) | Sprint lifecycle — the exact 10-phase sequence every sprint follows from architecture review to merge |
| [Master Architecture](STUDIOOS_MASTER_ARCHITECTURE.md) | System architecture snapshot — stack, route structure, database schema, storage design, package boundaries |
| [Sprint Template](STUDIOOS_SPRINT_TEMPLATE.md) | Reusable templates for Architecture Reviews, Review Reports, commit messages, and CURRENT_STATE.md entries |

---

## Build & Bootstrap

| Document | Purpose |
|----------|---------|
| [Repository Bootstrap Specification](05-build/repository-bootstrap-specification.md) | Original monorepo foundation specification — approved before bootstrap implementation |
| [Bootstrap Prompt](claude-code/bootstrap-prompt.md) | Claude Code prompt used to generate the repository bootstrap |

---

## Reading Order

For a new session or new contributor, read in this order:

1. `CURRENT_STATE.md` (root) — where the project is right now
2. `docs/STUDIOOS_MASTER_ARCHITECTURE.md` — what has been built and how it fits together
3. `docs/STUDIOOS_CTO_DIRECTIVE.md` — what rules apply to all development
4. `docs/STUDIOOS_DEVELOPMENT_PROTOCOL.md` — how each sprint is run
5. `docs/STUDIOOS_SPRINT_TEMPLATE.md` — templates to use when writing sprint documents

---

## Document Maintenance

- `STUDIOOS_MASTER_ARCHITECTURE.md` must be updated after every sprint that changes the system architecture (new tables, new routes, new packages becoming active).
- `STUDIOOS_CTO_DIRECTIVE.md` is updated when a new non-negotiable standard is established.
- `STUDIOOS_DEVELOPMENT_PROTOCOL.md` is updated when the sprint process changes.
- `STUDIOOS_SPRINT_TEMPLATE.md` is updated when sprint report structure changes.
- This index is updated whenever a new document is added to `docs/`.
