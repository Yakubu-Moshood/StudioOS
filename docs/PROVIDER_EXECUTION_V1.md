# Provider Execution v1

FraymIQ must connect to external tools without turning the platform into a complex integration maze.

This document locks the simplest execution model for the next stage of the platform.

## Current foundation

The product already has the core workflow spine:

```text
Production -> Stage -> Task -> Job -> Run -> Artifact Version -> Approval -> Production Package
```

This stays as the source of truth.

## Provider Job

A Provider Job is any execution step that can be performed by a human, an internal service, or an external provider.

A Provider Job answers six questions:

```text
What provider is doing the work?
What task is it doing?
What input was sent?
What status is it in?
What output came back?
Which artifact version did it create?
```

## Adapter rule

Every provider must fit one simple adapter shape:

```text
start -> running -> complete -> artifact version -> approval
```

No provider should bypass FraymIQ's artifact and approval model.

## v1 adapter types

### Manual Adapter

This is the current MVP behavior.

A user starts a run, performs the work manually or outside FraymIQ, then registers the output URL or uploaded file as a versioned artifact.

This adapter remains valid even after API providers are added.

### API Adapter

This will be added later for providers such as Runway, Kling, Minimax, HeyGen, Manus, or other production tools.

An API Adapter will still create a Job and Run, track provider status, and register the final result as an Artifact Version.

## Non-negotiable rule

Providers are execution details. FraymIQ owns the production record.

That means external tools may generate outputs, but FraymIQ decides:

- which output belongs to which production
- which version is current
- whether the output is approved
- whether the final production package is complete

## v1 boundary

For now, we are not building external AI provider integrations.

The next step is to strengthen the Manual Adapter with file upload and storage so FraymIQ can hold production assets, not only paste external URLs.
