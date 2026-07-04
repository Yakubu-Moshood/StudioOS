# Project Assets v1

Project Assets gives each project a simple place to store reusable files before, during, or after production.

## Goal

Make FraymIQ feel like a real production workspace by giving users a project-level file library.

## Scope

Project Assets v1 supports:

- uploading files at project level
- storing the public file URL
- storing basic metadata such as name, type, size, and storage path
- listing uploaded assets on the project Assets page
- opening uploaded files

## Boundary

Project assets are not the same as production artifacts.

```text
Project assets = reusable source files for a project
Production artifacts = outputs generated or registered inside a production workflow
```

## MVP rule

Keep it simple:

- no folders
- no tags
- no search
- no AI analysis
- no automatic use inside production stages yet

Those can come later after the basic library is stable.

## Storage

Bucket:

```text
project-assets
```

Path convention:

```text
projects/{project_id}/{timestamp}-{safe_filename}
```

The bucket is public for MVP testing and non-sensitive demo files only. Before real client use, move to private access with signed downloads.
