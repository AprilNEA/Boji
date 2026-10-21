# Exercise library authoring guide

This guide covers `src/exercises/library/`. Read `animations/AGENTS.md` first. This file takes precedence for library exercises.

Library exercises are animations that no app course uses yet. `pnpm build` writes them to `lottie-library/`, which Git ignores. `pnpm build:assets` writes them for the asset host. Accuracy comes first: a wrong animation teaches a wrong movement.

## Files

| Path | Content |
| --- | --- |
| `<family>/<id>.ts` | One exercise. The file name is the exercise ID. |
| `<family>/_<name>.ts` | Helper code for one family or one author. A leading `_` means "not an exercise". |
| `load.ts` | `familyNames()` and `loadFamily(family, ids?)`. No side effects. |
| `index.ts` | Loads every family. `courses.ts` uses it for `LIBRARY`. |

An exercise file has these rules:

- It default-exports one exercise with `satisfies SideExercise` or `satisfies FrontExercise`.
- `id` is lowercase kebab-case, equals the file name, and is unique in the repository.
- `name` is a concise Chinese name in standard gym terms, for example `上斜哑铃卧推`.
- `meta.en` is the English name. `meta.family` equals the directory name.
- `meta.equipment` lists every visible piece of equipment with `EquipmentTag` values from `src/exercise.ts`.
- `meta.sources` lists every source record that the animation covers, as `fe:<id>` or `hz:<id>`.
- `muscles` is not empty.
- The file starts with a comment of 2 to 4 lines. It states the start position, the movement and the fixed points in your own words. Do not copy source text.

## Code

- Import shared code with the `@/` alias, for example `import { polar } from '@/math/vec2.ts'` and `import { flatBench } from '@/exercises/equipment/index.ts'`. Import your family helper with `./_<name>.ts`. Do not write `../`.
- Use the helpers of `src/math/` instead of `Math.sin`, `Math.cos` and hand-written formulas. `animations/AGENTS.md` lists them under "Math and geometry".

| Instead of | Write |
| --- | --- |
| `add(p, [r * Math.cos(a * D2R), r * Math.sin(a * D2R)])` | `polar(p, a, r)` |
| `[Math.cos(a * D2R), Math.sin(a * D2R)]` | `dir(a)` |
| `add(a, mul(b, k))` | `addScaled(a, b, k)` |
| `Math.sin(p * Math.PI / 2)`, `1 - Math.cos(p * Math.PI / 2)` | `easeSinOut(p)`, `easeSinIn(p)` |
| `Math.sin(Math.PI * u)` for u in [0, 1] | `bump(u)` |
| `(1 - Math.cos(2 * Math.PI * u)) / 2` for u in [0, 1] | `breath(u)` |
| Chained `lerp` calls with `if` on the progress | `keyframes([[0, a], [0.4, b], [1, c]])` |

`bump`, `breath` and `keyframes` clamp their input to [0, 1]. A wave with more than one cycle in the loop needs the phase of each cycle.

## Commands

Run the commands in `animations/`. Set `TMPDIR` to a writable directory inside the repository first, for example `.work/exercise-animation/tmp`. Call scripts as `node --import tsx scripts/<name>.ts`, because the `tsx` command line does not work in every sandbox.

| Command | Purpose |
| --- | --- |
| `node --import tsx scripts/family.ts <family> --out <dir> [--dark] [--worklist <json>] [<id>...]` | Type-checks, validates and generates the given exercises, then renders review sheets to `<dir>`. |
| `node --import tsx scripts/inspect.ts <family> <id> [--frames a,b,c] [--samples n]` | Prints IK warnings frame by frame, joint angles and ground contact for one exercise. |
| `node --import tsx scripts/gallery.ts <dir>` | Renders every equipment helper next to a standing figure. |

`family.ts` with IDs or `--worklist` imports and type-checks only those files and the helpers that they import. Unfinished files of other authors in the same directory do not affect the result. Without IDs, it checks the whole family.

Both scripts exit with code 1 on errors. `inspect.ts` also exits with code 1 when a frame has an IK warning or a joint goes more than 2 px below the ground.

## Rules for parallel authors

Several authors can work in one family directory at the same time.

- Write only your own exercise files and your own helper file, named `_<your work list name>.ts`.
- Do not edit shared code: `src/*.ts`, `src/exercises/*.ts`, `src/exercises/equipment/`, `scripts/` and the documents. If you need a shared helper, write it in your helper file and report the need.
- Do not run `pnpm build`, `pnpm check`, `pnpm sheets`, `pnpm preview` or `pnpm build:assets`. They write tracked or shared output.
- Always pass `--out` with a directory that only you use, and always pass your IDs or `--worklist`.
- Do not run Git commands that change the index or the working tree.

## Choosing what to animate

One work list item becomes one of three results:

| Result | When |
| --- | --- |
| Own file | The default. Variations that look different stay separate: grip, stance, bench angle, implement, one arm or alternating, and pauses. |
| Merged | Two items describe the same visible movement, for example a pure naming duplicate. Add the sources of both items to one file. |
| Skipped | The movement cannot be shown honestly: it needs a partner, equipment that we cannot draw, or it is not an exercise. Give the reason. |

Prefer a parametric helper when many items share one movement. For example, one curl builder can take the implement, the grip and the bench. Each exercise file then stays short.

## Choosing the view

The work list `view` is a suggestion.

- Use the side view (the default) for movements in the sagittal plane: squats, hinges, presses, rows, curls, lunges, most core and most stretches.
- Use the front view (`view: 'front'`) for movements in the frontal plane: lateral raises, jumping jacks, side lunges, side bends, hip abduction while standing.
- Use the view where the working joint moves the most on screen. Use the view where the equipment stays readable.

## Side-view rig

Source: `src/rig/side.ts` and `src/exercises/common.ts`.

- The canvas is 512 × 512 px. Y points down. `GROUND` (`G`) is 452. `FLOOR` is the top of the mat, `G - 6`.
- The figure faces screen right (+x). The near limbs (`_n`) face the viewer, and the far limbs (`_f`) are behind the body.
- Angles are screen angles in degrees: 0 = forward, 90 = down, -90 = up, 180 = backward.
- `spine: { lumbar, thoracic }` uses the same angles. -90 is upright. -60 leans 30° forward.
- `BODY` gives the bone lengths in px: thigh 94, shin 90, lumbar 58, thoracic 66, neck 18, upper arm 66, forearm 60, hand 16.
- The ankle sits `A` = 13 px above the sole. The figure is about 384 px tall, so 1 px is about 0.46 cm and 10 cm is about 22 px.
- A limb has either an IK `target` (ankle or wrist) with a bend `side`, or fixed directions `a1` and `a2`. `foot` and `hand` set the end direction.
- The far hip sits 3 px behind the near hip (`farHip`). The far shoulder sits 4 px behind (`farShoulder`).

Helpers in `common.ts`:

| Helper | Use |
| --- | --- |
| `standLegs(x, farDx)` | Both feet flat on the ground. `farDx` shifts the far foot; use 0 for parallel feet. |
| `hipForShoulder(S, spine)` | Hip position that puts the shoulder joint at `S`. Use it when straight arms must reach a fixed bar. |
| `ARM_STRAIGHT` | Shoulder-to-wrist distance for a straight elbow. The elbow angle is very sensitive near full reach. |
| `GRIP_IN_HAND` | Wrist to the middle of the closed hand, where a bar sits. |
| `toesDown(h)` | Foot angle that keeps the toes on the ground with the ankle at height `h`. |
| `QUAD`, `kneelLeg`, `plantedArm` | Hands-and-knees base pose. |
| `handOnHip(dx)` | Standing arm with the hand on the hip. |

The shoulder joint `J.S` is not the top of the spine. It sits in front of and below the neck base, about 106 px above the hip when upright. Do not compute it by hand.

## Front-view rig

Source: `src/rig/front.ts`.

- World coordinates in px. X is lateral: +X is the figure's left, which is screen right. Y points up, and the ground is Y = 0. Z points toward the viewer.
- Standing pelvis: `[0, BODY.ankleH + about 182, 0]`. Hip joints sit `FB.hipHalf` (17) from the midline, and shoulder joints sit `FB.shoulderHalf` (33) from it.
- `hips`, `spine`, `neck` and `head` take a `Turn`: `pitch` bends forward toward the viewer, `roll` bends toward the figure's left, and `yaw` turns the face toward the figure's left.
- Limbs take a world `target`, an optional `pole` (the direction the knee or elbow points) and an optional `dir` (foot or hand direction). Use `toeDir` for feet.
- `shoulders` sets shoulder elevation (`up`) and protraction (`fwd`) in px.
- Glutes, hamstrings, triceps, the lower back and the upper back face away from the viewer. Give them a `region`, or leave them out.

## Equipment

Source: `src/exercises/equipment/`. Import from `@/exercises/equipment/index.ts`. Read the source of a helper for its parameters; do not guess them.

| Module | Content |
| --- | --- |
| `core.ts` | `workTL`, `weightStack`, `backrestAt`, `gripAt`, `dumbbell`, `gobletDumbbell`, `frontGripAt`, `frontDumbbell` |
| `free-weights.ts` | `barbell`, `ezBar`, `kettlebell`, `medicineBall`, `heldPlate`, `landmine`, `PLATE`, `BARBELL` |
| `benches.ts` | `flatBench`, `inclineBench`, `declineBench`, `preacherBench` |
| `stations.ts` | `pullUpBar`, `dipBars`, `plyoBox`, `aerobicStep`, `cableColumn`, `cableLine`, `cableHandle`, `smithRails` |
| `small.ts` | `stabilityBall`, `foamRoller`, `bandLine`, `bandCurve`, `sagPoints`, `miniBandPoints` |
| `machines.ts` | Parts for machines: `tube`, `pad`, `seatPad`, `rollerEnd`, `footPlate`, `leverArm`, `loadedPlates` and more |
| `place.ts` | `place` moves and rotates shapes; `shapesBox` measures them |

Static equipment goes in `props`. Equipment that moves goes in `dynamic`: a `rigid` part follows a point, a `line` is a cable, and a `curve` is a band or a rope. Set `propsBox` when the props reach beyond the figure, so that the animation stays centered.

## Timing

- Use `workTL(hold)` for a normal repetition: 1.0 s concentric, a short hold, 1.6 s eccentric and a short rest.
- Build other rhythms with `timeline([...])` from `src/math/timeline.ts`. A segment has a duration `d`, `from` and `to` progress values, and muscle effort `e: [start, end]`.
- The loop must be seamless: the pose at t = 0 equals the pose at t = 1.
- A repetition takes 2.5 to 4 s. Plyometric and cardio cycles take 0.6 to 1.5 s and may repeat inside one loop.
- A static stretch reaches the end position in 1.5 to 2 s, holds for 3 to 4 s and returns.
- Alternating exercises show both sides in one loop.
- Set `poster` when the default poster frame, which is the frame of highest effort, is not the most recognizable frame.

## Muscles

- Highlight the primary movers with scale 1 and one to three secondary muscles with scale 0.3 to 0.6.
- Keys: `quads`, `hamstrings`, `hipFlexor`, `calves`, `glutes`, `delts`, `triceps`, `biceps`, `pecs`, `abs`, `lats`, `upperBack`, `lowerBack`, `forearms`, `traps`, `neck`, `abductors`, `adductors`, `obliques`.
- For one-sided exercises, set `side` to the working limb.

## Accuracy

### Process

1. Read every source record of the item. Decide the start position, the end position, the joints that move, the points that stay fixed and the tempo.
2. Put fixed points into the pose as IK targets: feet on the ground, hands on the bar, the pelvis on the seat. Do not eyeball angles.
3. Run `family.ts` and fix every error and warning.
4. Run `inspect.ts` on every exercise. Compare the numbers with the reference table below. The exit code must be 0.
5. Open the review sheet image and check the list in "Visual review".

### Reference angles

Values are for adults with good form. `inspect.ts` prints these angles: 180 means a straight joint. In the side view, "hip" is the angle between the torso and the thigh, and "torso" is the lean from vertical.

| Position | Typical values |
| --- | --- |
| Standing | Knee and hip 175 to 180, torso 0 ± 3 |
| Squat, bottom at parallel | Knee 70 to 90, hip 60 to 80, torso 30 to 45 (back squat) or 15 to 30 (goblet or front squat), heels down |
| Conventional deadlift start | Knee 100 to 115, hip 45 to 60, torso 55 to 65, shoulders slightly ahead of the bar, elbows at least 172 |
| Romanian deadlift bottom | Knee 150 to 165, torso 70 to 85, bar below the knees |
| Lunge bottom | Both knees about 90, back knee 5 to 10 px above the floor, torso upright |
| Push-up bottom | Elbow 70 to 90, body straight (hip 170 to 180), chest near the floor |
| Bench press | Bottom: elbow 75 to 90, bar on the lower chest. Top: elbow at least 170 |
| Overhead press top | Shoulder 165 to 180, elbow at least 170 |
| Biceps curl | Bottom: elbow 160 to 175. Top: elbow 35 to 50. The upper arm stays still unless the variation moves it |
| Overhead triceps extension | Upper arm near vertical (shoulder 160 to 175). Elbow from about 45 to at least 165 |
| Bent-over row | Torso 45 to 70 and fixed. End: elbow 70 to 100, elbow behind the torso |
| Pull-up and pulldown | Top: elbow at least 165. Bottom: elbow 60 to 80, chin over the bar or bar at the upper chest |
| Lateral raise top | Shoulder elevation 80 to 90, plane 10 to 30 (front view), elbow 155 to 170 |
| Calf raise top | Ankle lift 15 to 25 px, knees straight |
| Hip thrust and glute bridge top | Hip 170 to 180, knee about 90 for the hip thrust |
| Forearm plank | Hip 170 to 180, elbows about 90 and under the shoulders |
| Leg extension | Knee from 85 to 95 up to 170 to 180 |
| Lying leg curl | Knee from about 170 down to 60 to 80 |

For movements that the table does not cover, find the joint angles in the source instructions and in common coaching cues. Write the target values in the header comment.

### Contacts

- Standing feet stay flat: `inspect.ts` shows an ankle lift of 0, unless the movement raises the heels.
- When two hands hold one bar in the side view, offset the far wrist target by `sub(J.Sf, J.S)`. Both elbows then bend the same.
- For straight arms on a bar, derive the end heights from straight legs, `hipForShoulder` and `ARM_STRAIGHT`. Otherwise the IK runs out of reach.
- `family.ts` prints each IK warning message once. A long run of bad frames looks like one line there. Use `inspect.ts`.
- For lying, kneeling and seated positions, copy the body heights from a similar existing exercise: `glute-bridge`, `crunch`, `dead-bug`, `plank`, `push-up`, `chest-press`, `seated-row`, `leg-press` or `dumbbell-shoulder-press` in `src/exercises/`.

### Visual review

Open every sheet image of your exercises. Open the dark sheet (`--dark`) at least once. Check each exercise:

- A person who knows the exercise recognizes it from the poster frame.
- The equipment has the right type, size and position. The hands hold it, and it moves with them. Cables run from the pulley to the handle.
- Knees and elbows never bend backward. No limb passes through the floor, the equipment or the torso. The neck stays in line with the spine unless the cue says otherwise.
- The range of motion matches the reference table. The loop has no jump at the seam.
- The figure fits: `zoom` is 1.00 if possible and never below 0.8.

### Common defects

Automatic checks do not find these defects. `family.ts` and `inspect.ts` check only the floor, IK reach and compose warnings. Look for them in every review.

| Defect | Typical cause | Fix |
| --- | --- | --- |
| The torso lies on top of the legs, or the body folds through itself | A lying angle points the wrong way. For example, the spine points from the hip toward the feet | Check that the neck base lands where the shoulders should be. Derive the lying angle from the hip and neck positions |
| A segment swings through the floor, a bench or the body | `lerp(a, b)` between angles that differ by more than 180° takes the long way round, for example `lerp(160, -38)` | Write both ends on the same side of ±180°, for example `lerp(160, 322)` |
| The head stays flat, or tips back, while the trunk rises | `neck` and `head` are fixed numbers | Derive them from the thoracic angle, for example `neck: thoracic + 4` |
| The arms point behind the back or into the floor as the trunk moves | Arm angles `a1` and `a2` are absolute screen angles | Use a `target` in the torso frame, such as `add(J.B(0.8), mul(J.A(0.8), 24))`, and a `side` function |
| A held weight appears behind the torso | The sign of the `J.A` offset is wrong. `J.A` points out of the chest | Use a positive `J.A` offset for a weight in front of the chest |
| The hands are not on the bar, the handle or the dumbbell | The implement follows a fixed point, not the hand | Attach it with `gripAt(J, 'n')` |
| The body position does not match the source | For example, a prone raise on an incline bench drawn as a seated recline | Reread the source start position. Check the chest direction against the bench |

## Examples

| File | Shows |
| --- | --- |
| `hinge/barbell-deadlift.ts` | Side view, barbell, straight arms derived with `hipForShoulder`, far hand offset |
| `leg-extension/machine-leg-extension.ts` | Side view, machine built from `machines.ts` parts, moving lever |
| `lateral-raise/dumbbell-lateral-raise.ts` | Front view, dumbbells, arm reach kept constant in the scapular plane |
| `cardio/jumping-jack.ts` | Front view, jumping, fast cycle |
| `src/exercises/*.ts` | Course exercises: lying, kneeling, seated and machine poses |
