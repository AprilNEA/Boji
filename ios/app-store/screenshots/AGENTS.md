# Local App Store screenshot editor

This directory contains a local-only Next.js editor for App Store screenshots.
It does not use Manus hosting, analytics, or cloud services.

## Commands

Run commands from this directory.

```sh
pnpm install
pnpm typecheck
pnpm build
pnpm dev
pnpm start
```

`dev` and `start` must bind only to `127.0.0.1:4317`.
Start the server only for local editing or verification. Do not publish it.
Write build and command logs under `.work/boji-asc/screenshots/` at repository root.
Keep `--webpack` on `dev` and `build`; Turbopack's compiler socket is unavailable in the tested local environment.

## Source preservation

The editor comes from `ParthJadhav/app-store-screenshots` at
`5386f227360bddb06c8beaff920a1a34c9f01932`.
Preserve the editor and export behavior.
Do not rewrite `src/app/page.tsx` or `src/components/editor/device-frames.tsx`.

These paths contain the actual screenshot project:

- `app-store-screenshots.json`
- `public/screenshots/`
- `public/app-icon.png`

Preserve them when updating the upstream template.
Keep capture provenance in `capture-manifest.json` and the shot plan in `shots.md`.
Use real captures with fictional test data. Never redraw app UI or use private user data.
Do not mark a draft as submission-ready without checking the final release build.

## Dependencies and assets

Use the existing pnpm only.
Do not add Bun, npm, Yarn, telemetry, cloud, or hosting dependencies.
Keep `pnpm-lock.yaml` current after dependency changes.
Use the pinned `packageManager` version and let pnpm generate its own lockfile.
Do not convert another package manager's lockfile by hand.

Do not use `next/font/google`.
Use system font fallbacks for the editor UI.
Do not set fixed Chinese text dimensions or layouts.

`LICENSE` preserves the upstream MIT license for the editor code.
`public/frames/` contains Apple Product Bezels under a separate Apple license.
They are allowed only for mock-ups of apps on Apple platforms.
They are not MIT assets.
Read `THIRD_PARTY_NOTICES.md` before changing these files.

## Git hygiene

Keep `node_modules/`, `.next/`, and local export caches out of Git.
Do not ignore `app-store-screenshots.json` or `public/screenshots/`, because a deck must remain reproducible.
Do not commit unless the user explicitly requests it.
