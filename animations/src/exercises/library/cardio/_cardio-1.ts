import type { FrontPose, FSide } from '@/front-rig.ts';
import { toeDir } from '@/front-rig.ts';
import type { Palette } from '@/palettes.ts';
import type { Props } from '@/exercise.ts';
import { add, lerp, timeline, type Vec2 } from '@/math.ts';
import { add3, type Vec3 } from '@/math3.ts';
import { BODY, type LimbSpec, type Pose } from '@/rig.ts';
import { A, G, hipForShoulder, standLegs, toesDown } from '@/exercises/common.ts';

export const TAU = Math.PI * 2;
/** Constant full-effort timing for continuous, cyclic cardio drills. */
export const cardioTL = (total: number) => timeline([{ d: total, from: 0, to: 0, ease: 'linear', e: [1, 1] }]);
export const sign: Record<FSide, number> = { l: 1, r: -1 };

/** A stationary upright stance with relaxed, bent arms. */
export function sideStandPose(): Pose {
  return {
    hip: [250, G - A - 184], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    farHip: 0, legs: standLegs(250, 0),
    arms: {
      near: { target: (J) => add(J.S, [18, 102]), side: [-1, 0] },
      far: { target: (J) => add(J.Sf, [-14, 102]), side: [-1, 0] },
    },
  };
}

/** Alternating side-view running gait. The swing foot lifts and travels forward while the other foot contacts the ground. */
export function sideRunPose(t: number, options: { stride?: number; lift?: number; lean?: number; hipY?: number; forefoot?: number } = {}): Pose {
  const stride = options.stride ?? 30;
  const lift = options.lift ?? 28;
  const lean = options.lean ?? -78;
  const forefoot = options.forefoot ?? 0;
  const theta = TAU * t;
  const c = Math.cos(theta), s = Math.sin(theta);
  const hn = lift * Math.max(0, s), hf = lift * Math.max(0, -s);
  const hipY = options.hipY ?? G - A - 174;
  // A positive forefoot value keeps the toe planted and the heel lifted. A swinging foot retains that shape while it clears the floor.
  const leg = (x: number, h: number): LimbSpec => ({
    target: [x, G - A - forefoot - h], side: [1, 0], foot: forefoot > 0 ? toesDown(A + forefoot) : h > 2 ? 28 : 0,
  });
  return {
    hip: [250, hipY + 2 * Math.abs(s)], spine: { lumbar: lean, thoracic: lean - 2 }, neck: lean - 5, head: lean - 2,
    farHip: 0,
    legs: { near: leg(250 - stride * c, hn), far: leg(250 + stride * c, hf) },
    arms: {
      near: { target: (J) => add(J.S, [28 * c, 92 + 8 * Math.abs(c)]), side: [-1, 0] },
      far: { target: (J) => add(J.Sf, [-28 * c, 92 + 8 * Math.abs(c)]), side: [-1, 0] },
    },
  };
}

/** Front-view running gait with alternating knee lift and opposite arm swing. */
export function frontRunPose(t: number, options: { lift?: number; spread?: number } = {}): FrontPose {
  const theta = TAU * t;
  const c = Math.cos(theta), s = Math.sin(theta);
  const lift = options.lift ?? 42;
  const spread = options.spread ?? 21;
  const h: Record<FSide, number> = { l: lift * Math.max(0, s), r: lift * Math.max(0, -s) };
  const x: Record<FSide, number> = { l: spread + 8 * c, r: -spread + 8 * c };
  const leg = (side: FSide) => ({ target: [x[side], BODY.ankleH + h[side], 7] as Vec3, dir: toeDir([0, 0, 1]) });
  return {
    pelvis: [0, BODY.ankleH + 182, 0], hips: { pitch: 4 }, spine: { pitch: -2 }, head: { pitch: -3 },
    legs: { l: leg('l'), r: leg('r') },
    arms: {
      l: { target: (J) => add3(J.shoulder_l, [20, -84, -30 * c]) },
      r: { target: (J) => add3(J.shoulder_r, [-20, -84, 30 * c]) },
    },
  };
}

/** Fast scissor jump: the feet exchange lateral positions while they are airborne. */
export function frontScissorPose(t: number): FrontPose {
  const theta = TAU * t;
  const p = (1 - Math.cos(theta)) / 2;
  const h = 24 * Math.sin(theta) ** 2;
  const x = lerp(18, -18, p);
  return {
    // The hips rise with the feet, so the crossed position reads as a jump rather than a ground shuffle.
    // Keep a small knee bend at landing so the rig remains inside the full leg reach limit.
    pelvis: [0, BODY.ankleH + 178 - h * 0.35, 0],
    legs: {
      l: { target: [x, BODY.ankleH + h, 8], dir: toeDir([0, 0, 1]) },
      r: { target: [-x, BODY.ankleH + h, 0], dir: toeDir([0, 0, 1]) },
    },
    arms: {
      l: { target: (J) => add3(J.shoulder_l, [18, -82, -25 * Math.cos(theta)]) },
      r: { target: (J) => add3(J.shoulder_r, [-18, -82, 25 * Math.cos(theta)]) },
    },
  };
}

/** Wall-supported sprinting: shoulders and hands stay fixed while the knees switch. */
export function wallRunPose(t: number, options: { high?: number; lean?: number; shoulder?: Vec2 } = {}): Pose {
  const theta = TAU * t;
  const s = Math.sin(theta);
  const high = options.high ?? 84;
  const lean = options.lean ?? -45;
  const spine = { lumbar: lean, thoracic: lean };
  // At this shoulder position the hands are almost one arm length away on the wall.
  // The resulting trunk line is close to the 45° lean requested by the sprint drill.
  const shoulder = options.shoulder ?? [296, 225];
  const leg = (active: number, far = false): LimbSpec => {
    const h = high * Math.max(0, active);
    return { target: [far ? 238 : 270, G - A - h], side: [1, 0], foot: h > 2 ? 30 : 0 };
  };
  return {
    hip: hipForShoulder(shoulder, spine), spine, neck: -47, head: -45, farHip: 0,
    legs: { near: leg(s), far: leg(-s, true) },
    arms: {
      near: { target: [420, 220], side: [-1, 0], hand: 0 },
      far: { target: [416, 238], side: [-1, 0], hand: 0 },
    },
  };
}

export function wallProps(pal: Palette): Props {
  return { back: [{ kind: 'box', nm: 'wall', color: pal.prop, c: [438, 252], s: [34, 390], r: 4 }] };
}

export function coneProps(pal: { accent: string; propDark: string }): Props {
  return {
    back: [
      { kind: 'poly', nm: 'cone-body', color: pal.accent, pts: [[269, 434], [291, 434], [280, 366]] },
      { kind: 'box', nm: 'cone-base', color: pal.propDark, c: [280, 440], s: [42, 8], r: 3 },
    ],
  };
}

export function trailProps(pal: { prop: string; propDark: string }): Props {
  return { back: [{ kind: 'poly', nm: 'trail', color: pal.prop, pts: [[70, 446], [445, 446], [445, 424], [70, 462]] }, { kind: 'poly', nm: 'trail-edge', color: pal.propDark, pts: [[70, 454], [445, 416], [445, 424], [70, 462]] }] };
}
