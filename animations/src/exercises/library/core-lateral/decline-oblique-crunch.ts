// Lie back on a decline bench with both ankles secured beneath the roller.
// Curl the upper torso toward the opposite knee, then lower under control.
// Keep the hips and feet fixed below the roller while the torso flexes and turns.
import type { SideExercise } from '@/exercise.ts';
import { add, lerp, mul, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import type { Pose } from '@/rig/side.ts';
import { declineBench } from '@/exercises/equipment/index.ts';

const tl = timeline([
  { d: 1.0, from: 0, to: 1, e: [0.3, 1] }, { d: 0.45, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.5, from: 1, to: 0, e: [0.85, 0.35] }, { d: 0.5, from: 0, to: 0, e: [0.3, 0.25] },
]);
const bench = declineBench({ x: 112, angle: 20, low: 76, length: 230 });
const HIP: Vec2 = [218, 336];
const ANKLE = add(bench.roller, [-7, 4]);

function pose(p: number): Pose {
  const back = lerp(162, 208, p);
  return {
    hip: HIP,
    spine: { lumbar: 162, thoracic: back }, neck: lerp(165, 215, p), head: lerp(166, 218, p),
    legs: {
      near: { target: ANKLE, foot: -18, side: [0, -1] },
      far: { target: add(ANKLE, [-5, 1]), foot: -18, side: [0, -1] },
    },
    arms: {
      near: { a1: lerp(174, 214, p), a2: lerp(172, 220, p), hand: lerp(175, 220, p) },
      far: { a1: lerp(170, 210, p), a2: lerp(170, 216, p), hand: lerp(172, 216, p) },
    },
  };
}

export default {
  id: 'decline-oblique-crunch', name: '下斜斜腹卷腹', tl,
  meta: { en: 'Decline Oblique Crunch', family: 'core-lateral', equipment: ['bodyweight', 'bench'], sources: ['fe:Decline_Oblique_Crunch'] },
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.8 }],
  props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
  pose: (t) => pose(tl.at(t).p),
} satisfies SideExercise;
