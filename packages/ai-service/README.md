# @studioos/ai-service

Unified AI provider interface for StudioOS.

---

## Responsibility

All AI provider communication routes through this package exclusively. No application or engine package may call OpenAI, Anthropic, or Google directly.

---

## Status

⚠️ Stub — implementation begins in Sprint 3.

---

## Supported Providers

- OpenAI (GPT-4o, o1)
- Anthropic (Claude Sonnet, Claude Opus)
- Google (Gemini)

---

## Planned Exports

- `generateText` — single-turn text generation
- `generateStructured` — structured/JSON output generation
- `streamText` — streaming text generation
- `AIProvider` — provider enum
- `AIServiceConfig` — configuration type

---

## Rules

- **Server-side only.** Never import this package in Client Components.
- All provider API keys must remain server-side environment variables.
- Import only via Next.js API routes or Server Actions.
- Depends on `@studioos/shared` for shared types.
