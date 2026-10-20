# animations/

This directory generates the exercise Lottie animations for the iOS and Android apps. `src/` is a TypeScript generator. `lottie/` holds the generated JSON files that the apps load. Read `README.md` for the generation method, the commands and the app contract.

## Toolchain

- Use the devenv shell from the repository root (`devenv shell`, or direnv with `.envrc`). It provides Node.js 24 and pnpm 12, and it runs `pnpm install` in this directory.
- Use pnpm only. Do not add `package-lock.json`, `yarn.lock` or `bun.lock`.
- Run TypeScript with tsx. Do not add a build step that emits JavaScript.
- Keep `tsconfig.json` strict. Write imports with the `.ts` extension. Use erasable syntax only: no `enum`, `namespace` or parameter properties.

## Rules

- Do not edit files in `lottie/` by hand. Change `src/`, run `pnpm build`, and commit `lottie/` in the same commit as the source change.
- Keep the generator deterministic. Do not use `Date`, `Math.random` or environment-dependent values in `src/`.
- Use shape layers only: paths, ellipses, rectangles, fills and strokes. Do not add images, expressions, masks, layer parenting or text, because the native players must render the files.
- Keep exercise IDs equal to `Exercise.id` in `ios/Boji/Models/BojiStore.swift` and to the IDs in Android `Workout.kt`. Keep the order in `src/courses.ts` equal to the app course order.
- Treat the paths `lottie/<palette>/<id>.json` and the `IndexEntry` fields in `src/generate.ts` as a contract with both apps. If you change them, update the iOS and Android consumers in the same change.
- Each exercise script in `src/exercises/` default-exports an object that ends with `satisfies Exercise`.

## Add or change an exercise

1. Edit or add `src/exercises/<id>.ts`. Register a new exercise in `src/courses.ts`.
2. Run `pnpm build`. A `WARN` line or exit code 1 means an IK target is out of reach. Fix the pose before you continue.
3. Run `pnpm sheets` and inspect `docs/contact-sheet-light.jpg` and `docs/contact-sheet-dark.jpg`.
4. Update the exercise table in `README.md`.

## Verify

- Run `pnpm typecheck` and `pnpm check`. `devenv test` at the repository root runs both.
- `pnpm sheets` and `pnpm render` need Chromium. Install it with `pnpm exec playwright-core install chromium-headless-shell`, or set `CHROME_PATH`.
- Browser rendering does not verify lottie-ios or lottie-android. Report native rendering as not verified unless you ran it on a simulator or a device.
