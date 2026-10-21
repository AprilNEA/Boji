// Private builders for the vertical-pull-2 catalog. Hand targets stay fixed on the bar or rope.
// The poses use a compact hanging body where needed, so the full movement remains visible.
import type { LibraryMeta, PropShape, SideExercise } from '@/exercise.ts';
import { add, dir, lerp, mul, sub, type Vec2 } from '@/math/vec2.ts';
import { smooth, timeline } from '@/math/timeline.ts';
import { type Joints, type LimbPair, type Pose } from '@/rig/side.ts';
import { ARM_STRAIGHT, G, GRIP_IN_HAND, hipForShoulder } from '@/exercises/common.ts';
import { heldPlate, pullUpBar, workTL } from '@/exercises/equipment/index.ts';

export type Catalog = {
  id: string;
  name: string;
  en: string;
  equipment: LibraryMeta['equipment'];
  sources: string[];
};

const catalog = (x: Catalog): LibraryMeta => ({
  en: x.en, family: 'vertical-pull', equipment: x.equipment, sources: x.sources,
});
const pullTL = workTL(0.35);

export type PullUpOptions = {
  kneeCrunch?: boolean;
  lSit?: boolean;
  tuck?: boolean;
  oneArm?: boolean;
  towel?: boolean;
  wristAssist?: boolean;
  vBar?: boolean;
  neutral?: boolean;
  weighted?: boolean;
  lean?: boolean;
  grip?: 'overhand' | 'underhand' | 'mixed' | 'neutral';
};

/** A two-hand pull-up with fixed hand position and free feet. */
export function pullUp(x: Catalog, opts: PullUpOptions = {}): SideExercise {
  const barY = 12;
  // A V handle hangs lower than the straight bar, so its user keeps a modest knee bend.
  const handleDrop = opts.vBar ? 34 : 0;
  const wrist: Vec2 = [254, barY + GRIP_IN_HAND + handleDrop];
  const grip = opts.grip ?? (opts.neutral ? 'neutral' : x.id.includes('mixed') ? 'mixed' : x.id.includes('chin') ? 'underhand' : 'overhand');
  // In side view, palm-side changes appear as opposing hand angles around the fixed bar.
  const nearHand = grip === 'underhand' || grip === 'mixed' ? -110 : grip === 'overhand' ? -70 : -90;
  const farHand = grip === 'mixed' ? -70 : nearHand;
  // Offset a towel toward the viewer-facing side so it stays distinguishable from the bar in side view.
  const towelX = wrist[0] + 28;
  const station = pullUpBar({ view: 'side', x: wrist[0], y: barY });
  const upper = (p: number): Omit<Pose, 'legs' | 'arms'> => {
    const q = smooth(p);
    const lean = opts.lean ? lerp(14, 30, q) : 0;
    // The bottom retains a 0.7 px slack for an elbow over 165°, not a visibly bent arm.
    const S: Vec2 = [wrist[0] - lean, wrist[1] + lerp(ARM_STRAIGHT - (opts.lean ? 2 : 0.7), 63, q)];
    const spine = opts.lean
      ? { lumbar: lerp(-118, -124, q), thoracic: lerp(-120, -126, q) }
      : { lumbar: -90, thoracic: -90 };
    return {
      hip: hipForShoulder(S, spine), spine,
      neck: opts.lean ? lerp(-90, -103, q) : -90,
      head: opts.lean ? lerp(-90, -103, q) : -90,
      farHip: 0,
    };
  };
  const legs = (p: number): LimbPair => {
    const q = smooth(p);
    if (opts.lSit) return {
      near: { a1: 0, a2: 0, foot: 0 }, far: { a1: 1, a2: 1, foot: 1 },
    };
    if (opts.kneeCrunch) return {
      // Start with thighs vertical and calves level. The thighs then fold to the chest.
      near: { a1: lerp(90, -43, q), a2: lerp(0, 24, q), foot: lerp(0, 18, q) },
      far: { a1: lerp(91, -42, q), a2: lerp(1, 25, q), foot: lerp(1, 19, q) },
    };
    if (opts.tuck || opts.vBar) return {
      // Bent knees keep an advanced hanging variation inside the frame without grounding the feet.
      near: { a1: 50, a2: 110, foot: 18 }, far: { a1: 51, a2: 111, foot: 19 },
    };
    return {
      near: { a1: 90, a2: 90, foot: 0 }, far: { a1: 91, a2: 91, foot: 1 },
    };
  };
  const props = (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => {
    const extra: PropShape[] = [];
    if (opts.neutral) {
      const gap = x.id.includes('narrow') ? 5 : 13;
      extra.push(
        { kind: 'box', nm: 'near neutral handle', color: pal.metalDark, c: [wrist[0] - gap, barY + 18], s: [8, 36], r: 4 },
        { kind: 'box', nm: 'far neutral handle', color: pal.metal, c: [wrist[0] + gap, barY + 18], s: [7, 36], r: 3.5 },
      );
    }
    if (opts.vBar) extra.push(
      { kind: 'poly', nm: 'V handle frame', color: pal.metal, pts: [[wrist[0] - 16, barY + 5], [wrist[0], barY + 36], [wrist[0] + 16, barY + 5]], w: 5 },
      { kind: 'box', nm: 'V handle grip', color: pal.padFar, c: [wrist[0], barY + 36], s: [25, 8], r: 4 },
    );
    return { back: [...station.draw(pal), ...extra] };
  };
  const dynamic: NonNullable<SideExercise['dynamic']> = [];
  if (opts.weighted) {
    dynamic.push(
      {
        nm: 'Dip belt', kind: 'rigid', z: 'front',
        shapes: (pal) => [{ kind: 'box', nm: 'belt', color: pal.padFar, c: [0, 0], s: [38, 8], r: 4 }],
        at: (J) => ({ p: add(J.H, [6, 8]), a: 0 }),
      },
      {
        nm: 'Weight chain', kind: 'line', z: 'front', width: 2.5, color: (pal) => pal.metalDark,
        at: (J) => [add(J.H, [6, 12]), add(J.H, [8, 69])],
      },
      heldPlate((J) => ({ p: add(J.H, [8, 92]), a: 0 }), 'face', 'medium', 'front', 'Hanging plate'),
    );
  }
  if (opts.towel) {
    dynamic.push({
      nm: 'Assist towel', kind: 'line', z: 'overFarArm', width: 5, color: (pal) => pal.padFar,
      at: (J) => [[towelX, barY], J.wrist_f],
    });
  }
  return {
    id: x.id, name: x.name, tl: pullTL, meta: catalog(x), props, propsBox: station.box,
    muscles: [
      { m: 'lats' }, { m: 'biceps', side: opts.oneArm ? 'near' : 'both', scale: 0.6 },
      { m: 'forearms', side: opts.oneArm ? 'near' : 'both', scale: 0.35 },
      ...(opts.kneeCrunch || opts.lSit ? [{ m: 'abs' as const, scale: 0.8 }] : []),
    ],
    dynamic: dynamic.length ? dynamic : undefined,
    pose(t) {
      const p = pullTL.at(t).p;
      return {
        ...upper(p), legs: legs(p),
        arms: {
          near: { target: wrist, side: [-1, 0], hand: nearHand },
          far: opts.oneArm
            ? { a1: 78, a2: 92, hand: 84 }
            : opts.wristAssist
              ? { target: (J) => add(J.wrist_n, [1, 3]), side: [-1, 0], hand: farHand }
            : opts.towel
                ? { target: [towelX, barY + 78], side: [-1, 0], hand: farHand }
                : { target: (J) => add(wrist, sub(J.Sf, J.S)), side: [-1, 0], hand: farHand },
        },
      };
    },
  } satisfies SideExercise;
}

/** Gironda sternum chin: the torso stays arched back and the sternum approaches the bar. */
export function girondaChin(x: Catalog): SideExercise {
  const barY = 12, wrist: Vec2 = [254, barY + GRIP_IN_HAND];
  const station = pullUpBar({ view: 'side', x: wrist[0], y: barY });
  return {
    id: x.id, name: x.name, tl: pullTL, meta: catalog(x), props: (pal) => ({ back: station.draw(pal) }), propsBox: station.box,
    muscles: [{ m: 'lats' }, { m: 'biceps', side: 'both', scale: 0.6 }, { m: 'upperBack', scale: 0.45 }],
    pose(t) {
      const p = smooth(pullTL.at(t).p);
      const spine = { lumbar: lerp(-120, -132, p), thoracic: lerp(-122, -136, p) };
      const S: Vec2 = [lerp(wrist[0], wrist[0] - 43, p), lerp(wrist[1] + ARM_STRAIGHT - 0.7, wrist[1] + 60, p)];
      return {
        hip: hipForShoulder(S, spine), spine, neck: lerp(-112, -138, p), head: lerp(-112, -138, p), farHip: 0,
        // At the sternum-to-bar position the hips and legs point about 45° forward and down.
        legs: {
          near: { a1: lerp(90, 48, p), a2: lerp(90, 48, p), foot: lerp(0, 48, p) },
          far: { a1: lerp(91, 49, p), a2: lerp(91, 49, p), foot: lerp(1, 49, p) },
        },
        arms: {
          near: { target: wrist, side: [-1, 0], hand: -110 },
          far: { target: (J) => add(wrist, sub(J.Sf, J.S)), side: [-1, 0], hand: -110 },
        },
      };
    },
  } satisfies SideExercise;
}

/** Two repetitions in one loop: chest-to-bar, then a behind-the-neck pull with the head forward. */
export function alternatingPullUp(x: Catalog): SideExercise {
  const barY = 12, wrist: Vec2 = [254, barY + GRIP_IN_HAND];
  const station = pullUpBar({ view: 'side', x: wrist[0], y: barY });
  const tl = timeline([
    { d: 0.85, from: 0, to: 1, e: [0.3, 1] }, { d: 0.2, from: 1, to: 1, e: [1, 0.9] },
    { d: 1.15, from: 1, to: 0, e: [0.85, 0.35] }, { d: 0.85, from: 0, to: 1, e: [0.3, 1] },
    { d: 0.2, from: 1, to: 1, e: [1, 0.9] }, { d: 1.15, from: 1, to: 0, e: [0.85, 0.35] },
  ]);
  return {
    id: x.id, name: x.name, tl, meta: catalog(x), props: (pal) => ({ back: station.draw(pal) }), propsBox: station.box, poster: 0.69,
    muscles: [{ m: 'lats' }, { m: 'biceps', side: 'both', scale: 0.6 }, { m: 'upperBack', scale: 0.45 }],
    pose(t) {
      const p = smooth(tl.at(t).p), behind = t >= 0.5;
      const spine = { lumbar: behind ? -90 : lerp(-90, -106, p), thoracic: behind ? -90 : lerp(-90, -108, p) };
      const S: Vec2 = [wrist[0] - (behind ? 0 : 15 * p), wrist[1] + lerp(ARM_STRAIGHT - 0.7, 63, p)];
      return {
        hip: hipForShoulder(S, spine), spine,
        neck: behind ? lerp(-90, -68, p) : lerp(-90, -103, p),
        head: behind ? lerp(-90, -68, p) : lerp(-90, -103, p), farHip: 0,
        legs: { near: { a1: 90, a2: 90, foot: 0 }, far: { a1: 91, a2: 91, foot: 1 } },
        arms: {
          near: { target: wrist, side: [-1, 0], hand: -90 },
          far: { target: (J) => add(wrist, sub(J.Sf, J.S)), side: [-1, 0], hand: -90 },
        },
      };
    },
  } satisfies SideExercise;
}

/** Seated plate-loaded reverse-grip pulldown with a moving handle near the upper chest. */
export function machinePulldown(x: Catalog): SideExercise {
  const hip: Vec2 = [246, G - 104];
  const legs: LimbPair = {
    near: { target: [346, G - 13], foot: 0, side: [0, -1] },
    far: { target: [340, G - 13], foot: 0, side: [0, -1] },
  };
  const base = { hip, legs, spine: { lumbar: -102, thoracic: -104 }, neck: -99, head: -101 };
  const top: Vec2 = [283, 134], bottom: Vec2 = [299, 247];
  const grip = (p: number): Vec2 => [lerp(top[0], bottom[0], smooth(p)), lerp(top[1], bottom[1], smooth(p))];
  return {
    id: x.id, name: x.name, tl: pullTL, meta: catalog(x),
    muscles: [{ m: 'lats' }, { m: 'biceps', side: 'both', scale: 0.6 }, { m: 'forearms', side: 'both', scale: 0.3 }],
    props: (pal) => ({
      back: [
        { kind: 'box', nm: 'machine base', color: pal.metalDark, c: [234, G - 5], s: [230, 10], r: 3 },
        { kind: 'box', nm: 'machine upright', color: pal.metal, c: [153, 224], s: [20, 384], r: 5 },
        { kind: 'box', nm: 'machine top beam', color: pal.metal, c: [224, 38], s: [166, 16], r: 5 },
        { kind: 'box', nm: 'seat post', color: pal.metalDark, c: [252, G - 48], s: [14, 84], r: 3 },
        { kind: 'box', nm: 'seat', color: pal.pad, c: [254, G - 79], s: [102, 16], r: 8 },
        { kind: 'box', nm: 'thigh pad post', color: pal.metalDark, c: [331, 322], s: [10, 124], r: 4 },
      ],
      front: [{ kind: 'box', nm: 'thigh pad', color: pal.pad, c: [331, 320], s: [44, 19], r: 9 }],
    }),
    propsBox: [116, 368],
    dynamic: [{
      nm: 'Machine underhand handles', kind: 'rigid', z: 'underNearArm',
      shapes: (pal) => [
        { kind: 'box', nm: 'near handle', color: pal.padFar, c: [0, 0], s: [10, 38], r: 5 },
        { kind: 'box', nm: 'far handle', color: pal.metal, c: [-9, -2], s: [8, 32], r: 4 },
        { kind: 'box', nm: 'lever link', color: pal.metal, c: [-66, -92], s: [12, 220], r: 6, rot: -35 },
      ],
      at: (_J, t) => ({ p: grip(pullTL.at(t).p), a: 0 }),
    }],
    pose(t) {
      const g = grip(pullTL.at(t).p);
      return {
        ...base,
        arms: {
          near: { target: g, side: [-1, 0.3], hand: -110 },
          far: { target: (J) => add(g, sub(J.Sf, J.S)), side: [-1, 0.3], hand: -110 },
        },
      };
    },
  } satisfies SideExercise;
}

/** Bar muscle-up: the shoulder path circles the fixed bar hand through a pull and turnover into support. */
export function barMuscleUp(x: Catalog, opts: { kipping?: boolean; weighted?: boolean } = {}): SideExercise {
  const barY = 190, wrist: Vec2 = [254, barY + GRIP_IN_HAND];
  const station = pullUpBar({ view: 'side', x: wrist[0], y: barY });
  const dynamic: NonNullable<SideExercise['dynamic']> = opts.weighted ? [
    {
      nm: 'Dip belt', kind: 'rigid', z: 'front',
      shapes: (pal) => [{ kind: 'box', nm: 'belt', color: pal.padFar, c: [0, 0], s: [38, 8], r: 4 }],
      at: (J) => ({ p: add(J.H, [6, 8]), a: 0 }),
    },
    {
      nm: 'Weight chain', kind: 'line', z: 'front', width: 2.5, color: (pal) => pal.metalDark,
      at: (J) => [add(J.H, [6, 12]), add(J.H, [8, 69])],
    },
    heldPlate((J) => ({ p: add(J.H, [8, 92]), a: 0 }), 'face', 'medium', 'front', 'Hanging plate'),
  ] : [];
  return {
    id: x.id, name: x.name, tl: pullTL, meta: catalog(x), props: (pal) => ({ back: station.draw(pal) }), propsBox: station.box,
    muscles: [
      { m: 'lats' }, { m: 'biceps', side: 'both', scale: 0.55 }, { m: 'triceps', side: 'both', scale: 0.65 },
      { m: 'delts', side: 'both', scale: 0.45 }, { m: 'abs', scale: opts.kipping ? 0.55 : 0.35 },
    ],
    dynamic: dynamic.length ? dynamic : undefined,
    pose(t) {
      const p = smooth(pullTL.at(t).p);
      // A radius reduction in the middle supplies the pull-up elbow flexion. The half-circle carries the shoulders
      // from below the bar, behind it, to a straight-arm support above it without an unreachable wrist target.
      const angle = lerp(90, 270, p);
      const radius = ARM_STRAIGHT - 0.7 - 36 * Math.sin(Math.PI * p);
      const S = add(wrist, mul(dir(angle), radius));
      const spine = { lumbar: -90, thoracic: -90 };
      const swing = opts.kipping ? 1 : 0;
      return {
        hip: hipForShoulder(S, spine), spine, neck: -90, head: -90, farHip: 0,
        // The strict form starts with a compact knee bend only because a full hanging body would leave the canvas;
        // the legs lengthen into the top support. The kipping form starts with the feet swept behind the torso.
        legs: {
          near: {
            a1: lerp(opts.kipping ? -130 : -55, 75, p), a2: lerp(opts.kipping ? 80 : 75, 105, p),
            foot: lerp(15 + 10 * swing, 75, p),
          },
          far: {
            a1: lerp(opts.kipping ? -129 : -54, 76, p), a2: lerp(opts.kipping ? 81 : 76, 106, p),
            foot: lerp(16 + 10 * swing, 76, p),
          },
        },
        arms: {
          near: { target: wrist, side: [-1, 0], hand: -90 },
          far: { target: (J) => add(wrist, sub(J.Sf, J.S)), side: [-1, 0], hand: -90 },
        },
      };
    },
  } satisfies SideExercise;
}

/** Ring muscle-up: false-grip hands stay at fixed rings while the torso turns over into the ring support. */
export function ringMuscleUp(x: Catalog, opts: { kipping?: boolean } = {}): SideExercise {
  const ringY = 188, wrist: Vec2 = [254, ringY + GRIP_IN_HAND];
  return {
    id: x.id, name: x.name, tl: pullTL, meta: catalog(x), propsBox: [214, 288],
    props: (pal) => ({
      back: [
        { kind: 'box', nm: 'near ring strap', color: pal.cable, c: [254, ringY / 2], s: [4, ringY], r: 2 },
        { kind: 'box', nm: 'far ring strap', color: pal.metalDark, c: [248, ringY / 2 + 3], s: [3, ringY + 6], r: 1.5 },
        { kind: 'ring', nm: 'near ring', color: pal.plate, c: [254, ringY], s: [18, 30], w: 4 },
        { kind: 'ring', nm: 'far ring', color: pal.metalDark, c: [248, ringY + 3], s: [15, 26], w: 3 },
        { kind: 'box', nm: 'ceiling anchor', color: pal.metal, c: [251, 10], s: [58, 10], r: 3 },
      ],
    }),
    muscles: [
      { m: 'lats' }, { m: 'biceps', side: 'both', scale: 0.55 }, { m: 'triceps', side: 'both', scale: 0.65 },
      { m: 'delts', side: 'both', scale: 0.45 }, { m: 'abs', scale: opts.kipping ? 0.55 : 0.35 },
    ],
    pose(t) {
      const p = smooth(pullTL.at(t).p);
      const angle = lerp(90, 270, p);
      const radius = ARM_STRAIGHT - 0.7 - 36 * Math.sin(Math.PI * p);
      const S = add(wrist, mul(dir(angle), radius));
      const spine = { lumbar: -90, thoracic: -90 };
      return {
        hip: hipForShoulder(S, spine), spine, neck: -90, head: -90, farHip: 0,
        legs: {
          near: { a1: lerp(opts.kipping ? -130 : -55, 75, p), a2: lerp(opts.kipping ? 80 : 75, 105, p), foot: lerp(opts.kipping ? 25 : 15, 75, p) },
          far: { a1: lerp(opts.kipping ? -129 : -54, 76, p), a2: lerp(opts.kipping ? 81 : 76, 106, p), foot: lerp(opts.kipping ? 26 : 16, 76, p) },
        },
        arms: {
          near: { target: wrist, side: [-1, 0], hand: -90 },
          far: { target: (J) => add(wrist, sub(J.Sf, J.S)), side: [-1, 0], hand: -90 },
        },
      };
    },
  } satisfies SideExercise;
}

/** Rope climb: one hand reaches high while the other controls the rope, and the feet pinch it below the athlete. */
export function ropeClimb(x: Catalog): SideExercise {
  const ropeX = 270;
  return {
    id: x.id, name: x.name, tl: pullTL, meta: catalog(x), propsBox: [244, 296],
    props: (pal) => ({
      back: [
        { kind: 'box', nm: 'climbing rope', color: pal.cable, c: [ropeX, 232], s: [6, 436], r: 3 },
        { kind: 'box', nm: 'rope ceiling anchor', color: pal.metal, c: [ropeX, 12], s: [58, 11], r: 3 },
      ],
    }),
    muscles: [{ m: 'lats' }, { m: 'upperBack', scale: 0.7 }, { m: 'biceps', side: 'both', scale: 0.55 }, { m: 'forearms', side: 'both', scale: 0.7 }],
    pose(t) {
      const p = smooth(pullTL.at(t).p);
      const hip: Vec2 = [218, lerp(332, 276, p)];
      const footY = lerp(413, 355, p);
      return {
        hip, spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90, farHip: 0,
        // Both shoes close around the rope. The near foot overlaps its front edge while the far foot pins from behind.
        legs: {
          near: { target: [ropeX - 3, footY], side: [1, 0], foot: 180 },
          far: { target: [ropeX + 4, footY - 9], side: [1, 0], foot: 180 },
        },
        arms: {
          // The near hand slides to the next high hold as the far hand provides the lower hold.
          near: { target: [ropeX, lerp(165, 65, p)], side: [-1, 0], hand: -90 },
          far: { target: [ropeX - 4, lerp(120, 126, p)], side: [-1, 0], hand: -90 },
        },
      };
    },
  } satisfies SideExercise;
}
