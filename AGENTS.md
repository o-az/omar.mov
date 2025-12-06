# AGENTS.md

## Commands
- `bun dev` - Start development server
- `bun run build` - Build for production
- `bun run check` - Lint and format with Biome (auto-fix)
- `bun run check:types` - TypeScript type checking
- `bun run deploy` - Deploy to Cloudflare Workers

## Architecture
- **Framework**: TanStack Start + Solid.js + TanStack Router
- **Styling**: Tailwind CSS v4
- **Deployment**: Cloudflare Workers (via Vite plugin)
- **Structure**: `src/routes/` for file-based routing, `src/components/` for UI

## Code Style (Biome)
- 2-space indentation, 100-char line width
- Single quotes, no semicolons, no trailing commas
- Arrow parens only when needed: `x => x` not `(x) => x`
- Use `#*` import alias for `./src/*` (e.g., `import { Foo } from '#components/Foo'`)
- Strict TypeScript: `strictNullChecks`, `noUncheckedIndexedAccess`
- JSX uses `solid-js` pragma, single quotes in JSX attributes
