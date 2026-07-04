# Phase 1 Script Gate

## Execution path

Approved Brief Version
→ Approved Research Version
→ Script Job
→ Script Run
→ Provider generation through `@studioos/ai-service`
→ Script Artifact Version
→ Human approval or revision request

## Invariants

- Script cannot start unless both Brief and Research have approved versions.
- Every provider attempt creates a durable Job and Run.
- Successful output creates an immutable Script Artifact Version linked to its source Run.
- Failed execution records the failure and leaves the Script task retryable.
- Only the latest Script Version may be decided.
- Approval unlocks Production Package assembly.
- Revision keeps Production Package locked.
- Approval decisions target one exact Artifact Version and cannot be overwritten.

## Verification

- Apply migrations through 016.
- Generate Script after approving Research.
- Confirm the Run input stores the approved Brief and Research Version IDs.
- Confirm provider, model, token usage and source Run linkage are persisted.
- Confirm failed generation is retryable.
- Confirm approving Script marks Production Package ready.
