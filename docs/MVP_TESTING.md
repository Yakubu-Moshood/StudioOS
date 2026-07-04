# FraymIQ Platform MVP Testing Guide

This guide keeps MVP testing simple and repeatable.

## Current Product/Repo Names

- Product: FraymIQ Platform
- Vercel project: fraymiq-platform
- GitHub repo: Yakubu-Moshood/StudioOS
- Working branch: feature/phase-1-mvp-foundation

## Stable Test URL

Use the branch preview URL for testing the latest branch deployment:

```text
fraymiq-platform-git-feature-ph-85d0f9-yakubu-moshoods-projects.vercel.app
```

Do not rely on one-off Vercel deployment URLs. They change after each deployment.

## Supabase Migration Rule

Only run a new Supabase migration after GitHub CI passes.

Current manual migration process:

1. Open Supabase.
2. Go to SQL Editor.
3. Paste the latest migration SQL.
4. Run it.
5. Confirm Supabase returns success before testing in Vercel.

## MVP Workflow Under Test

The Advertising Campaign workflow should complete this path:

1. Client Discovery
2. Strategic Discovery
3. Big Creative Idea
4. Concept Development
5. Script Development
6. Visual Development
7. Storyboard
8. Shot Design
9. Asset Creation
10. Scene Intelligence
11. AI Generation Package
12. Video Generation
13. Post-production
14. Delivery
15. Campaign Deployment & Production Package

Expected final result:

- Final Campaign Production Package is approved.
- Production state becomes completed.

## Common Test Values

Use these values to avoid wasting time during smoke tests.

### Production

```text
Project title: MVP Smoke Test Project
Production title: MVP Smoke Test Campaign
Production type: Advertising Campaign
```

### Video URL

```text
https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4
```

### Video Generation

```text
Provider: Manual Test
Model/workflow: MVP Smoke Test
Notes: Manual generated video registration test
```

### Post-production

```text
Provider/editor: Manual Test
Workflow/software: MVP Smoke Test
Master URL: https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4
Notes: Manual post-production master test
```

Tick every Post-production checklist item before registering the master.

### Delivery

```text
Delivery method: Manual delivery
Recipient/client name: Test Client
Delivery package URL: https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4
Delivery notes: Manual delivery package test
```

Tick every Delivery checklist item before registering the package.

### Final Campaign Package

```text
Deployment channels: YouTube, Instagram, Facebook
Campaign or launch URL: https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4
Deployment and handover notes: Final MVP smoke test package
Approval note: Approved final MVP smoke test package
```

## Refresh Recovery Test

The following stages use active Job/Run recovery:

- Video Generation
- Post-production
- Delivery

For each one:

1. Start the stage.
2. Refresh the page.
3. Confirm the active run is recovered.
4. Register the output.
5. Approve the artifact.

## Current MVP Boundary

This MVP proves the production workflow, approval gates, versioned artifacts, active-run recovery, and final package completion.

It does not yet include real provider integrations, file upload/storage, or automated AI/video generation.
