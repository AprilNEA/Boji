// 高脚杯深蹲 (dumbbell-goblet-squat). One dumbbell held upright against the chest, cupped under the top plate.
// The front load lets the torso stay more upright and the hips sink lower than in the bodyweight squat.
// pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '@/exercise.ts';
import { add, ang, lerp, mul, type Vec2 } from '@/math/vec2.ts';
import { easeSinIn, easeSinOut, timeline } from '@/math/timeline.ts';
import type { Joints, LimbSpec } from '@/rig/side.ts';
import { A, G, standLegs } from '@/exercises/common.ts';
import { gobletDumbbell } from '@/exercises/equipment/index.ts';

const gobletTL = timeline([
  { d: 1.6, from: 0, to: 1, e: [0.15, 0.55] },
  { d: 0.3, from: 1, to: 1, e: [0.55, 0.8] },
  { d: 1.2, from: 1, to: 0, e: [1, 0.85] },
  { d: 0.6, from: 0, to: 0, e: [0.85, 0.15] },
]);

const X0 = 280; // near ankle

/** Hands together in front of the sternum, elbows down. dx moves the far hand back behind the near one. */
const holdArm = (dx: number): LimbSpec => ({
  target: (J: Joints): Vec2 => add(add(J.B(0.84), mul(J.A(0.84), 27)), mul(J.T(0.84), -8 + dx)),
  side: (J: Joints): Vec2 => mul(J.T(0.6), -1), // elbows point down along the torso
  hand: (J: Joints) => ang(J.T(0.84)) + 8,
});

const gobletSquat = {
  id: 'dumbbell-goblet-squat', name: '哑铃高脚杯深蹲', tl: gobletTL,
  meta: { en: 'Dumbbell Goblet Squat', family: 'squat', equipment: ['dumbbell'], sources: ['hz:1760'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes' }, { m: 'abs', scale: 0.3 }],
  dynamic: [gobletDumbbell()],
  pose(t) {
    const { p } = gobletTL.at(t);
    const px = easeSinOut(p); // hips travel back first
    const py = easeSinIn(p);
    return {
      hip: [lerp(X0 - 8, X0 - 70, px), lerp(G - A - 180, G - A - 96, py)],
      spine: { lumbar: lerp(-88, -56, p), thoracic: lerp(-91, -62, p) },
      neck: lerp(-86, -70, p), head: lerp(-88, -80, p),
      legs: standLegs(X0),
      arms: { near: holdArm(0), far: holdArm(-3) },
    };
  },
} satisfies Exercise;

export default gobletSquat;
