# AGENTS.md

## **IMPORTANT**

- after any code changes, run `bun check && bun check:types` to ensure there are no lint-errors and type-errors.

## Commands

- `bun dev` - Start development server
- `bun run build` - Build for production
- `bun check` - Lint and format with Biome (auto-fix)
- `bun check:types` - TypeScript type checking
- `bun run deploy` - Deploy to Cloudflare Workers

## Architecture

- **Meta-Framework**:
  - TanStack Start: <https://context7.com/websites/tanstack_start/llms.txt?tokens=1000000>
  - TanStack Router: <https://context7.com/websites/tanstack_router/llms.txt?tokens=1000000>
- **UI Framework**:
  - Solid.js: <https://docs.solidjs.com/llms.txt>
- **Styling**:
  - Tailwind CSS v4: <https://context7.com/websites/tailwindcss/llms.txt?tokens=1000000>
- **Deployment**:
  - Cloudflare Workers (via Vite plugin): <https://developers.cloudflare.com/llms.txt>
- **Structure**:
  - `src/routes/`: file-based routing
  - `src/posts/`: writings
  - `src/components/`: UI
  - `src/lib/`: utility functions and types

## Utilities

- `zod/mini` for type checking (import using `import * as z from 'zod/mini'`)

## Code Style (Biome)

- 2-space indentation, 100-char line width
- Single quotes, no semicolons, no trailing commas
- Prefer no arrow parens
- Use `#*` import alias for `./src/*` (e.g., `import { Foo } from '#components/foo.tsx'`)
- Use file extension in import paths (e.g., `import { Foo } from '#components/foo.tsx'`)
- Prefer kebab-case for file names
- Strict TypeScript: `strictNullChecks`, `noUncheckedIndexedAccess`
- JSX uses `solid-js` pragma, single quotes in JSX attributes
