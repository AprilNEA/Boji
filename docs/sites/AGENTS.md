# docs/sites/

This directory is the MDX content source of the public website pages that `websites/` builds: the docs section under `/docs/` and the standalone pages `/support/` and `/privacy/`. Every `.mdx` file and every `meta.json` file in this directory is published. Read `websites/AGENTS.md` (section "Docs") for the page rules and the build commands.

## Boundary

- Put only content that may be public here. The rest of `docs/` is internal and is not published.
- Do not move or copy `docs/membership.md`, `docs/sentry.md`, `ios/docs/` or other internal documents into this directory.
- `websites/src/lib/source.ts` collects only `**/*.mdx` and `**/meta.json`. Other files here, such as this guide, are not published. Do not add `.md` pages, because the source does not collect them.
- Do not put secrets, review contacts, review accounts, DSNs or private email addresses in pages.

## Layout

The file path under this directory is the URL path.

| Path | Route | Content |
| --- | --- | --- |
| `docs/index.mdx` | `/docs/` | Docs home |
| `docs/guide/` | `/docs/guide/` | User guide, a root folder |
| `docs/developers/` | `/docs/developers/` | Developer docs, a root folder |
| `support.mdx` | `/support/` | Support page for app users |
| `privacy.mdx` | `/privacy/` | Privacy policy of the iOS app |

- Pages in `docs/` belong to the docs section and show the docs sidebar. `docs/meta.json` and the `meta.json` of each section set the sidebar order.
- A top-level `.mdx` file is a standalone page without a sidebar. It is published only when `websites/src/app/(docs)/(pages)/` has a route file for it. Do not add a top-level `meta.json`, because no navigation reads it.

## Support and privacy pages

- App Store Connect uses `https://leanmuscle.club/support/` and `https://leanmuscle.club/privacy/`. Do not rename or move `support.mdx` or `privacy.mdx`. If a route must change, keep a page at the old route and update App Store Connect first.
- The docs sidebar links to the two pages at its bottom, through `PageLinks` in `websites/src/lib/docs.tsx`. Do not add them to a `meta.json`.
- `privacy.mdx` is a draft until AprilNEA LLC confirms the final terms. Keep the draft callout until then. `websites/docs/privacy-support.md` lists the open items and the evidence for each statement.
- Write only verified app behavior. Check the iOS source before you change a statement about data. Do not describe a feature as available before it ships, for example account deletion.
- When app behavior changes, update both pages in the same change as the code, and update `websites/docs/privacy-support.md`.
- Follow the membership number rule in the root `AGENTS.md`. Do not describe how the server allocates membership numbers.
