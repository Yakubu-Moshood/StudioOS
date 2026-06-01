# StudioOS Repository Bootstrap Specification v1.0

Status: Approved

Purpose:

Define the initial StudioOS repository structure, development standards, tooling, package organization, and environment setup before development begins.

This document serves as the source of truth for Claude Code when generating the StudioOS foundation.

---

# 1. Repository Strategy

StudioOS will use a monorepo architecture.

Reasons:

* Easier management of all services
* Shared code between modules
* Better scalability
* Cleaner architecture
* Better Claude Code support
* Easier maintenance

Repository Name:

studioos

Primary Branch:

main

Development Branch:

develop


---

# 2. Root Folder Structure

StudioOS/

├── apps/

├── assets/

├── database/

├── docs/

├── packages/

├── scripts/

└── STUDIOOS_MASTER_DOCUMENT.md

Purpose:

apps/
Contains all applications.

assets/
Stores logos, branding, diagrams, wireframes, screenshots, references, and presentations.

database/
Contains database schemas, migrations, and seed files.

docs/
Contains all StudioOS documentation.

packages/
Contains reusable services, engines, and shared libraries.

scripts/
Contains utility scripts and automation tools.

STUDIOOS_MASTER_DOCUMENT.md
Master reference document containing consolidated project knowledge.



---

# 3. Applications Structure

StudioOS applications will live inside the apps directory.

Structure:

apps/

└── web/

Purpose:

web/

Contains the primary StudioOS application.

Technology Stack:

* Next.js App Router
* TypeScript
* Tailwind CSS
* shadcn/ui

Responsibilities:

* Authentication
* Dashboard
* Project Workspace
* Project Core
* Creative Compass
* Production Map
* Asset Library
* AI Assistants
* Assembly Engine Interface

Rules:

* No business logic inside UI components.
* Use feature-based organization.
* Use server components where appropriate.
* Keep pages thin and focused.



---

# 4. Packages Structure

StudioOS uses a modular architecture.

Reusable services and engines will live in the packages directory.

Structure:

packages/

├── ui/

├── shared/

├── ai-service/

├── context-engine/

├── dependency-engine/

└── assembly-engine/

Purpose:

ui/

Contains shared UI components used across StudioOS.

Examples:

* Buttons
* Cards
* Forms
* Dialogs
* Layout Components

shared/

Contains shared utilities, types, constants, and helper functions.

Examples:

* Type Definitions
* Utility Functions
* Validation Helpers

ai-service/

Responsible for all AI provider communication.

Supported Providers:

* OpenAI
* Anthropic
* Gemini

Rules:

* No direct model calls from applications.
* All AI interactions flow through ai-service.

context-engine/

Responsible for creating Context Packages.

Inputs:

* Project Core
* Creative Compass
* Current Block
* Assets
* Knowledge

Output:

* Context Package

dependency-engine/

Responsible for dependency tracking and impact analysis.

Features:

* Dependency Graph
* Dirty State Detection
* Impact Reports
* Rebuild Suggestions

assembly-engine/

Responsible for production assembly.

Features:

* Edit Script Processing
* Timeline Construction
* Asset Resolution
* Remotion Blueprint Generation

Rules:

* Each package must remain independent.
* Packages communicate through defined interfaces.
* Avoid circular dependencies.



---

# 5. Database Structure

StudioOS will use Supabase as its primary backend platform.

Responsibilities:

* Authentication
* PostgreSQL Database
* Storage
* Realtime Features
* Edge Functions

Directory Structure:

database/

├── migrations/

├── schema/

└── seed/

Purpose:

migrations/

Stores version-controlled database changes.

Examples:

001_users.sql

002_projects.sql

003_project_core.sql

schema/

Stores current database definitions and reference schemas.

seed/

Stores development and testing seed data.

Rules:

* Never modify production tables manually.
* All schema changes must be performed through migrations.
* Migrations must be versioned and committed to Git.

Core Tables:

users

projects

project_core

blocks

creative_compass

assets

dependencies

knowledge

conversations

messages

remotion_projects

Future Tables:

activity_log

templates

audit_log

notifications



---

# 6. Environment Variables & Secrets Management

StudioOS will use environment variables for all external services and secrets.

Rules:

* Never hardcode secrets.
* Never commit secrets to GitHub.
* Use .env.local for local development.
* Use platform-managed secrets for production.

Required Variables:

Supabase

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

AI Providers

OPENAI_API_KEY

ANTHROPIC_API_KEY

GOOGLE_API_KEY

Application

NEXT_PUBLIC_APP_URL

NODE_ENV

Future Integrations

REPLICATE_API_TOKEN

RUNWAY_API_KEY

KLING_API_KEY

VEO_API_KEY

Cloud Storage (Optional)

CLOUDINARY_API_KEY

CLOUDINARY_SECRET

Rules:

* Secrets remain server-side.
* Public keys must use NEXT_PUBLIC prefix.
* AI provider keys must never be exposed to the browser.
* Environment variables must be documented before use.



---

# 7. Development Standards & Coding Rules

StudioOS must follow consistent engineering standards.

General Rules:

* TypeScript only.
* No JavaScript files.
* Strong typing required.
* Avoid use of any.
* Prefer explicit types.
* Code must be readable and maintainable.

Frontend Standards:

* Use Next.js App Router.
* Use Server Components by default.
* Use Client Components only when required.
* Use Tailwind CSS.
* Use shadcn/ui for interface components.

Architecture Rules:

* Follow feature-based organization.
* Keep business logic outside UI components.
* Reusable logic belongs in packages.
* Shared functionality belongs in shared package.

Naming Conventions:

Files:

kebab-case

Examples:

project-card.tsx

creative-compass.tsx

dependency-dashboard.tsx

Components:

PascalCase

Examples:

ProjectCard

CreativeCompass

DependencyDashboard

Variables:

camelCase

Examples:

projectHealth

currentBlock

contextPackage

Database Rules:

* All schema changes use migrations.
* No manual production database edits.
* Every migration must be version controlled.

AI Rules:

* No direct calls to OpenAI.
* No direct calls to Anthropic.
* No direct calls to Gemini.

All AI interactions must pass through:

packages/ai-service

Testing Standards:

* Unit tests for utilities.
* Integration tests for services.
* End-to-end tests for critical flows.

Documentation Rules:

* Every major service must include documentation.
* Every package must contain a README.
* Public APIs must be documented.

Performance Rules:

* Avoid unnecessary re-renders.
* Optimize database queries.
* Use pagination where appropriate.
* Lazy load heavy components.

Security Rules:

* Validate all inputs.
* Sanitize user content.
* Never expose secrets.
* Use role-based permissions where needed.



---

# 8. Repository Bootstrap Deliverables

The Repository Bootstrap is the first engineering milestone.

Purpose:

Create the StudioOS foundation without implementing product features.

The bootstrap must create:

Repository Structure

apps/

packages/

database/

docs/

scripts/

assets/

Application Setup

apps/web

Next.js App Router

TypeScript

Tailwind CSS

shadcn/ui

Package Setup

packages/ui

packages/shared

packages/ai-service

packages/context-engine

packages/dependency-engine

packages/assembly-engine

Database Setup

database/migrations

database/schema

database/seed

Development Tooling

ESLint

Prettier

TypeScript Configuration

Environment Variable Support

Git Configuration

README Files

Documentation

README.md

Package READMEs

Development Instructions

Bootstrap Must Not Include:

* Authentication
* Dashboard
* Project Workspace
* Database Tables
* AI Features
* Context Engine Logic
* Dependency Logic
* Assembly Logic

These belong to future sprints.

Success Criteria:

A developer can clone the repository, install dependencies, run the application, and understand the project structure.

Expected Result:

A clean, scalable StudioOS foundation ready for Sprint 1.


---

# 9. Claude Code Bootstrap Execution Rules

Claude Code will be used as an implementation partner for StudioOS.

Before generating code, Claude must:

1. Review the Bootstrap Specification.
2. Explain the proposed implementation.
3. Identify files to be created.
4. Explain architecture decisions.
5. Identify potential risks.

Generation Rules:

* Build only what is requested.
* Do not implement future sprint functionality.
* Follow StudioOS architecture.
* Follow StudioOS design principles.
* Follow StudioOS coding standards.

Repository Bootstrap Rules:

Claude must create:

apps/

packages/

database/

scripts/

documentation

configuration

tooling

Claude must not create:

Authentication

Project Workspace

Project Core

Creative Compass

Asset Library

AI Assistants

Context Engine Logic

Dependency Engine Logic

Assembly Engine Logic

These features belong to later sprints.

Communication Rules:

Before writing code, Claude should provide:

* Overview
* File Structure
* Technical Decisions
* Dependencies

After writing code, Claude should provide:

* Setup Instructions
* Verification Steps
* Testing Steps

Success Criteria:

The repository bootstrap is complete when:

* The application runs locally.
* Dependencies install successfully.
* Project structure matches the Bootstrap Specification.
* The repository is ready for Sprint 1.

Final Principle:

StudioOS is built sprint-by-sprint.

Never sacrifice architecture for speed.

Every implementation must support the long-term StudioOS vision.
