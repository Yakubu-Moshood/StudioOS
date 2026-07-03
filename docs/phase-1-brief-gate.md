# Phase 1 Brief Gate

The Brief gate is the reference implementation for Human Authority and Single Source of Truth.

## Invariants

- Saving a Brief always creates a new immutable Artifact Version.
- Only the latest Brief Version may receive a decision.
- A decision belongs to one exact Artifact Version.
- Decisions are immutable.
- Approval completes the Brief stage and unlocks Research.
- A revision request reopens the Brief task and keeps Research locked.
- Creating a newer Brief Version invalidates Research readiness granted by an older version.
- Every version creation and decision appends a Production Event.

## Deferred

- Research provider execution
- Job and Run execution UI
- Downstream Artifact invalidation after Research has already run
- Notifications
