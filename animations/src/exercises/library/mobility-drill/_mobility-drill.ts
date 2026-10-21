// Private builders for the mobility-drill work list. Each pose preserves a clear fixed base and shows its stated range.
// Front drills keep both feet planted unless the instruction explicitly lifts, swings, or circles one leg.
import type { FrontExercise, LibraryMeta, MuscleSpec, SideExercise } from '@/exercise.ts';
import { D2R, add, lerp, mul, sub, type Vec2 } from '@/math/vec2.ts';
import { bump, smooth, timeline, type Timeline } from '@/math/timeline.ts';
import { add3, type Vec3 } from '@/math/vec3.ts';
import { BODY, GROUND, type Pose } from '@/rig/side.ts';
import { FB, toeDir, type FrontJoints, type FrontPose } from '@/rig/front.ts';
import { A, FLOOR, G, QUAD, hipForShoulder, kneelLeg, plantedArm, standLegs, toesDown, HIGH_PLANK } from '@/exercises/common.ts';
import { kettlebell, pullUpBar } from '@/exercises/equipment/index.ts';

export type DrillMeta = LibraryMeta & { id: string; name: string };
type FrontKind = 'arm-circles' | 'chest' | 'elbow' | 'knees' | 'archer' | 'arm-torso' | 'hip-circles' | 'knee-circles' | 'lateral-swing' | 'wrist' | 'halo' | 'halo-extension' | 'dowel';
type SideKind = 'alternating-toe' | 'clasp-toe' | 'reverse-clasp-toe' | 'quad-hip' | 'seated-ankle' | 'standing-ankle' | 'supine-crossover' | 'back-stretch' | 'leg-swing' | 'groiner' | 'half-kneel-arms' | 'inchworm' | 'claw' | 'shoulder-circles' | 'pelvic-tilt' | 'toe-touch' | 'skin-cat';

const work = (hold = 0.25): Timeline => timeline([
  { d: 1.0, from: 0, to: 1, e: [0.25, 0.95] },
  { d: hold, from: 1, to: 1, e: [0.95, 0.8] },
  { d: 1.25, from: 1, to: 0, e: [0.8, 0.25] },
  { d: 0.35, from: 0, to: 0, e: [0.25, 0.2] },
]);
const alternate = (): Timeline => timeline([
  { d: 0.8, from: 0, to: 1, e: [0.25, 0.9] },
  { d: 0.2, from: 1, to: 1, e: [0.9, 0.75] },
  { d: 0.8, from: 1, to: 0, e: [0.75, 0.25] },
  { d: 0.8, from: 0, to: -1, e: [0.25, 0.9] },
  { d: 0.2, from: -1, to: -1, e: [0.9, 0.75] },
  { d: 0.8, from: -1, to: 0, e: [0.75, 0.25] },
]);
const standingPelvis = (): Vec3 => [0, BODY.ankleH + 182.8, 0];
const standingLegs = (spread = 17) => ({
  l: { target: [spread, BODY.ankleH, 2] as Vec3, dir: toeDir([0, 0, 1]) },
  r: { target: [-spread, BODY.ankleH, 2] as Vec3, dir: toeDir([0, 0, 1]) },
});
const pt = (J: FrontJoints, side: 'l' | 'r', x: number, y: number, z: number): Vec3 => add3(J[`shoulder_${side}`], [x, y, z]);
const sign = (side: 'l' | 'r'): number => side === 'l' ? 1 : -1;

/** Builds the standing frontal drills: hands and feet have IK targets, so the recognisable endpoint stays stable. */
export function frontDrill(meta: DrillMeta, kind: FrontKind, muscles: MuscleSpec[]): FrontExercise {
  const tl = kind === 'archer' || kind === 'hip-circles' || kind === 'lateral-swing' ? alternate() : work(kind === 'halo-extension' ? 0.35 : 0.2);
  const arm = (side: 'l' | 'r', t: number) => {
    const p = tl.at(t).p;
    const s = sign(side);
    if (kind === 'arm-circles') {
      const a = t * Math.PI * 2;
      // A 22 px radius reads as the instructed 30 cm circle without exceeding the arm reach.
      return (J: FrontJoints) => pt(J, side, s * (99 + 22 * Math.cos(a)), 22 * Math.sin(a), 8);
    }
    if (kind === 'wrist') {
      const a = t * Math.PI * 2;
      return (J: FrontJoints) => pt(J, side, s * (108 + 12 * Math.cos(a)), 12 * Math.sin(a), 8);
    }
    if (kind === 'chest') {
      // Open to a T, then close in front; the slight opposite horizontal offset makes the hands cross without collision.
      return (J: FrontJoints) => pt(J, side, lerp(s * 122, -s * 11, p), 0, lerp(8, 74, p));
    }
    if (kind === 'elbow') {
      const a = t * Math.PI * 2;
      return (J: FrontJoints) => pt(J, side, s * (31 + 18 * Math.cos(a)), -15 + 18 * Math.sin(a), 38);
    }
    if (kind === 'archer') {
      const q = smooth(Math.abs(p));
      // The forward arm stays long while the rear elbow comes back in a bow-draw position.
      return (J: FrontJoints) => side === (p >= 0 ? 'l' : 'r')
        ? pt(J, side, s * lerp(44, 123, q), 0, 28)
        : pt(J, side, s * lerp(44, 18, q), 4, 7);
    }
    if (kind === 'arm-torso') {
      const a = t * Math.PI * 2;
      return (J: FrontJoints) => pt(J, side, s * (65 + 40 * Math.cos(a)), 33 * Math.sin(a), 48 + 12 * Math.cos(a));
    }
    if (kind === 'halo' || kind === 'halo-extension') {
      const a = t * Math.PI * 2;
      const extension = kind === 'halo-extension' ? Math.max(0, Math.sin(a)) : 0;
      // The hands travel from the bell-at-chest start, up around the head, then back to the chest.
      return (J: FrontJoints) => pt(J, side, s * (21 + 34 * Math.sin(a)), -48 + 100 * (1 - Math.cos(a)) / 2 + 28 * extension, 34);
    }
    if (kind === 'dowel') {
      // Wide hands stay at the dowel endpoints as it passes from thighs to behind the head.
      return (J: FrontJoints) => pt(J, side, s * 70, lerp(-88, 94, p), lerp(32, -18, p));
    }
    return (J: FrontJoints) => pt(J, side, s * 45, 0, 25);
  };
  return {
    id: meta.id, name: meta.name, view: 'front', tl, meta, muscles,
    dynamic: kind === 'halo' || kind === 'halo-extension' ? [kettlebell<FrontJoints>((J) => ({
      p: [(J.wrist_l[0] + J.wrist_r[0]) / 2, GROUND - (J.wrist_l[1] + J.wrist_r[1]) / 2 - 8], a: 180,
    }), 'face', 'underNearArm')] : kind === 'dowel' ? [{
      nm: 'Dowel', kind: 'rigid' as const, z: 'underNearArm' as const,
      shapes: (pal) => [{ kind: 'box' as const, nm: 'dowel', color: pal.metal, c: [0, 0], s: [174, 7], r: 3.5 }],
      at: (J: FrontJoints) => ({ p: [(J.wrist_l[0] + J.wrist_r[0]) / 2, GROUND - (J.wrist_l[1] + J.wrist_r[1]) / 2], a: 0 }),
    }] : undefined,
    pose(t) {
      const p = tl.at(t).p;
      const base = { pelvis: standingPelvis(), legs: standingLegs(), arms: { l: { target: arm('l', t) }, r: { target: arm('r', t) } } };
      if (kind === 'knees') {
        const q = 5 * Math.sin(t * Math.PI * 2);
        return { ...base, pelvis: [q, BODY.ankleH + 176, 0] as Vec3, hips: { pitch: 7 }, spine: { pitch: -5 }, arms: { l: { target: (J: FrontJoints) => pt(J, 'l', -3, -75, 32) }, r: { target: (J: FrontJoints) => pt(J, 'r', 3, -75, 32) } } };
      }
      if (kind === 'knee-circles') {
        const q = 7 * Math.sin(t * Math.PI * 2);
        // Raised ankles and toe targets keep the balls of both feet on the floor while the heels lift.
        const balls = toeDir([0, 0, 1], BODY.ankleH + 16 - FB.toeH);
        return { ...base, pelvis: [q, BODY.ankleH + 171, 0] as Vec3, hips: { pitch: 9 }, arms: { l: { target: (J: FrontJoints) => pt(J, 'l', -3, -75, 32) }, r: { target: (J: FrontJoints) => pt(J, 'r', 3, -75, 32) } }, legs: { l: { target: [19, BODY.ankleH + 16, 4], dir: balls }, r: { target: [-19, BODY.ankleH + 16, 4], dir: balls } } };
      }
      if (kind === 'hip-circles') {
        const q = p, a = q * Math.PI / 2;
        const active = p >= 0 ? 'l' : 'r';
        const other = active === 'l' ? 'r' : 'l';
        const foot = (s: 'l' | 'r') => s === active
          ? { target: [sign(s) * (17 + 42 * Math.sin(a)), BODY.ankleH + 74 + 29 * Math.cos(a), 20] as Vec3, dir: toeDir([0, 0, 1]) }
          : standingLegs()[s];
        return { ...base, legs: active === 'l' ? { l: foot('l'), r: foot('r') } : { l: foot('l'), r: foot('r') }, arms: { l: { target: (J: FrontJoints) => pt(J, 'l', -3, -75, 32) }, r: { target: (J: FrontJoints) => pt(J, 'r', 3, -75, 32) } } } as FrontPose;
      }
      if (kind === 'lateral-swing') {
        const q = p, active = p >= 0 ? 'l' : 'r', other = active === 'l' ? 'r' : 'l';
        const x = sign(active) * (17 + 81 * q);
        const moving = { target: [x, BODY.ankleH + 28, 7] as Vec3, dir: toeDir([0, 0, 1]) };
        return { ...base, legs: active === 'l' ? { l: moving, r: standingLegs().r } : { l: standingLegs().l, r: moving }, arms: { l: { target: (J: FrontJoints) => pt(J, 'l', -3, -75, 32) }, r: { target: (J: FrontJoints) => pt(J, 'r', 30, -55, 38) } } } as FrontPose;
      }
      if (kind === 'arm-torso') return { ...base, spine: { yaw: 22 * Math.sin(t * Math.PI * 2) }, hips: { yaw: 12 * Math.sin(t * Math.PI * 2) } };
      if (kind === 'dowel') return { ...base, spine: { pitch: -2 }, head: { pitch: -7 } };
      return base;
    },
  };
}

const sideStand = (hipX = 256, kneeSoft = false): Omit<Pose, 'arms'> => ({
  hip: [hipX, G - A - (kneeSoft ? 174 : 183)], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
  legs: standLegs(hipX, 0), farHip: 0,
});
const arm = (a1: number, a2: number, hand = a2) => ({ near: { a1, a2, hand }, far: { a1: a1 + 2, a2: a2 + 2, hand: hand + 2 } });

/** Builds side and floor drills. Fixed contacts use targets; moving limbs use safe fixed joint directions. */
export function sideDrill(meta: DrillMeta, kind: SideKind, muscles: MuscleSpec[]): SideExercise {
  const tl = kind === 'alternating-toe' || kind === 'leg-swing' || kind === 'claw' ? alternate() : work(kind === 'inchworm' ? 0.35 : 0.22);
  const pull = kind === 'skin-cat' ? pullUpBar({ view: 'side', x: 272, y: 180 }) : undefined;
  return {
    id: meta.id, name: meta.name, tl, meta, muscles, mat: ['quad-hip', 'seated-ankle', 'supine-crossover', 'groiner', 'inchworm'].includes(kind),
    props: pull ? (pal) => ({ back: pull.draw(pal) }) : undefined,
    propsBox: pull?.box,
    pose(t) {
      const p = tl.at(t).p;
      if (kind === 'alternating-toe') {
        const q = smooth(Math.abs(p)), active = p >= 0;
        const hip: Vec2 = [256, G - A - 183];
        return { hip, spine: { lumbar: lerp(-90, -45, q), thoracic: lerp(-90, -45, q) }, neck: -70, head: -72,
          legs: active ? { near: { a1: lerp(90, -65, q), a2: lerp(90, -62, q), foot: -5 }, far: { target: [256, G - A], foot: 0, side: [1, 0] } } : { near: { target: [256, G - A], foot: 0, side: [1, 0] }, far: { a1: lerp(92, -64, q), a2: lerp(92, -61, q), foot: -5 } },
          arms: active ? arm(0, 80) : arm(180, 100), farHip: 0 };
      }
      if (kind === 'clasp-toe' || kind === 'reverse-clasp-toe' || kind === 'toe-touch') {
        const q = smooth(p), bottomSpine = { lumbar: -5, thoracic: -5 };
        const spine = { lumbar: lerp(-90, bottomSpine.lumbar, q), thoracic: lerp(-90, bottomSpine.thoracic, q) };
        // The upright wrist is exactly 121 px below the standard standing shoulder at [258, 151].
        // The reverse clasp only turns the palms outward. The hands travel in front of the shins in every variant.
        const wrist: Vec2 = [lerp(258, 294, q), lerp(272, 400, q)];
        // The shoulder is kept 121 px from the hand. The far wrist follows the far-shoulder offset exactly.
        const hip = hipForShoulder([wrist[0], wrist[1] - 121], spine);
        return { hip, spine, neck: lerp(-90, -5, q), head: lerp(-90, -8, q), legs: standLegs(256, 0),
          arms: { near: { target: wrist, side: [-1, 0], hand: kind === 'reverse-clasp-toe' ? 180 : 90 }, far: { target: (J) => add(wrist, sub(J.Sf, J.S)), side: [-1, 0], hand: kind === 'reverse-clasp-toe' ? 180 : 90 } }, farHip: 0 };
      }
      if (kind === 'quad-hip') {
        const q = smooth(p), hip = QUAD.hip;
        return { hip, spine: QUAD.spine, neck: -12, head: -10, farHip: 0, farShoulder: 0,
          // The lifted lower leg stays folded behind the knee; a horizontal foot clears the mat through the circle.
          legs: { near: { a1: lerp(90, -24, q), a2: lerp(178, 78, q), foot: 0 }, far: { a1: 90, a2: 178, foot: 180 } },
          arms: { near: plantedArm(QUAD.wrist), far: plantedArm(QUAD.wristFar) } };
      }
      if (kind === 'seated-ankle') {
        const q = t * Math.PI * 2, hip: Vec2 = [166, G - 91], ankle: Vec2 = [333, G - 21];
        return { hip, spine: { lumbar: -82, thoracic: -87 }, neck: -88, head: -90, farHip: 0,
          legs: { near: { target: [ankle[0], ankle[1] - 18], side: [0, -1], foot: -63 + 20 * Math.sin(q) }, far: { target: ankle, side: [0, -1], foot: -79 } }, arms: arm(72, 92) };
      }
      if (kind === 'standing-ankle') {
        const q = t * Math.PI * 2;
        return { ...sideStand(256), legs: { near: { target: [256, G - A - 12], side: [1, 0], foot: 11 * Math.sin(q) }, far: { target: [256, G - A], side: [1, 0], foot: 0 } }, arms: arm(80, 94), farHip: 0 };
      }
      if (kind === 'supine-crossover') {
        const q = smooth(Math.abs(p)), active = p >= 0, neck: Vec2 = [150, FLOOR - 20], hip: Vec2 = [272, FLOOR - 30];
        const raise = active ? { near: { a1: lerp(0, -112, q), a2: lerp(0, -112, q), foot: -90 }, far: { a1: 0, a2: 0, foot: 0 } } : { near: { a1: 0, a2: 0, foot: 0 }, far: { a1: lerp(2, -110, q), a2: lerp(2, -110, q), foot: -90 } };
        return { hip, spine: { target: neck, side: [0, 1] }, neck: 180, head: 180, farHip: 0, legs: raise, arms: { near: { a1: 180, a2: 180 }, far: { a1: 180, a2: 180 } } };
      }
      if (kind === 'back-stretch') {
        const q = smooth(p); return { ...sideStand(256), arms: arm(lerp(90, -90, q), lerp(90, -90, q)), farHip: 0 };
      }
      if (kind === 'leg-swing') {
        const q = p; return { ...sideStand(256), legs: { near: { a1: lerp(90, -57, Math.max(0, q)), a2: lerp(90, -57, Math.max(0, q)), foot: 0 }, far: { a1: lerp(90, 133, Math.max(0, -q)), a2: lerp(90, 133, Math.max(0, -q)), foot: 5 } }, arms: arm(80, 95), farHip: 0 };
      }
      if (kind === 'groiner') {
        const q = smooth(p), plank = HIGH_PLANK.body(HIGH_PLANK.top);
        if (q < 0.001) return { ...plank, arms: { near: plantedArm(HIGH_PLANK.wrist), far: plantedArm(HIGH_PLANK.wristFar) } };
        const hand = HIGH_PLANK.wrist;
        const plankSpine = plank.spine as { lumbar: number; thoracic: number };
        // A slightly shallower airborne torso raises the forward knees clear of the mat without moving the hands.
        const airborne = 7 * bump(q);
        const spine = { lumbar: lerp(plankSpine.lumbar, -36, q) + airborne, thoracic: lerp(plankSpine.thoracic, -34, q) + airborne };
        // Keep both hands planted while the ankles jump forward to either side of them.
        // HIGH_PLANK places the wrist 6 px ahead of the shoulder. Preserve that established contact geometry.
        const hip = hipForShoulder([hand[0] - 6, hand[1] - 121], spine);
        // The feet leave the mat during the jump. The arc prevents an impossible long-leg reach between plank and tuck.
        const footY = lerp(HIGH_PLANK.ankle[1], G - A, q) - 34 * bump(q);
        // The knees point forward toward the hands. A vertical pole reverses them as the ankles pass the hips.
        return { hip, spine, neck: lerp(plank.neck, -34, q) + airborne, head: lerp(plank.head, -20, q) + airborne, farHip: 0, farShoulder: 0,
          legs: { near: { target: [lerp(HIGH_PLANK.ankle[0], hand[0] - 100, q), footY], side: [1, 0], foot: lerp(85, 0, q) }, far: { target: [lerp(HIGH_PLANK.ankle[0] - 2, hand[0] - 106, q), footY], side: [1, 0], foot: lerp(85, 0, q) } }, arms: { near: plantedArm(hand), far: plantedArm(HIGH_PLANK.wristFar) } };
      }
      if (kind === 'half-kneel-arms') {
        const q = p, hip: Vec2 = [246, G - 110];
        return { hip, spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90, farHip: 0,
          legs: { near: { target: [337, G - A], side: [1, 0], foot: 0 }, far: kneelLeg(hip) }, arms: q >= 0 ? arm(lerp(-25, -83, q), lerp(48, -43, q)) : arm(lerp(182, 246, -q), lerp(132, 223, -q)) };
      }
      if (kind === 'inchworm') {
        const q = smooth(p), plank = HIGH_PLANK.body(HIGH_PLANK.top);
        if (q > 0.999) return { ...plank, arms: { near: plantedArm(HIGH_PLANK.wrist), far: plantedArm(HIGH_PLANK.wristFar) } };
        const hand = HIGH_PLANK.wrist;
        const plankSpine = plank.spine as { lumbar: number; thoracic: number };
        // The pike starts with the hips high above the shoulders. This keeps straight legs reachable as the feet walk in.
        const spine = { lumbar: lerp(55, plankSpine.lumbar, q), thoracic: lerp(57, plankSpine.thoracic, q) };
        // Preserve the high-plank shoulder-to-wrist offset while the feet walk in.
        const hip = hipForShoulder([hand[0] - 6, hand[1] - 121], spine);
        // Legs stay straight as the feet step toward the still-planted hands, then the body lengthens into a plank.
        const feetX = lerp(hand[0] - 45, HIGH_PLANK.ankle[0], q);
        // The knees point forward throughout the pike-to-plank transition, even when the hip-to-ankle line turns.
        return { hip, spine, neck: lerp(53, plank.neck, q), head: lerp(55, plank.head, q), farHip: 0, farShoulder: 0,
          legs: { near: { target: [feetX, HIGH_PLANK.ankle[1]], side: [1, 0], foot: 85 }, far: { target: [feetX - 2, HIGH_PLANK.ankle[1]], side: [1, 0], foot: 85 } }, arms: { near: plantedArm(hand), far: plantedArm(HIGH_PLANK.wristFar) } };
      }
      if (kind === 'claw') {
        const q = smooth(Math.abs(p)), active = p >= 0;
        return { ...sideStand(256, true), legs: active ? { near: { a1: lerp(90, -2, q), a2: lerp(90, 170, q), foot: 0 }, far: { a1: 90, a2: 90, foot: 0 } } : { near: { a1: 90, a2: 90, foot: 0 }, far: { a1: lerp(92, -1, q), a2: lerp(92, 171, q), foot: 0 } }, arms: active ? arm(-25, 70) : arm(205, 110), farHip: 0 };
      }
      if (kind === 'shoulder-circles') {
        const q = t * Math.PI * 2; return { ...sideStand(256), spine: { lumbar: -90 + 3 * Math.sin(q), thoracic: -90 - 4 * Math.cos(q) }, neck: -90, head: -90, arms: arm(82 + 7 * Math.sin(q), 96 + 8 * Math.cos(q)), farHip: 0 };
      }
      if (kind === 'pelvic-tilt') {
        const q = smooth(p); return { ...sideStand(256, true), hip: [256 + 9 * q, G - A - 174], spine: { lumbar: lerp(-86, -102, q), thoracic: lerp(-91, -86, q) }, neck: -90, head: -90, arms: arm(72, 92), farHip: 0 };
      }
      // Skin-the-cat: hands remain on the fixed overhead bar. The shoulder point is derived from that fixed grip.
      const q = smooth(p), wrist: Vec2 = [272, 39], spine = { lumbar: lerp(-90, 90, q), thoracic: lerp(-90, 90, q) };
      const S: Vec2 = [272, wrist[1] + lerp(125, 25, q)];
      return { hip: hipForShoulder(S, spine), spine, neck: lerp(-90, 90, q), head: lerp(-90, 90, q), farHip: 0, farShoulder: 0,
        // Finish in a straight rear hang with the legs behind the bar, not vertically off the canvas.
        legs: { near: { a1: lerp(90, 170, q), a2: lerp(90, 170, q), foot: lerp(0, 170, q) }, far: { a1: lerp(92, 172, q), a2: lerp(92, 172, q), foot: lerp(2, 172, q) } },
        arms: { near: { target: wrist, side: [-1, 0], hand: -90 }, far: { target: add(wrist, [-3, 0]), side: [-1, 0], hand: -90 } } };
    },
  };
}
