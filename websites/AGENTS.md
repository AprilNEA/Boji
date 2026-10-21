# websites/

This directory holds the 薄肌俱乐部 promotional website and the Boji docs site under `/docs`. It is a Next.js 16 App Router project with a static export (`output: "export"`), Tailwind CSS 4, Motion and Lenis. The docs use Fumadocs. Read `README.md` for the page list and `docs/` for the original plan, TODO list and research notes.

## Toolchain

- Use the devenv shell from the repository root (`devenv shell`, or direnv with `.envrc`). It provides Node.js 26 and pnpm 12. The `websites:install` task runs `pnpm install --frozen-lockfile` in this directory.
- devenv also provides Python 3 with Pillow and rembg for `scripts/`. Run the scripts with `python3` in the devenv shell. To add a Python package, add it to `languages.python.package` in the root `devenv.nix`. Do not add `requirements.txt` or a virtual environment.
- Use pnpm only. Do not add `package-lock.json`, `yarn.lock` or `bun.lock`.
- Keep `tsconfig.json` strict. Import project files with the `@/` alias, which points to `src/`.

## Directory map

| Path | Content |
| --- | --- |
| `src/app/(site)/` | Website routes and the website root layout. Each `page.tsx` only sets metadata and renders a page component |
| `src/app/(docs)/` | Docs root layout, the `/docs` routes in `docs/`, and the standalone pages `/support/`, `/privacy/`, `/terms/`, `/third-parties/` and their English versions under `/en/` in `(pages)/` |
| `src/app/api/search/route.ts` | Static search index for all pages of `../docs/` and `../docs/sites/`, split by language. The build writes it to `out/api/search` |
| `src/app/global-not-found.tsx` | 404 page for the whole site |
| `src/app/globals.css`, `src/app/docs.css` | Website styles and docs styles |
| `src/components/` | Page components, grouped by page, plus `layout/` and `ui/` |
| `src/components/docs/mdx.tsx` | Components that docs MDX can use |
| `src/components/docs/StandalonePage.tsx` | Renders a standalone page of `../docs/sites/` in a given language, without a sidebar |
| `src/lib/content.ts` | Copy, data tables and asset paths (`IMG`, `LAUNCH_FILM`) |
| `src/lib/colors.ts` | Color values that JavaScript needs (Motion animations, SVG attributes) |
| `src/lib/source.ts` | Fumadocs content source for `../docs/` and `../docs/sites/`, the languages, and the page tree and params of the docs section |
| `src/lib/docs.tsx` | Navigation options of the docs section and the standalone pages, `PageLinks`, and the Chinese UI strings of Fumadocs |
| `../docs/` | MDX pages and `meta.json` of the docs section, next to the internal `.md` documents. It is outside this package, at the repository root |
| `../docs/sites/` | MDX files of the standalone pages and their `.en.mdx` English versions. See `../docs/sites/AGENTS.md` |
| `public/media/` | Generated images and the launch film, downloaded from the former Manus storage |
| `public/images/portraits/` | Processed public portraits |
| `scripts/` | Python helpers: `copy_sweep.py` checks the copy, `portraits.py` processes portraits |
| `docs/` | Internal Chinese documents: the planning documents from the original project, and `privacy-support.md` for the support, privacy and terms pages. The docs site does not publish them |
| `app.config.ts`, `public/manus-routes.json` | Manus hosting metadata. The site does not read them. `logoUrl` points to the Boji app icon on the asset host |

Keep source code in `src/`. Keep configuration files (`next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `package.json`) and `public/` at the package root. Keep the docs content in `../docs/` and the standalone pages in `../docs/sites/`. Do not add a content directory in this package.

## Commands

Run these commands in this directory:

- `pnpm dev` starts the dev server on port 3000.
- `pnpm typecheck` runs `tsc --noEmit`. `devenv test` at the repository root also runs it.
- `pnpm build` writes the static site to `out/`. It uses Turbopack. `next build --webpack` is a fallback for an environment that does not allow Turbopack to start its loader processes, because Turbopack binds a local port for them.
- `python3 -m http.server 4173 --bind 127.0.0.1 --directory out` serves the build for a local check. It does not serve `404.html`.

## Rules

- The site is self-hosted as static files. Do not add runtime requests to Manus or other third-party services, and do not add Manus proxy hosts to `next.config.ts`. The site must not read `app.config.ts` or `public/manus-routes.json`.
- Keep the files that only this site uses in `public/` and reference them by local path. Use the asset host `https://assets.leanmuscle.club` only for the generic files in the repository-level `assets/public/`, such as the app icon.
- Do not add `/manus-storage/` paths, `files.manuscdn.com` URLs or other hosted storage URLs.
- Keep the site static. Do not add server actions or other features that `output: "export"` does not support. The only route handler is `src/app/api/search/route.ts`. It exports `staticGET` with `revalidate = false`, so the build writes the search index as a file. Do not add route handlers that need a server.
- The `No.` on the parody member card is a decorative hash of the entered name. It is not a Boji membership number. Do not connect it to the membership API, and do not describe it as a server-issued number.

## Styling

The layout follows Apple keynote pages. The colors follow the Boji app: `ios/Boji/Views/DesignSystem.swift` and `android/app/src/main/kotlin/club/leanmuscle/boji/ui/theme/BojiColors.kt`.

- Use the theme tokens in `src/app/globals.css`: `paper`, `mist`, the warm grays (`fog` to `ink`), `green`, `mint`, `accent`, `water` and `sleep`. Do not add arbitrary hex classes such as `text-[#86868b]`. If no token fits, add one to `@theme`.
- Take colors for Motion and SVG attributes from `src/lib/colors.ts`. Keep its values equal to the tokens in `globals.css`.
- `.t-brand`, `.t-brand-anim`, `.link-apple` and `.badge-new` read the `--tone-*` variables. Add `on-dark` to every dark section and dark card. Add `on-light` to a light area inside a dark one.
- Use `bg-paper` for light pages and sections, `bg-mist` for alternate light sections, and `bg-white` for cards on them. Keep dark sections `bg-black`, because the portraits, the chip and the stage images have black backgrounds.
- The logo is the standing figure of the app icon. `src/components/ui/Logo.tsx` and `public/favicon.svg` copy its path from `ios/Boji/Resources/AppIcon.icon/Assets/mark.svg`. If the app icon changes, update both files. Use `AppIcon` for small app icons, for example in notifications.
- Do not bring back the broccoli silhouette as a logo. The broccoli accessory and the green T-shirt are products, not brand marks.

## Docs

The website and the docs have separate root layouts: `src/app/(site)/layout.tsx` and `src/app/(docs)/layout.tsx`. A link between them makes a full page load. The standalone pages, such as `/support/`, `/privacy/` and `/terms/`, use the docs root layout, so a link between them and `/docs/` does not.

- Import `globals.css` only in the website layout and in `global-not-found.tsx`. Import `docs.css` only in the docs layout. Fumadocs sets base styles on `body` and on all borders, so the two style sheets must not load on the same page.
- Do not wrap docs pages in the website `Nav`, `Footer`, `SmoothScroll` or `Loader`.
- `global-not-found.tsx` needs `experimental.globalNotFound` in `next.config.ts`, because no layout covers both root layouts. It renders its own `<html>` and imports its own styles.
- The content comes from two directories at the repository root. `src/lib/source.ts` defines both with `defineDocs` and combines them in one loader:
  - `../docs/` is the docs section, published under `/docs/`. The source collects only `**/*.mdx` and `**/meta.json` and skips `sites/`, so the internal `.md` documents in the same directory stay unpublished. Never give an internal document the `.mdx` extension.
  - `../docs/sites/` holds the standalone pages. The source collects only `*.mdx`. Add a route file for a page in `src/app/(docs)/(pages)/`, or the build does not publish it.
- Run Next.js commands in this directory, because fumadocs-mdx resolves `dir` from the working directory.
- The loader enables Fumadocs i18n with the `dot` parser. A file named `<name>.en.mdx` is the English version of `<name>.mdx`. The default language is `zh-CN` without a URL prefix, and English pages are under `/en/`. `fallbackLanguage` is `null`, so a page without an English file has no English URL. The default language must stay `zh-CN`, because the docs root layout passes `zh-CN` to the search dialog, and the static search filters the index by that locale.
- `getDocsPage`, `getDocsParams` and `getDocsTree` in `src/lib/source.ts` limit the `/docs` routes and the sidebar to the docs section.
- Turbopack does not resolve files outside its root. `next.config.ts` sets `turbopack.root` to the repository root, so Turbopack can compile `../docs/`. Keep this setting while the content is outside this package. Next.js uses the same value for `outputFileTracingRoot`.
- The docs section has two sections. `docs/guide/` is for app users. `docs/developers/` is for developers. Each section is a root folder (`"root": true` in its `meta.json`), so the sidebar shows a section switcher. Set the page order in `meta.json`.
- `support.mdx`, `privacy.mdx`, `terms.mdx` and `third-parties.mdx` in `../docs/sites/` are the standalone pages `/support/`, `/privacy/`, `/terms/` and `/third-parties/`. Their `.en.mdx` files are the English versions under `/en/`, with route files in `(pages)/en/`. `StandalonePage` takes the language, sets `lang="en"` on the English article and uses the English site name in the title, because the docs root layout fixes `<html lang="zh-CN">`. App Store Connect uses `https://leanmuscle.club/support/` and `https://leanmuscle.club/privacy/`. Do not change these routes. `src/app/(docs)/(pages)/layout.tsx` renders the standalone pages in the Fumadocs `HomeLayout`: a top bar and no sidebar. `PageLinks` in `src/lib/docs.tsx` links to them at the bottom of the docs sidebar, below the Discord and theme buttons. The search index includes them.
- Each MDX page needs `title` and `description` in its front matter. Write docs pages in Chinese.
- Do not publish internal documents, such as `../docs/membership.md`, `../docs/sentry.md` or `../ios/docs/`. Only the `.mdx` and `meta.json` files of `../docs/` are public. The membership number rule in the root `AGENTS.md` also applies to docs pages.
- `docs.css` maps the Fumadocs color tokens (`--color-fd-*`) to the Boji colors for light and dark mode. Keep these values equal to `globals.css` and `DesignSystem.swift`.
- `DOCS_TRANSLATIONS` in `src/lib/docs.tsx` holds the Chinese UI strings. When you upgrade `fumadocs-ui`, check its `Translations` type for new keys.
- Keep `fumadocs-core` and `fumadocs-ui` at the same version. `fumadocs-ui` requires the exact `fumadocs-core` version as a peer dependency.
