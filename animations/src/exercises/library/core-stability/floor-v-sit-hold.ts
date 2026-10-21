// Balance on the buttocks with the torso reclined and both legs straight in front of the body.
// Raise the torso and legs together into a V, then lower together under control.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { FLOOR } from '@/exercises/common.ts';

const tl = timeline([
  { d: 1.5, from: 0, to: 1, e: [0.35, 1] }, { d: 1.2, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.5, from: 1, to: 0, e: [0.85, 0.35] }, { d: 0.4, from: 0, to: 0, e: [0.3, 0.3] },
]);

export default {
  id: 'floor-v-sit-hold',
  name: '地板V字静止支撑',
  tl,
  mat: true,
  meta: { en: 'Floor V-Sit Hold', family: 'core-stability', equipment: ['bodyweight'], sources: ['hz:3420'] },
  muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.65 }],
  poster: 0.3,
  pose(t) {
    const p = tl.at(t).p;
    const hip: [number, number] = [220, FLOOR - 25];
    const back = lerp(-160, -138, p), leg = lerp(-8, -34, p);
    return {
      hip, spine: { lumbar: back, thoracic: back - 3 }, neck: back - 5, head: back - 4, farHip: 0, farShoulder: 0,
      legs: { near: { a1: leg, a2: leg, foot: leg }, far: { a1: leg, a2: leg, foot: leg } },
      arms: {
        near: { a1: lerp(-18, -42, p), a2: lerp(-18, -42, p), hand: lerp(-18, -42, p) },
        far: { a1: lerp(-16, -40, p), a2: lerp(-16, -40, p), hand: lerp(-16, -40, p) },
      },
    };
  },
} satisfies SideExercise;
