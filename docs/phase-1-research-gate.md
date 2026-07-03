# Phase 1 Research Gate

## Execution path

Approved Brief Version
→ Research Job
→ Research Run
→ Provider generation through `@studioos/ai-service`
→ Research Artifact Version
→ Human approval or revision request

## Invariants

- Research cannot start without an approved Brief Version.
- The UI never calls a provider directly.
- Every provider attempt has a durable Job and Run.
- Provider failure marks the Run and Job failed and leaves a retryable task.
- Successful output creates an immutable Research Artifact Version linked to its source Run.
- Only the latest Research Version may be decided.
- Approval unlocks Script.
- Revision keeps Script locked and makes Research retryable.
- Decisions are immutable and target one exact Artifact Version.

## Current execution model

Provider execution still occurs within a Next.js Server Action. The durable Job/Run model allows this to move to a worker later without changing workflow records.

## Required verification

- Configure `ANTHROPIC_API_KEY`.
- Apply migrations through 015.
- Run typecheck, lint and build.
- Verify provider failure records a failed Run.
- Verify successful Research stores provider, model and token metadata.
