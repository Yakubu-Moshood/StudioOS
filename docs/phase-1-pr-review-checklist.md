# Phase 1 Foundation Review Checklist

## Database

- Apply migrations 012, 013 and 014 to a clean Supabase database.
- Apply the same migrations to a database containing existing Projects.
- Confirm every existing Project receives an Organisation.
- Confirm owner membership rows are created.
- Confirm a new Production creates exactly four Stages and four Tasks.

## Access control

- Confirm a user can access only Productions belonging to their Organisation.
- Confirm a user cannot create a Production under another user's Project.
- Confirm Artifact Versions and Approvals inherit Production access.

## Brief gate

- Save Brief Version 1.
- Confirm Production becomes `awaiting_approval`.
- Request revision and confirm Research remains `pending`.
- Save Brief Version 2 and confirm Version 1 remains unchanged.
- Approve Version 2 and confirm Research becomes `ready`.
- Confirm Version 1 cannot be approved after Version 2 exists.
- Confirm an existing decision cannot be overwritten.

## Application

- Run `pnpm typecheck`.
- Run `pnpm lint`.
- Run `pnpm build`.
- Exercise the Project → Productions → Production flow in the browser.
