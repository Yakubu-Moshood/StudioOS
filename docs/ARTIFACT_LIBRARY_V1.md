# Artifact Library v1

The Artifact Library gives each production one clear place to see its registered outputs.

## Goal

Make production files and generated outputs easier to find without changing the workflow model.

## Source of truth

The library does not create a new artifact system.

It reads from the existing tables:

```text
artifacts -> artifact_versions -> approvals
```

## v1 scope

The first version shows:

- artifact type
- latest version number
- approval status
- created date
- primary output link, when available

## Supported output links

The library looks for common URL fields in artifact version content:

- `video_url`
- `master_url`
- `delivery_url`
- `package_url`
- `campaign_url`
- `url`

## Product rule

Stage panels remain the place where work happens.

The Artifact Library is the place where completed and registered outputs are found.

## Future expansion

Later versions may add search, filters, thumbnails, file metadata, signed downloads, and cross-production asset browsing.

For now, keep it simple and production-level only.
