// Front-view lateral-lunge builders. The working hip shifts over the bent knee while the other foot stays planted.
// The bar remains across the upper back or the plate stays in front of the chest throughout the repetition.
// Standard bottoms use a roughly 80° working knee. Cossack bottoms go lower. The trailing leg stays nearly straight and both feet stay flat.
import type { FrontExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { smooth, timeline } from '@/math/timeline.ts';
import { add3 } from '@/math/vec3.ts';
import { project, toeDir, type FSide, type FrontJoints, type FrontPose } from '@/rig/front.ts';
import { BODY } from '@/rig/side.ts';
import { barbell, frontGripAt, heldPlate, workTL } from '@/exercises/equipment/index.ts';

type Side = FSide;
type Load = 'barbell' | 'plate';

interface LungeConfig {
  id: string;
  name: string;
  en: string;
  sources: string[];
  load: Load;
  /** `step` leaves one foot planted and steps the working foot wide; `fixed` keeps the wide stance. */
  stance: 'step' | 'fixed';
  /** A fixed-stance exercise works one side, while an alternating exercise demonstrates both sides. */
  alternate: boolean;
  /** The Cossack uses a clearly deeper lateral squat than a standard side split squat. */
  depth?: 'standard' | 'cossack';
  /** Each source specifies how far the feet turn away from the midline. */
  toeOut?: number;
}

const REP = { down: 1, hold: 0.35, up: 1.6, rest: 0.45 };
const REP_TOTAL = REP.down + REP.hold + REP.up + REP.rest;
const ALTERNATING_TL = timeline([
  { d: REP.down, from: 0, to: 1, e: [0.35, 1] },
  { d: REP.hold, from: 1, to: 1, e: [1, 0.9] },
  { d: REP.up, from: 1, to: 0, e: [0.85, 0.4] },
  { d: REP.rest, from: 0, to: 0, e: [0.4, 0.3] },
  { d: REP.down, from: 0, to: 1, e: [0.35, 1] },
  { d: REP.hold, from: 1, to: 1, e: [1, 0.9] },
  { d: REP.up, from: 1, to: 0, e: [0.85, 0.4] },
  { d: REP.rest, from: 0, to: 0, e: [0.4, 0.3] },
]);

const progress = (x: number): number => {
  if (x <= REP.down) return smooth(x / REP.down);
  if (x <= REP.down + REP.hold) return 1;
  if (x <= REP.down + REP.hold + REP.up) return 1 - smooth((x - REP.down - REP.hold) / REP.up);
  return 0;
};

function activeProgress(t: number, alternate: boolean): Record<Side, number> {
  if (!alternate) return { l: 0, r: workTL(REP.hold).at(t).p };
  const x = t * ALTERNATING_TL.total;
  return x < REP_TOTAL ? { l: 0, r: progress(x) } : { l: progress(x - REP_TOTAL), r: 0 };
}

/** Target coordinates for a shoulder-width stance that becomes a true step-out lateral lunge. */
function steppingPose(p: Record<Side, number>): { pelvis: [number, number, number]; feet: Record<Side, number> } {
  const pr = p.r, pl = p.l;
  // At the bottom, the pelvis is directly over the stepping foot. The planted trailing leg is 183 px long.
  const shift = -111.4 * pr + 111.4 * pl;
  const drop = 60 * Math.max(pr, pl);
  return {
    pelvis: [shift, BODY.ankleH + 182 - drop, 0],
    feet: { r: lerp(-43, -120, pr), l: lerp(43, 120, pl) },
  };
}

/** Target coordinates for a wide, fixed stance side split squat. */
function fixedPose(p: Record<Side, number>, depth: 'standard' | 'cossack'): { pelvis: [number, number, number]; feet: Record<Side, number> } {
  // Feet stay 150 px apart. A Cossack uses a lower hip and a larger lateral shift than a side split squat.
  const active = Math.max(p.r, p.l);
  const cossack = depth === 'cossack';
  const shift = cossack ? 103 : 83;
  const bottomHeight = cossack ? 89 : 118;
  return {
    pelvis: [-shift * p.r + shift * p.l, lerp(BODY.ankleH + 174.5, BODY.ankleH + bottomHeight, active), 0],
    feet: { r: -75, l: 75 },
  };
}

function kneePole(s: Side): [number, number, number] {
  // A mostly depth-directed pole preserves an anatomically forward knee bend; the small lateral component keeps the bend legible.
  return [s === 'l' ? 0.12 : -0.12, 0, 1];
}

function outwardFoot(s: Side, degrees: number): [number, number, number] {
  const radians = (degrees * Math.PI) / 180;
  const sign = s === 'l' ? 1 : -1;
  return toeDir([sign * Math.sin(radians), 0, Math.cos(radians)]);
}

function barArms(): FrontPose['arms'] {
  const hand = (s: Side) => (J: FrontJoints) => add3(J.B(0.9), [s === 'l' ? 62 : -62, 0, -55]);
  return {
    // Hands stay close to the neck. Elbows point down and slightly back instead of reaching to the bar ends.
    l: { target: hand('l'), pole: [0.08, -1, -1] },
    r: { target: hand('r'), pole: [-0.08, -1, -1] },
  };
}

function plateArms(): FrontPose['arms'] {
  const hand = (s: Side) => (J: FrontJoints) => add3(J.B(0.65), [s === 'l' ? 29 : -29, 0, 80]);
  return {
    l: { target: hand('l'), pole: [0.35, -0.15, -1] },
    r: { target: hand('r'), pole: [-0.35, -0.15, -1] },
  };
}

function pose(config: LungeConfig, t: number): FrontPose {
  const p = activeProgress(t, config.alternate);
  const base = config.stance === 'step' ? steppingPose(p) : fixedPose(p, config.depth ?? 'standard');
  const toeOut = config.toeOut ?? 10;
  return {
    pelvis: base.pelvis,
    // Chest remains high and square over the moving pelvis.
    hips: { pitch: 2 }, spine: { pitch: -1 }, head: { pitch: -2 },
    legs: {
      l: { target: [base.feet.l, BODY.ankleH, 3], pole: kneePole('l'), dir: outwardFoot('l', toeOut) },
      r: { target: [base.feet.r, BODY.ankleH, 3], pole: kneePole('r'), dir: outwardFoot('r', toeOut) },
    },
    arms: config.load === 'barbell' ? barArms() : plateArms(),
  };
}

const rearGlute = (side: Side, mirror = false) => ({
  view: 'front' as const,
  part: 'pelvis' as const,
  c: [side === 'l' ? 24 : -24, 8] as [number, number],
  s: [22, 17] as [number, number],
  mirror,
});

export function lateralLunge(config: LungeConfig): FrontExercise {
  const tl = config.alternate ? ALTERNATING_TL : workTL(REP.hold);
  const working: Side = 'r';
  return {
    id: config.id,
    name: config.name,
    view: 'front',
    tl,
    meta: {
      en: config.en,
      family: 'lateral-lunge',
      equipment: config.load === 'barbell' ? ['barbell'] : ['other', 'plate'],
      sources: config.sources,
    },
    muscles: config.load === 'plate'
      ? [
        { m: 'glutes', region: rearGlute('r', true) },
        { m: 'quads', side: 'both', scale: 0.9 },
        { m: 'adductors', side: 'both', scale: 0.45 },
      ]
      : [
        { m: 'quads', side: config.alternate ? 'both' : working },
        { m: 'glutes', side: config.alternate ? 'both' : working, scale: 0.65, region: rearGlute(working, config.alternate) },
        { m: 'calves', side: config.alternate ? 'both' : working, scale: 0.35 },
      ],
    dynamic: config.load === 'barbell'
      ? [barbell({ view: 'front', plate: 'medium', z: 'underNearArm', at: (J) => ({ p: project(J.B(0.9)) }) })]
      : [heldPlate((J) => {
        const l = frontGripAt(J, 'l'), r = frontGripAt(J, 'r');
        return { p: [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2] };
      }, 'face', 'medium', 'underNearArm', 'Chest Plate')],
    // The first bottom hold is the clearest frame for a lateral lunge.
    poster: (REP.down + REP.hold / 2) / (config.alternate ? ALTERNATING_TL.total : tl.total),
    pose: (t) => pose(config, t),
  };
}
