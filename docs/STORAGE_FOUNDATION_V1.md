# Storage Foundation v1

FraymIQ is moving from a workflow tracker to a real production workspace.

The simplest next step is to let users upload production files while keeping URL paste as a fallback.

## Goal

Store production outputs in Supabase Storage and connect them to the existing artifact version flow.

## Bucket

Use one storage bucket for the MVP:

```text
production-artifacts
```

## Path convention

Uploaded files should use this path shape:

```text
productions/{production_id}/{artifact_kind}/{timestamp}-{safe_filename}
```

Examples:

```text
productions/123/generated-video/1780000000000-output.mp4
productions/123/post-production-master/1780000000000-master.mp4
productions/123/delivery-package/1780000000000-final.zip
```

## First supported upload points

v1 supports uploads at the same points where the MVP currently accepts URLs:

- Video Generation output
- Post-production master
- Delivery package

The user may either upload a file or paste a URL.

## Why this comes before AI provider APIs

External AI providers will produce files. FraymIQ needs a stable place to store and reference those files before provider integrations become useful.

## MVP security boundary

For this MVP foundation, the bucket is public so uploaded files can be opened from artifact links without building a signed download system yet.

This is acceptable for smoke testing and non-sensitive demo files only.

Before real client use, storage should move to private access with signed URLs and stricter per-production policies.

## Product rule

Storage supports the artifact system. It does not replace it.

A file only becomes part of the production record when it is registered as an artifact version and approved through the normal FraymIQ workflow.
