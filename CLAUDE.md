# SakuEdit - Claude Code Guidelines

## Language
Always respond in Japanese.

## Circuit Breaker Rules (CRITICAL)
- When using hooks (especially stop hooks), ALWAYS include a circuit breaker mechanism
- NEVER create hooks that retry indefinitely
- Add a max retry count (3) or exit condition to prevent infinite loops when hitting usage limits or errors
- If any automated action repeats more than 3 times with the same error, STOP and report the loop to the user instead of retrying

## Debugging Protocol - Environment First
Before debugging ANY application issue, ALWAYS run this checklist first:
1. Verify all required env vars are set (check `.env` and `.env.example`)
2. Test connectivity to external APIs (OpenRouter, ZAI, etc.)
3. Confirm AI model configurations are valid and not deprecated
4. Check that seed data exists and DB is not corrupted
5. Only AFTER environment is verified, investigate application logic

## Agent Delegation Rules
When spawning task agents:
- Each agent MUST produce concrete output (not just a plan) within 3 iterations
- If an agent is idle or stuck in 'plan mode' for more than 2 iterations, cancel it and implement directly
- If blocked, agents must immediately report the blocker instead of retrying
- Set clear deliverable expectations before spawning
- Time-sensitive tasks should be done directly if the agent hasn't produced results after 2 check-ins

## TypeScript Rules
- Use `import type` ONLY for pure type imports that don't need runtime metadata
- NEVER use `import type` for DTOs used by decorators (Swagger, NestJS, etc.)

## UI Verification
- When making UI changes (especially landing page), verify rendering on BOTH desktop and mobile
- For thumbnail/image generation, confirm quality meets expectations before proceeding

## Tech Stack
- Framework: Next.js 16.1.5
- UI: React 19.2.3
- Styling: Tailwind CSS 4
- DB: SQLite (local) with Prisma
- Video: Remotion + Remotion Skills
- Deploy: SST (Serverless Stack)

## Build Verification
- Run `npm run build` before marking any implementation complete
- Run E2E tests with Playwright when available
