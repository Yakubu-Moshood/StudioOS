# @studioos/web

Primary StudioOS application built with Next.js 15 App Router.

---

## Technology

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Backend | Supabase |

---

## Getting Started

From the repository root:

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

The application runs at http://localhost:3000.

---

## Project Structure

```
apps/web/
├── app/              Next.js App Router pages and layouts
├── components/
│   └── ui/           shadcn/ui base components
├── lib/
│   └── utils.ts      cn() class utility
└── public/           Static assets
```

---

## Adding shadcn/ui Components

Base components live in `components/ui/`. Add new components with:

```bash
npx shadcn@latest add [component-name]
```

Always use `shadcn@latest` to ensure Tailwind v4 compatibility.

StudioOS-specific composite components belong in `@studioos/ui`, not here.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `OPENAI_API_KEY` | Sprint 3 | OpenAI API key (server-side only) |
| `ANTHROPIC_API_KEY` | Sprint 3 | Anthropic API key (server-side only) |
| `GOOGLE_API_KEY` | Sprint 3 | Google AI API key (server-side only) |
| `NEXT_PUBLIC_APP_URL` | Yes | Public application URL |

---

## Architecture Rules

- No direct AI provider calls — all AI routes through `@studioos/ai-service`
- No business logic in UI components
- Server Components by default
- Client Components only when required (interactivity, browser APIs)
- Feature-based folder organization
