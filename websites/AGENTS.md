# websites/

This directory holds the 薄肌俱乐部 promotional website. It is a Next.js 16 App Router project with a static export (`output: "export"`), Tailwind CSS 4, Motion and Lenis. Read `README.md` for the page list and `docs/` for the original plan, TODO list and research notes.

## Toolchain

- Use the devenv shell from the repository root (`devenv shell`, or direnv with `.envrc`). It provides Node.js 24 and pnpm 12. The `websites:install` task runs `pnpm install --frozen-lockfile` in this directory.
- Use pnpm only. Do not add `package-lock.json`, `yarn.lock` or `bun.lock`.
- Keep `tsconfig.json` strict. Import project files with the `@/` alias, which points to `src/`.

## Directory map

| Path | Content |
| --- | --- |
| `src/app/` | Routes. Each `page.tsx` only sets metadata and renders a page component |
| `src/components/` | Page components, grouped by page, plus `layout/` and `ui/` |
| `src/lib/content.ts` | Copy, data tables and asset paths (`IMG`, `LAUNCH_FILM`) |
| `public/media/` | Generated images and the launch film, downloaded from the former Manus storage |
| `public/images/portraits/` | Processed public portraits |
| `scripts/` | Python helpers: `copy_sweep.py` checks the copy, `portraits.py` processes portraits |
| `docs/` | Chinese planning documents from the original project |
| `app.config.ts`, `public/manus-routes.json` | Manus hosting metadata. The site does not read them |

Keep source code in `src/`. Keep configuration files (`next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `package.json`) and `public/` at the package root.

## Commands

Run these commands in this directory:

- `pnpm dev` starts the dev server on port 3000.
- `pnpm typecheck` runs `tsc --noEmit`. `devenv test` at the repository root also runs it.
- `pnpm build` writes the static site to `out/`.

## Rules

- Reference every asset through a local path under `public/`. Do not add `/manus-storage/` paths or other hosted storage paths.
- Keep the site static. Do not add API routes, server actions or other features that `output: "export"` does not support.
- The `No.` on the parody member card is a decorative hash of the entered name. It is not a Boji membership number. Do not connect it to the membership API, and do not describe it as a server-issued number.
