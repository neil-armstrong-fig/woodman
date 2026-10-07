<p align="center">
  <img src="docs/woodman.svg" alt="Woodman, an axe-wielding lumberjack in front of the Alps" width="128" />
</p>

<h1 align="center">🪓 Woodman</h1>

<p align="center"><em>Alpine Argument Simulator</em></p>

A satirical 3D argument adventure set in the Austrian countryside, built with [PlayCanvas](https://playcanvas.com/).

## ⚠️ Please read this first

This is a **troll game**. It is not to be taken seriously.

- The arguments are silly. Nobody should learn anything from them.
- The code was **not** written to be reviewed. If you find a crime against software engineering, that's part of the experience. 🙃
- Pull requests that "fix" the vibes are unlikely to be merged.

## Running it

```sh
pnpm install
pnpm start   # Vite dev server on http://localhost:3000
```

Other commands:

- `pnpm checks` runs lint, formatting, strict TypeScript and tests.
- `pnpm build` runs the quality gate and writes static output to `dist/`.

Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy-pages.yml`.
