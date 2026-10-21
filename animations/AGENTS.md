# animations/

This directory generates the exercise Lottie animations for the iOS and Android apps. `src/` is a TypeScript generator. `lottie/` holds the generated JSON files of course exercises, which the apps load. `lottie-library/` holds the same files for library exercises; no app bundles it. Read `README.md` for the generation method, the commands and the app contract.

## Toolchain

- Use the devenv shell from the repository root (`devenv shell`, or direnv with `.envrc`). It provides Node.js 26 and pnpm 12, and it runs `pnpm install` in this directory.
- Use pnpm only. Do not add `package-lock.json`, `yarn.lock` or `bun.lock`.
- Run TypeScript with tsx. Do not add a build step that emits JavaScript.
- Keep `tsconfig.json` strict. Write imports with the `.ts` extension. Use erasable syntax only: no `enum`, `namespace` or parameter properties.
- Import a file in another directory with the `@/` alias, which `tsconfig.json` maps to `src/`, for example `import { solve } from '@/rig/side.ts'`. Use `./` only for a file in the same directory. Do not write `../`. tsx resolves the alias at run time.
- The tsx CLI (`pnpm <script>`) opens an IPC socket. Where the environment does not allow that (`listen EPERM`), run the same script with `node --import tsx <file>`.
- gifenc ships no types. `scripts/gifenc.d.ts` declares the members that `scripts/readme.ts` uses. Import the default export of `gifenc`, because Node does not see named exports in the package.

## Source layout

| Path | Content |
| --- | --- |
| `src/exercise.ts` | The `Exercise` contract for side-view and front-view scripts |
| `src/courses.ts` | `COURSES` and `LIBRARY` |
| `src/math/` | `vec2.ts` (2D vectors, angles, `lerp`, `clamp`), `vec3.ts` (3D vectors and body bases), `timeline.ts` (easing, `keyframes`, `timeline`) |
| `src/draw/` | `lottie.ts` (Lottie shapes, paths, colors, keyframe reduction) and `palettes.ts` |
| `src/rig/` | `ik.ts` (`ik2`, `ik3`), `side.ts` (side-view rig and figure), `front.ts` (front-view 3D rig), `anatomy.ts` (side-view joint direction checks for `scripts/inspect.ts`) |
| `src/compose/` | `index.ts` (`compose`, which picks the view), `side.ts`, `front.ts` and `shared.ts` (zoom, props, floor, output) |
| `src/build/` | `generate.ts` (writes `lottie/`, `lottie-library/` and the catalog), `poster.ts`, and the CLIs `cli.ts` (`pnpm build`) and `assets.ts` (`pnpm build:assets`) |
| `src/exercises/` | `common.ts` (floor levels and shared poses such as `HIGH_PLANK`), `equipment/`, `course/` (one script per course exercise) and `library/` (families) |

- Imports go one way: `math/` → `draw/` → `rig/` → `compose/` → `build/`. A module never imports a later directory.
- `exercise.ts`, `src/exercises/` and `courses.ts` may import `math/`, `draw/`, `rig/` and `exercise.ts`. They never import `compose/` or `build/`.
- Put a pose that two or more families use in `src/exercises/common.ts`, not in one exercise script that the others import.
- The repository `.gitignore` ignores every `build/` directory. `animations/.gitignore` re-includes `src/build/`. Do not give another source directory the name `build`.

## Math and geometry

Use the libraries through the helpers in `src/`. Do not hand-write vector math, rotations, curves, easing or interpolation in rigs, exercises or equipment.

| Need | Helpers | Library |
| --- | --- | --- |
| 2D vectors and angles in degrees | `add`, `sub`, `mul`, `addScaled`, `dot`, `len`, `dist`, `norm`, `rotate`, `dir`, `polar`, `mirrorX`, `ang`, `angleBetween` in `src/math/vec2.ts` | gl-matrix |
| 3D vectors and rotations | `add3`, `addScaled3`, `cross3`, `norm3`, `lerp3`, `rotAxis`, `turn` and the other helpers in `src/math/vec3.ts` | gl-matrix |
| Interpolation and keyframed values | `lerp`, `lerpV` in `src/math/vec2.ts`; `keyframes`, `pingPong`, `bump`, `breath` in `src/math/timeline.ts` | d3-interpolate, d3-scale |
| Easing | `easeSinIn`, `easeSinOut`, `easeSinInOut`, `easeCubicInOut`, `easeLinear` in `src/math/timeline.ts` | d3-ease |
| Clamping and rounding | `clamp`; `round` from es-toolkit | es-toolkit |
| Paths | `PathBuilder`, `capsule`, `smoothClosed`, `smoothOpen`, `fromSvgPath` in `src/draw/lottie.ts` | d3-path, d3-shape, svgpath |
| Colors | `hexColor` | d3-color |
| Spine curve | `solve` in `src/rig/side.ts`, `solveFront` in `src/rig/front.ts` | bezier-js |

- These stay hand-written, because no suitable library exists: two-bone IK (`ik2`, `ik3` in `src/rig/ik.ts`), keyframe reduction and angle unwrapping in `src/draw/lottie.ts`, `smooth` (smoothstep, `src/math/timeline.ts`) and `ang` (`Math.atan2`).
- `bump` and `breath` clamp t to [0, 1] and give one cycle. For a wave with more than one cycle, pass the phase of each cycle, for example `breath((2 * u) % 1)`.
- Do not build an SVG string for a path that changes every frame. d3-shape curves draw into a recording context in `src/draw/lottie.ts`. A string round trip on every frame made a full build three times slower.
- Add a library with pnpm, and only with a permissive license: MIT, ISC, BSD or Apache-2.0. Do not add a package whose license is missing or `UNLICENSED`.
- After a change to `src/math/`, `src/draw/lottie.ts`, `src/rig/` or `src/compose/`, compare a full build before and after the change with every frame evaluated, not only the keyframes. Two builds can choose different keyframes for the same motion.

## Rules

- Do not edit files in `lottie/` or `lottie-library/` by hand. Change `src/`, run `pnpm build`, and commit `lottie/` in the same commit as the source change.
- Git ignores `lottie-library/` and the asset host output `../assets/public/animations/`. Commit only the library source. Do not commit generated library files, and do not use Git LFS for them.
- `pnpm readme` (`scripts/readme.ts`) writes the images of the root `README.md` to `../assets/public/previews/`. Git tracks them. See "README exercise images" in the root `AGENTS.md`.
- Keep the generator deterministic. Do not use `Date`, `Math.random` or environment-dependent values in `src/`.
- Use shape layers only: paths, ellipses, rectangles, fills and strokes. Do not add images, expressions, masks, layer parenting or text, because the native players must render the files.
- `COURSES` in `src/courses.ts` must match the app courses. Use the IDs of `Exercise.id` in `ios/Boji/Models/BojiStore.swift` and Android `Workout.kt`, in the app order.
- Put exercises that no app course uses yet in a family directory of `src/exercises/library/`. The generator discovers them, and `LIBRARY` includes them. Their files go to `lottie-library/`, and its `index.json` lists them with `course: null`.
- When an app course adopts a library exercise, import its script in `src/courses.ts`, add it to `COURSES` and run `pnpm build`. `LIBRARY` leaves out course exercises, so the build moves its files to `lottie/`. Exercise IDs must be unique; `courses.ts` throws on a duplicate.
- `pnpm sheets` reads `lottie/` only. `pnpm preview` reads `lottie/` and the library exercises whose IDs you pass. The full library is too large for one image or page. Review library exercises with `scripts/family.ts`.
- Do not make the apps bundle `lottie-library/`.
- Treat the paths `lottie/<palette>/<id>.json` and the `IndexEntry` fields in `src/build/generate.ts` as a contract with both apps. If you change them, update the iOS and Android consumers in the same change.
- Each exercise script in `src/exercises/course/` and `src/exercises/library/<family>/` default-exports an object that ends with `satisfies Exercise`.
- `posterFrame` in `index.json` is the still frame that the apps show when animations are off. The generator picks the middle of the first span with the highest total muscle effort. Set `poster` in the exercise script only when that frame does not show the exercise.

## Add or change an exercise

1. Edit or add the script. A course exercise is `src/exercises/course/<id>.ts`; register a new one in `COURSES` in `src/courses.ts`. Any other exercise is `src/exercises/library/<family>/<id>.ts`; the generator discovers it, and `src/exercises/library/AGENTS.md` gives the rules.
2. Run `pnpm build`. A `WARN` line or exit code 1 means an IK target is out of reach. Fix the pose before you continue.
3. Run `pnpm sheets` and inspect `docs/contact-sheet-light.jpg` and `docs/contact-sheet-dark.jpg`. The fifth column, with a dashed outline, is the poster frame.
4. Update the exercise table in `README.md`.
5. For a course exercise, run `pnpm readme` and commit the changed files in `../assets/public/previews/course/` in the same commit.

## Verify

- Run `pnpm typecheck` and `pnpm check`. `devenv test` at the repository root runs both.
- `pnpm sheets`, `pnpm render` and `pnpm readme` need Chromium. Install it with `pnpm exec playwright-core install chromium-headless-shell`, or set `CHROME_PATH`.
- Browser rendering does not verify lottie-ios or lottie-android. Report native rendering as not verified unless you ran it on a simulator or a device.
