// Private pose builders for core-flexion-1. Each builder keeps the contact points fixed and changes only the joints that
// define the exercise. Floor bodies use the existing course-animation heights so the mat, knees and head stay visible.
import type { LibraryMeta, SideExercise } from '@/exercise.ts';
import { add, ang, clamp, dir, lerp, mul, type Vec2 } from '@/math/vec2.ts';
import { smooth, timeline, type Timeline } from '@/math/timeline.ts';
import type { Joints, Pose } from '@/rig/side.ts';
import { A, FLOOR } from '@/exercises/common.ts';
import { bandLine, barbell, declineBench, flatBench, gripAt, workTL } from '@/exercises/equipment/index.ts';

type Base = { id: string; name: string; meta: LibraryMeta; muscles?: SideExercise['muscles'] };
export const REP = workTL(0.45);

const NECK: Vec2 = [145, FLOOR - 18];
const HIP = add(NECK, mul(dir(-3.8), 123.7));
const ANKLE: Vec2 = [HIP[0] + 106, FLOOR - A];
const FLAT = -176.2;
const pair = <T>(near: T, far: T): { near: T; far: T } => ({ near, far });
const sideArms = () => pair({ a1: 8, a2: 1, hand: 0 }, { a1: 7, a2: 0, hand: 0 });
/** Fingertips behind the head, elbows open. Targets use the torso frame, so the hands stay at the head as the trunk rises. */
const headArms = (): Pose['arms'] => pair(
  { target: (J: Joints) => add(add(J.N, mul(J.T(1), 38)), mul(J.A(1), -17)), side: (J: Joints) => J.A(1), hand: (J: Joints) => ang(J.T(1)) },
  { target: (J: Joints) => add(add(J.N, mul(J.T(1), 36)), mul(J.A(1), -20)), side: (J: Joints) => J.A(1), hand: (J: Joints) => ang(J.T(1)) },
);
/** Forearms crossed on the chest. The elbows point toward the hips. */
const crossArms = (): Pose['arms'] => pair(
  { target: (J: Joints) => add(J.B(0.74), mul(J.A(0.74), 26)), side: (J: Joints) => mul(J.T(0.74), -1) },
  { target: (J: Joints) => add(J.B(0.8), mul(J.A(0.8), 24)), side: (J: Joints) => mul(J.T(0.8), -1) },
);
/** Bar or band handles at the upper chest. q = 1 raises them straight above the shoulders. */
const chestToOverhead = (q: number): Pose['arms'] => {
  const at = (J: Joints, sh: Vec2, dx: number): Vec2 => {
    const chest = add(J.B(0.8), mul(J.A(0.8), 24 + dx));
    const over: Vec2 = [sh[0] + dx, sh[1] - 120];
    return [lerp(chest[0], over[0], q), lerp(chest[1], over[1], q)];
  };
  return pair(
    { target: (J: Joints) => at(J, J.S, 0), side: (J: Joints) => mul(J.T(0.8), -1), hand: -90 },
    { target: (J: Joints) => at(J, J.Sf, -3), side: (J: Joints) => mul(J.T(0.8), -1), hand: -90 },
  );
};

/** Neck and head follow the thoracic angle. At FLAT they equal 182 and 181, the original lying values. */
function supineBase(spine: Pose['spine'], arms: Pose['arms'], legs: Pose['legs'], hip: Vec2 = HIP): Pose {
  const th = 'thoracic' in spine ? spine.thoracic : FLAT;
  return { hip, spine, neck: th + 358.2, head: th + 357.2, legs, arms };
}

/** A full sit-up: feet stay on the mat while the trunk travels from flat to a controlled 45° curl. */
export function floorSitUp(base: Base, opts: { arms?: 'head' | 'cross' | 'side'; eccentric?: boolean; anchor?: boolean } = {}): SideExercise {
  const tl: Timeline = opts.eccentric
    ? timeline([{ d: 1.0, from: 0, to: 1, e: [0.3, 0.9] }, { d: 0.35, from: 1, to: 1, e: [0.9, 0.9] }, { d: 2.4, from: 1, to: 0, e: [0.85, 0.25] }, { d: 0.35, from: 0, to: 0, e: [0.25, 0.2] }])
    : REP;
  return {
    ...base, tl, mat: true,
    props: opts.anchor ? (pal) => ({ back: [
      { kind: 'box', nm: 'foot-anchor-bar', color: pal.metalDark, c: [ANKLE[0] + 15, FLOOR - A - 21], s: [42, 8], r: 3 },
      { kind: 'box', nm: 'foot-anchor-post', color: pal.metalDark, c: [ANKLE[0] + 31, FLOOR - A - 10], s: [7, 25], r: 2 },
    ] }) : undefined,
    pose(t) {
      const p = tl.at(t).p;
      const arms = opts.arms === 'cross' ? crossArms() : opts.arms === 'side' ? sideArms() : headArms();
      return supineBase(
        { lumbar: lerp(FLAT, -142, p), thoracic: lerp(FLAT, -132, p) }, arms,
        pair({ target: ANKLE, foot: 0, side: [0, -1] }, { target: add(ANKLE, [-5, 0]), foot: 0, side: [0, -1] }),
      );
    },
  };
}

/** Small upper-back curl. The pelvis and both feet remain on the mat throughout the repetition. */
export function floorCrunch(base: Base, opts: { hands?: 'head' | 'side'; eccentric?: boolean } = {}): SideExercise {
  const tl: Timeline = opts.eccentric
    ? timeline([{ d: 1, from: 0, to: 1, e: [0.25, 1] }, { d: 0.4, from: 1, to: 1, e: [1, 0.95] }, { d: 2.5, from: 1, to: 0, e: [0.9, 0.2] }, { d: 0.3, from: 0, to: 0, e: [0.2, 0.2] }])
    : REP;
  return {
    ...base, tl, mat: true,
    pose(t) {
      const p = tl.at(t).p;
      return supineBase(
        { lumbar: FLAT - 1, thoracic: FLAT + 31 * p }, opts.hands === 'side' ? sideArms() : headArms(),
        pair({ target: ANKLE, foot: 0, side: [0, -1] }, { target: add(ANKLE, [-5, 0]), foot: 0, side: [0, -1] }),
      );
    },
  };
}

/** V-up with straight or bent legs. The start is flat; the end joins the torso and knees/toes above the hips. */
export function floorVUp(base: Base, opts: { bent?: boolean; band?: boolean; alternating?: boolean } = {}): SideExercise {
  const tl = opts.alternating ? timeline([
    { d: 0.9, from: 0, to: 1, e: [0.25, 1] }, { d: 0.25, from: 1, to: 1, e: [1, 0.9] },
    { d: 0.9, from: 1, to: 0, e: [0.8, 0.3] }, { d: 0.2, from: 0, to: 0, e: [0.3, 0.25] },
  ]) : REP;
  const topLeg = (p: number, far: boolean) => {
    const shift = opts.alternating && far ? 7 * Math.sin(Math.PI * p) : 0;
    if (opts.bent) return { a1: lerp(-50, -145 + shift, p), a2: lerp(50, -15 + shift, p), foot: lerp(0, -15, p) };
    return { a1: lerp(4 + shift, -55 + shift, p), a2: lerp(4 + shift, -55 + shift, p), foot: lerp(0, -55 + shift, p) };
  };
  return {
    ...base, tl, mat: true,
    dynamic: opts.band ? [bandLine<Joints>((J) => [gripAt(J, 'f'), gripAt(J, 'n')])] : undefined,
    pose(t) {
      const p = tl.at(t).p;
      // In the closed position the hands reach forward at shoulder height. Downward arm angles would put
      // the wrists through the mat as the torso curls, so both bands and unweighted versions use this path.
      const arms: Pose['arms'] = pair(
        { target: (J: Joints) => add(J.S, [lerp(-105, 92, p), lerp(14, -38, p)]), side: [0, -1], hand: 0 },
        { target: (J: Joints) => add(J.Sf, [lerp(-105, 90, p), lerp(14, -36, p)]), side: [0, -1], hand: 2 },
      );
      return supineBase(
        { lumbar: lerp(FLAT, -135, p), thoracic: lerp(FLAT, -128, p) }, arms,
        pair(topLeg(p, false), topLeg(p, true)),
      );
    },
  };
}

/** Reverse crunch: knees draw in while the pelvis rolls away from the mat without neck pulling. */
export function reverseCrunch(base: Base, opts: { hipLift?: boolean } = {}): SideExercise {
  return {
    ...base, tl: REP, mat: true,
    pose(t) {
      const p = REP.at(t).p;
      const h: Vec2 = opts.hipLift ? [lerp(HIP[0], 244, p), lerp(HIP[1], 369, p)] : [lerp(HIP[0], 248, p), lerp(HIP[1], 383, p)];
      // Bottoms Up first tucks the knees, then lengthens the legs vertically as the pelvis leaves the mat.
      const legs = opts.hipLift && p <= 0.5
        ? pair({ a1: lerp(4, -145, p * 2), a2: lerp(4, -15, p * 2), foot: lerp(0, -15, p * 2) }, { a1: lerp(6, -142, p * 2), a2: lerp(6, -12, p * 2), foot: lerp(0, -12, p * 2) })
        : opts.hipLift
          ? pair({ a1: lerp(-145, -90, (p - 0.5) * 2), a2: lerp(-15, -90, (p - 0.5) * 2), foot: lerp(-15, -90, (p - 0.5) * 2) }, { a1: lerp(-142, -88, (p - 0.5) * 2), a2: lerp(-12, -88, (p - 0.5) * 2), foot: lerp(-12, -88, (p - 0.5) * 2) })
        : pair({ a1: lerp(-50, -145, p), a2: lerp(50, -15, p), foot: lerp(0, -15, p) }, { a1: lerp(-47, -142, p), a2: lerp(53, -12, p), foot: lerp(0, -12, p) });
      return supineBase({ target: NECK, side: [0, 1] }, sideArms(), legs, h);
    },
  };
}

/** Cocoon crunch: the straight body closes into a compact simultaneous torso-and-knee curl. */
export function cocoon(base: Base): SideExercise {
  return {
    ...base, tl: REP, mat: true,
    pose(t) {
      const p = REP.at(t).p;
      const arms: Pose['arms'] = pair(
        { target: (J: Joints) => add(J.S, [lerp(-105, 92, p), lerp(14, -38, p)]), side: [0, -1], hand: 0 },
        { target: (J: Joints) => add(J.Sf, [lerp(-105, 90, p), lerp(14, -36, p)]), side: [0, -1], hand: 2 },
      );
      return supineBase(
        { lumbar: lerp(FLAT, -138, p), thoracic: lerp(FLAT, -128, p) },
        arms,
        pair({ a1: lerp(4, -145, p), a2: lerp(4, -15, p), foot: lerp(0, -15, p) }, { a1: lerp(6, -142, p), a2: lerp(6, -12, p), foot: lerp(0, -12, p) }),
      );
    },
  };
}

/** Flat-bench leg work. The shoulders remain on the pad and the legs clear the bench end. */
export function flatBenchLegs(base: Base, opts: { tuck?: boolean } = {}): SideExercise {
  const bench = flatBench({ view: 'side', x: 255, top: 99 });
  return {
    ...base, tl: REP,
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
    pose(t) {
      const p = REP.at(t).p;
      const leg = opts.tuck
        ? { a1: lerp(4, -145, p), a2: lerp(4, -15, p), foot: lerp(0, -15, p) }
        : { a1: lerp(4, -90, p), a2: lerp(4, -90, p), foot: lerp(0, -90, p) };
      return {
        hip: [245, bench.seatY - 10], spine: { lumbar: 176, thoracic: 176 }, neck: 178, head: 178,
        legs: pair(leg, { ...leg, a1: leg.a1 + 2, a2: leg.a2 + 2 }),
        arms: pair({ a1: 45, a2: 55, hand: 55 }, { a1: 43, a2: 53, hand: 53 }),
      };
    },
  };
}

/** Seated bench exercises: hands hold the edges, with the pelvis staying on the pad. */
export function seatedBench(base: Base, opts: { kind: 'raise' | 'tuck' | 'kickout'; barbell?: boolean }): SideExercise {
  const bench = flatBench({ view: 'side', x: 255, top: 90 });
  const hip: Vec2 = [208, bench.seatY - 36];
  const hand: Vec2 = [181, bench.seatY - 6];
  const tl = opts.barbell ? timeline([
    { d: 0.8, from: 0, to: 1, e: [0.25, 0.9] }, { d: 0.2, from: 1, to: 1, e: [0.9, 0.9] },
    { d: 0.8, from: 1, to: 2, e: [0.85, 0.25] }, { d: 0.8, from: 2, to: 3, e: [0.25, 0.9] },
    { d: 0.2, from: 3, to: 3, e: [0.9, 0.9] }, { d: 0.8, from: 3, to: 4, e: [0.85, 0.25] },
  ]) : REP;
  const leg = (p: number) => {
    // The bent start puts the sole on the floor from the 43 cm bench. The former 30°/150° pose left it floating.
    if (opts.kind === 'raise') return { a1: lerp(38, 0, p), a2: lerp(142, 0, p), foot: 0 };
    if (opts.kind === 'kickout') return { a1: lerp(38, 3, p), a2: lerp(142, 3, p), foot: 0 };
    return { a1: lerp(10, 20, p), a2: lerp(10, -150, p), foot: lerp(0, -150, p) };
  };
  return {
    ...base, tl,
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
    dynamic: opts.barbell ? [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }) })] : undefined,
    pose(t) {
      const phase = tl.at(t);
      const p = opts.barbell ? phase.p : phase.p;
      const nearP = opts.barbell ? (p <= 1 ? p : p <= 2 ? 2 - p : 0) : p;
      const farP = opts.barbell ? (p <= 2 ? 0 : p <= 3 ? p - 2 : 4 - p) : p;
      const l = leg(nearP), f = leg(farP);
      // A 26° recline keeps both bench-edge grips within arm reach while the spine remains neutral.
      const torso = opts.barbell ? -90 : opts.kind === 'tuck' ? lerp(-135, -116, p) : -116;
      return {
        hip, spine: { lumbar: torso, thoracic: torso - 2 }, neck: torso, head: torso,
        legs: pair(l, { ...f, a1: f.a1 + 2, a2: f.a2 + 2 }),
        arms: opts.barbell
          ? pair({ target: [262, bench.seatY - 27], side: [-1, 0], hand: 90 }, { target: [259, bench.seatY - 29], side: [-1, 0], hand: 90 })
          : pair({ target: hand, side: [-1, 0], hand: 90 }, { target: add(hand, [-3, 0]), side: [-1, 0], hand: 90 }),
      };
    },
  };
}

const DECLINE = declineBench({ x: 120, angle: 20, low: 80, length: 220 });
const DECLINE_HIP: Vec2 = [256, 292];
const declineLegs = (): Pose['legs'] => pair(
  { target: DECLINE.roller, side: [0, -1], foot: -20 },
  { target: add(DECLINE.roller, [-4, 2]), side: [0, -1], foot: -18 },
);
const declineArms = () => headArms();

/** Decline bench curl or sit-up. Ankles remain below the roller while the torso follows the pad or curls from it. */
export function declineCore(base: Base, opts: { kind: 'crunch' | 'situp'; band?: boolean } ): SideExercise {
  return {
    ...base, tl: REP,
    props: (pal) => ({ back: DECLINE.draw(pal) }), propsBox: DECLINE.box,
    dynamic: opts.band ? [
      bandLine<Joints>((J) => [[DECLINE.head[0] + 24, DECLINE.head[1] + 42], gripAt(J, 'n')]),
      bandLine<Joints>((J) => [[DECLINE.head[0] + 31, DECLINE.head[1] + 44], gripAt(J, 'f')]),
    ] : undefined,
    pose(t) {
      const p = REP.at(t).p;
      // The pad runs down toward the head at 160 degrees. Larger angles lift the trunk off the pad.
      const lumbar = opts.kind === 'crunch' ? 160 : lerp(160, 280, p);
      const thoracic = opts.kind === 'crunch' ? lerp(160, 208, p) : lerp(160, 288, p);
      const arms = opts.band
        // The handles stay at the collarbones. The upper arm points down and slightly back; the forearm returns
        // forward and upward, rather than dropping the hands through the bench.
        ? chestToOverhead(0)
        : declineArms();
      return { hip: DECLINE_HIP, spine: { lumbar, thoracic }, neck: thoracic + 6, head: thoracic + 8, legs: declineLegs(), arms };
    },
  };
}

/** Decline reverse crunch with hands fixed above the head on the bench and the pelvis rolling toward the chest. */
export function declineReverseCrunch(base: Base): SideExercise {
  return {
    ...base, tl: REP,
    props: (pal) => ({ back: DECLINE.draw(pal) }), propsBox: DECLINE.box,
    pose(t) {
      const p = REP.at(t).p;
      const hip: Vec2 = [lerp(DECLINE_HIP[0], 230, p), lerp(DECLINE_HIP[1], 295, p)];
      const leg = { a1: lerp(0, -145, p), a2: lerp(0, -15, p), foot: lerp(-20, -15, p) };
      return { hip, spine: { lumbar: 160, thoracic: 160 }, neck: 164, head: 165, legs: pair(leg, { ...leg, a1: leg.a1 + 2, a2: leg.a2 + 2 }), arms: declineArms() };
    },
  };
}

/** Forearm plank to pike. Toes and both forearms remain planted as the pelvis travels up and back. */
export function plankPike(base: Base): SideExercise {
  const ankle: Vec2 = [150, FLOOR - 41];
  const elbows = pair({ a1: 90, a2: 0, hand: 0 }, { a1: 90, a2: -2, hand: -2 });
  return {
    ...base, tl: REP, mat: true,
    pose(t) {
      const p = REP.at(t).p;
      const hip: Vec2 = [lerp(318, 253, p), lerp(351, 286, p)];
      return {
        hip, spine: { lumbar: lerp(-12, 42, p), thoracic: lerp(-14, 36, p) }, neck: lerp(-16, 30, p), head: lerp(-10, 28, p),
        legs: pair({ target: ankle, side: [0, 1], foot: 85 }, { target: add(ankle, [-2, 0]), side: [0, 1], foot: 85 }), arms: elbows,
      };
    },
  };
}

/** Barbell sit-up where the implement stays at the chest until the torso curl ends. */
export function barbellSitUp(base: Base, opts: { press?: boolean } = {}): SideExercise {
  return {
    ...base, tl: REP, mat: true,
    dynamic: [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose(t) {
      const p = REP.at(t).p;
      // The bar stays at the chest during the sit-up; the press finishes in the top third.
      const q = opts.press ? smooth(clamp((p - 0.6) / 0.4, 0, 1)) : 0;
      return supineBase(
        { lumbar: lerp(FLAT, -142, p), thoracic: lerp(FLAT, -132, p) },
        chestToOverhead(q),
        pair({ target: ANKLE, foot: 0, side: [0, -1] }, { target: add(ANKLE, [-5, 0]), foot: 0, side: [0, -1] }),
      );
    },
  };
}

/** Secured decline-bench sit-up: the rollers fix the ankles while the bar travels from chest to overhead. */
export function barbellBenchSitUp(base: Base): SideExercise {
  return {
    ...base, tl: REP,
    props: (pal) => ({ back: DECLINE.draw(pal) }), propsBox: DECLINE.box,
    dynamic: [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose(t) {
      const p = REP.at(t).p;
      return {
        hip: DECLINE_HIP,
        spine: { lumbar: lerp(160, 280, p), thoracic: lerp(160, 288, p) },
        neck: lerp(166, 294, p), head: lerp(168, 296, p),
        legs: declineLegs(),
        arms: chestToOverhead(smooth(clamp((p - 0.6) / 0.4, 0, 1))),
      };
    },
  };
}

/** Band push sit-up: the arms stay vertical while the chest curls to 45°, resisting an anchor behind the head. */
export function bandPushSitUp(base: Base): SideExercise {
  const anchor: Vec2 = [112, FLOOR - 98];
  return {
    ...base, tl: REP, mat: true,
    props: (pal) => ({ back: [{ kind: 'box', nm: 'band-anchor', color: pal.metalDark, c: anchor, s: [12, 34], r: 3 }] }),
    dynamic: [bandLine<Joints>((J) => [anchor, gripAt(J, 'n')]), bandLine<Joints>((J) => [add(anchor, [0, 12]), gripAt(J, 'f')])],
    pose(t) {
      const p = REP.at(t).p;
      return supineBase(
        { lumbar: lerp(FLAT, -150, p), thoracic: lerp(FLAT, -135, p) },
        pair({ a1: -90, a2: -90, hand: -90 }, { a1: -88, a2: -88, hand: -88 }),
        pair({ target: ANKLE, foot: 0, side: [0, -1] }, { target: add(ANKLE, [-5, 0]), foot: 0, side: [0, -1] }),
      );
    },
  };
}

/** Standing band crunch: feet do not move, elbows stay near the ribs and spine flexion drives the repetition. */
export function standingBandCrunch(base: Base): SideExercise {
  const anchor: Vec2 = [183, 334];
  return {
    ...base, tl: REP,
    props: (pal) => ({ back: [{ kind: 'box', nm: 'band-anchor', color: pal.metalDark, c: anchor, s: [13, 42], r: 3 }] }),
    dynamic: [bandLine<Joints>((J) => [anchor, gripAt(J, 'n')]), bandLine<Joints>((J) => [add(anchor, [0, 12]), gripAt(J, 'f')])],
    pose(t) {
      const p = REP.at(t).p;
      return {
        hip: [270, FLOOR - 182], spine: { lumbar: lerp(-90, -52, p), thoracic: lerp(-90, -42, p) }, neck: lerp(-90, -45, p), head: lerp(-90, -42, p),
        legs: pair({ target: [270, FLOOR - A], foot: 0, side: [1, 0] }, { target: [264, FLOOR - A], foot: 0, side: [1, 0] }),
        arms: pair({ a1: 124, a2: 150, hand: 150 }, { a1: 122, a2: 148, hand: 148 }),
      };
    },
  };
}

/** Band straight-leg raise: hands retain the band ends at the hips as both feet rise together. */
export function bandLegRaise(base: Base): SideExercise {
  return {
    ...base, tl: REP, mat: true,
    dynamic: [bandLine<Joints>((J) => [gripAt(J, 'n'), J.ankle_n]), bandLine<Joints>((J) => [gripAt(J, 'f'), J.ankle_f])],
    pose(t) {
      const p = REP.at(t).p;
      const leg = { a1: lerp(4, -90, p), a2: lerp(4, -90, p), foot: lerp(0, -90, p) };
      return supineBase({ lumbar: FLAT, thoracic: FLAT }, sideArms(), pair(leg, { ...leg, a1: leg.a1 + 2, a2: leg.a2 + 2 }));
    },
  };
}
