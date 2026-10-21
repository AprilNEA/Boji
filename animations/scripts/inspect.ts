// Measure one library exercise frame by frame, so an author can check the anatomy with numbers instead of guessing
// from a small render. It imports only the requested family.
// Usage: node --import tsx scripts/inspect.ts <family> <id> [--frames a,b,c] [--samples n]
//   --frames   frames to print (default: n evenly spaced frames plus the poster frame)
//   --samples  number of evenly spaced frames (default 8)
// Prints:
//   - IK: how many frames have IK warnings, and the first and last frame of each kind. compose() and
//     scripts/family.ts only print each distinct message once, so a long run of bad frames looks like one line there.
//   - A table of joint angles in degrees. 180 = straight. Side view: near (n) and far (f) limbs. Front view: the
//     figure's left (l) and right (r) limbs; the figure's left is on the right of the screen.
//   - The lowest joint relative to the ground, to catch limbs that sink into the floor.
//   - Side view: joint directions from src/rig/anatomy.ts over every frame: a thigh behind the torso line, a knee
//     bent backward, a bent neck or a kinked spine. These catch a torso folded onto the legs and a figure drawn
//     supine instead of prone, which the unsigned angles in the table cannot show.
// Exit code 1 when any frame has an IK warning, a joint more than 2 px below the ground, or an anatomy issue.
import { compose, FPS } from '@/compose/index.ts';
import type { Exercise, FrontExercise, SideExercise } from '@/exercise.ts';
import { loadFamily } from '@/exercises/library/load.ts';
import { solveFront } from '@/rig/front.ts';
import { parseArgs } from 'node:util';
import { vec2, vec3 } from 'gl-matrix';
import { ang, D2R, sub, type Vec2 } from '@/math/vec2.ts';
import { IK_WARNINGS } from '@/rig/ik.ts';
import { anatomyIssues } from '@/rig/anatomy.ts';
import { dot3, mul3, sub3, type Vec3 } from '@/math/vec3.ts';
import { posterFrame } from '@/build/poster.ts';
import { BODY, GROUND, solve } from '@/rig/side.ts';

const USAGE = 'usage: node --import tsx scripts/inspect.ts <family> <id> [--frames a,b,c] [--samples n]';
const parseCli = () => parseArgs({ allowPositionals: true, options: { frames: { type: 'string' }, samples: { type: 'string', default: '8' } } });
let cli: ReturnType<typeof parseCli>;
try { cli = parseCli(); } catch (e) { console.error(`${(e as Error).message}\n${USAGE}`); process.exit(2); }
const framesArg = cli.values.frames;
const samples = Number(cli.values.samples);
const [family, id] = cli.positionals;
if (!family || !id) {
  console.error(USAGE);
  process.exit(2);
}
const ex = (await loadFamily(family, [id])).find((e) => e.id === id);
if (!ex) {
  console.error(`no exercise "${id}" in family "${family}"`);
  process.exit(2);
}

const N = Math.round(ex.tl.total * FPS);
const poster = posterFrame(ex, N);
const frames = framesArg
  ? framesArg.split(',').map(Number)
  : [...new Set([...Array.from({ length: samples }, (_, i) => Math.round((i * N) / samples)), poster])].sort((a, b) => a - b);

/** Angle at b between the segments to a and c, in degrees. */
const angle2 = (a: Vec2, b: Vec2, c: Vec2): number => vec2.angle(sub(a, b), sub(c, b)) / D2R;
const angle3 = (a: Vec3, b: Vec3, c: Vec3): number => vec3.angle(sub3(a, b), sub3(c, b)) / D2R;
const f0 = (x: number): string => x.toFixed(0);
/** Approximate skull radius below the head center; the rig has no exact constant. */
const HEAD_R_APPROX = 20;

// IK warnings, frame by frame.
const kinds = new Map<string, { first: number; last: number; count: number }>();
let warnFrames = 0;
const view = ex.view ?? 'side';
for (let f = 0; f < N; f++) {
  IK_WARNINGS.length = 0;
  if (view === 'front') solveFront((ex as FrontExercise).pose(f / N));
  else solve((ex as SideExercise).pose(f / N));
  if (IK_WARNINGS.length) warnFrames++;
  for (const w of new Set(IK_WARNINGS.map((m) => m.replace(/dist=[0-9.]+/, 'dist=#')))) {
    const k = kinds.get(w);
    if (k) { k.last = f; k.count++; } else kinds.set(w, { first: f, last: f, count: 1 });
  }
}
IK_WARNINGS.length = 0;

// Anatomy issues, frame by frame (side view only). The key drops the number, so one kind is one line.
const anatomy = new Map<string, { first: number; last: number; count: number; max: number }>();
let anatomyFrames = 0;
if (view !== 'front') {
  for (let f = 0; f < N; f++) {
    const issues = anatomyIssues(solve((ex as SideExercise).pose(f / N)));
    if (issues.length) anatomyFrames++;
    for (const issue of issues) {
      const key = issue.replace(/ [0-9]+$/, ''), value = Number(issue.slice(issue.lastIndexOf(' ') + 1));
      const k = anatomy.get(key);
      if (k) { k.last = f; k.count++; k.max = Math.max(k.max, value); } else anatomy.set(key, { first: f, last: f, count: 1, max: value });
    }
  }
}

const c = compose(ex as Exercise, 'light');
console.log(`${ex.id}  ${ex.name}  view ${view}  ${N} frames  poster ${poster}  zoom ${c.zoom.toFixed(2)}`);
console.log(`IK: ${warnFrames} of ${N} frames have warnings`);
for (const [w, k] of kinds) console.log(`  ${w}  frames ${k.first}-${k.last} (${k.count})`);
const other = c.warnings.filter((w) => !w.includes('unreachable'));
for (const w of other) console.log(`  compose: ${w}`);
if (view !== 'front') {
  console.log(`anatomy: ${anatomyFrames} of ${N} frames have issues`);
  for (const [w, k] of anatomy) console.log(`  ${w} up to ${k.max} deg  frames ${k.first}-${k.last} (${k.count})`);
}

let lowest = -Infinity;
if (view === 'front') {
  const fe = ex as FrontExercise;
  console.log('frame | knee l/r | hip elev l/r @plane | elbow l/r | shoulder elev l/r @plane | torso lean | ankle Y l/r');
  for (const f of frames) {
    const J = solveFront(fe.pose(f / N));
    // Elevation: angle between the bone and the body's down axis (0 = hanging, 90 = horizontal, 180 = overhead).
    // Plane: direction of the elevation around the body (0 = straight out to the side, 90 = forward, -90 = back).
    const elev = (from: Vec3, to: Vec3, b: { L: Vec3; U: Vec3; F: Vec3 }, sign: number) => {
      const d = sub3(to, from);
      const e = vec3.angle(d, mul3(b.U, -1)) / D2R;
      const plane = ang([sign * dot3(d, b.L), dot3(d, b.F)]);
      return `${f0(e)}${e >= 10 ? '@' + f0(plane) : ''}`;
    };
    const side = (s: 'l' | 'r') => {
      const sign = s === 'l' ? 1 : -1;
      return {
        knee: f0(angle3(J[`hip_${s}`], J[`knee_${s}`], J[`ankle_${s}`])),
        hip: elev(J[`hip_${s}`], J[`knee_${s}`], J.hips, sign),
        elbow: f0(angle3(J[`shoulder_${s}`], J[`elbow_${s}`], J[`wrist_${s}`])),
        shoulder: elev(J[`shoulder_${s}`], J[`elbow_${s}`], J.chest, sign),
        ankle: J[`ankle_${s}`][1].toFixed(1),
      };
    };
    const L = side('l'), R = side('r');
    const up = sub3(J.N, J.pelvis);
    const lean = ang([up[1], up[0]]);
    for (const k of ['knee', 'ankle', 'wrist', 'elbow', 'toe', 'tip'] as const) for (const s of ['l', 'r'] as const) lowest = Math.max(lowest, -J[`${k}_${s}`][1]);
    console.log(`${String(f).padStart(5)} | ${L.knee}/${R.knee} | ${L.hip} / ${R.hip} | ${L.elbow}/${R.elbow} | ${L.shoulder} / ${R.shoulder} | ${f0(lean)} | ${L.ankle}/${R.ankle}`);
  }
  console.log('front: knee and elbow 180 = straight. elev = angle from the body down axis (0 = hanging, 90 = horizontal, 180 = overhead); @plane = direction (0 = out to the side, 90 = forward, -90 = back), shown when elev >= 10. Hips use the pelvis axes, shoulders the chest axes. torso lean + = toward screen right (the figure\'s left). ankle Y = ankle height above the ground (standing ' + BODY.ankleH + ')');
} else {
  const se = ex as SideExercise;
  console.log('frame | knee n/f | hip n/f (torso vs thigh) | elbow n/f | shoulder n/f (arm vs torso) | torso | ankle lift n/f | wrist n');
  for (const f of frames) {
    const J = solve(se.pose(f / N));
    const torsoUp = J.N;
    const row = (s: 'n' | 'f') => {
      const H = s === 'n' ? J.H : J.Hf, S = s === 'n' ? J.S : J.Sf;
      const below: Vec2 = [S[0] - (J.N[0] - J.H[0]), S[1] - (J.N[1] - J.H[1])];
      return {
        knee: angle2(H, J[`knee_${s}`], J[`ankle_${s}`]),
        hip: angle2(torsoUp, H, J[`knee_${s}`]),
        elbow: angle2(S, J[`elbow_${s}`], J[`wrist_${s}`]),
        shoulder: angle2(below, S, J[`elbow_${s}`]),
        lift: GROUND - BODY.ankleH - J[`ankle_${s}`][1],
      };
    };
    const n = row('n'), fr = row('f');
    // Torso: direction from the hip to the neck base, 0 = upright, + = leaning forward (toward screen right).
    const torso = ang([J.H[1] - J.N[1], J.N[0] - J.H[0]]);
    for (const k of ['knee', 'ankle', 'elbow', 'wrist'] as const) for (const s of ['n', 'f'] as const) lowest = Math.max(lowest, J[`${k}_${s}`][1] - GROUND);
    lowest = Math.max(lowest, J.H[1] - GROUND, J.headCenter[1] + HEAD_R_APPROX - GROUND);
    console.log(`${String(f).padStart(5)} | ${f0(n.knee)}/${f0(fr.knee)} | ${f0(n.hip)}/${f0(fr.hip)} | ${f0(n.elbow)}/${f0(fr.elbow)} | ${f0(n.shoulder)}/${f0(fr.shoulder)} | ${f0(torso)} | ${n.lift.toFixed(1)}/${fr.lift.toFixed(1)} | ${J.wrist_n.map((v) => v.toFixed(0)).join(',')}`);
  }
  console.log('side: hip = angle between torso and thigh (180 = straight, 90 = seated), shoulder = arm away from the torso line (0 = arm along the side, 90 = forward or back, 180 = overhead), torso + = leaning toward screen right, ankle lift = ankle above standing height');
}
console.log(`lowest joint: ${lowest.toFixed(1)} px ${lowest > 0 ? 'below' : 'above'} the ground (joint centers; limbs have thickness)`);
process.exit(warnFrames > 0 || lowest > 2 || anatomyFrames > 0 ? 1 : 0);
