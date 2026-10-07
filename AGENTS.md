# Woodman

A browser-based PlayCanvas game in a pnpm workspace. `webapp/` is the only package and builds static output to `dist/`.

## Before changing code

1. Read this file and inspect the nearest implementation and test.
2. Preserve the separation between game rules, browser UI, world rendering and orchestration.
3. Re-read a file immediately before editing it so concurrent work is not overwritten.
4. Run `pnpm checks` and `pnpm build` before handoff. Do not commit, stage or push unless asked.

## Structure

- `webapp/src/Game.ts` only boots the game and exposes the small debug API.
- `game/arguments/` contains argument and ability content.
- `game/state/` contains pure rules and local persistence. Tests sit beside their subject.
- `game/ui/` owns DOM rendering and the game stylesheet.
- `game/world/` owns PlayCanvas entities and the Austrian village.
- `game/WoodmanGame.ts` coordinates those boundaries and handles the game loop and input.

Keep code as close to its caller as possible. Prefer subject folders over `utils`, `helpers`, `common` or `misc`.

## TypeScript and style

- Keep strict TypeScript enabled. Do not use `@ts-ignore`, `@ts-nocheck`, `any` or unchecked DOM casts.
- Use `@src/*` imports across folders and `./` within one folder. Do not use `../` imports.
- Type-only imports use `import type`. Named functions and module boundaries have explicit return types.
- Prefer named exports. A PascalCase TypeScript filename names its primary export.
- Give object shapes names. Derive literal unions from their runtime `as const` list.
- Use `undefined` for absence inside the codebase. Translate browser-provided `null` at the boundary.
- Use no more than three positional parameters. Past that, pass a named options object.
- Prefer early returns and explicit `if` statements to nested conditions and ternaries.
- Put helper function declarations below their callers. A class keeps state-dependent helpers as private methods.
- Prettier owns formatting. Use two spaces, semicolons, double quotes and trailing commas.

## Commands

- `pnpm start` starts Vite on port 3000.
- `pnpm checks` runs lint, formatting, strict TypeScript and Vitest.
- `pnpm build` runs the full quality gate and creates `dist/`.
- Scope write-formatting to files changed in the current task. Do not run repository-wide fix commands.
