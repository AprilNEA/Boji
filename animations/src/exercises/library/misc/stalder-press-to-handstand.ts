// Start in a low straddle support with both palms fixed to the floor.
// Press the hips over the shoulders while the straight legs close from the straddle to a handstand.
// Hold the stacked handstand briefly, then lower under control to the supported straddle.
import type { SideExercise } from '@/exercise.ts';
import { lerp, timeline, type Vec2 } from '@/math.ts';
import { ARM_STRAIGHT, FLOOR, hipForShoulder } from '@/exercises/common.ts';

const tl = timeline([
  { d: 1.25, from: 0, to: 1, e: [0.64, 1] },
  { d: 0.5, from: 1, to: 1, e: [1, 1] },
  { d: 1.55, from: 1, to: 0, e: [1, 0.64] },
  { d: 0.5, from: 0, to: 0, e: [0.64, 0.64] },
]);

const WRIST: Vec2 = [260, FLOOR - 7];
const SHOULDER: Vec2 = [WRIST[0], WRIST[1] - ARM_STRAIGHT];

export default {
  id: 'stalder-press-to-handstand',
  name: '分腿坐撑慢起手倒立',
  tl,
  poster: 0.4,
  meta: {
    en: 'Stalder Press to Handstand',
    family: 'misc',
    equipment: ['bodyweight'],
    sources: ['hz:3291'],
  },
  muscles: [
    { m: 'triceps', side: 'both' },
    { m: 'delts', side: 'both', scale: 0.72 },
    { m: 'abs', scale: 0.6 },
    { m: 'hipFlexor', side: 'both', scale: 0.35 },
  ],
  pose(t) {
    const p = tl.at(t).p;
    const spine = { lumbar: lerp(-90, 90, p), thoracic: lerp(-90, 90, p) };
    return {
      // The shoulder stays directly above the planted wrists through the full press.
      hip: hipForShoulder(SHOULDER, spine),
      farHip: 0,
      farShoulder: 0,
      spine,
      neck: spine.thoracic,
      head: spine.thoracic,
      legs: {
        // Side view shows the straddle as one leg forward and the other behind the trunk.
        near: { a1: lerp(0, -90, p), a2: lerp(0, -90, p), foot: lerp(0, -90, p) },
        far: { a1: lerp(180, 270, p), a2: lerp(180, 270, p), foot: lerp(180, 270, p) },
      },
      arms: {
        near: { target: WRIST, side: [1, 0], hand: 90 },
        far: { target: (J) => [WRIST[0] + J.Sf[0] - J.S[0], WRIST[1] + J.Sf[1] - J.S[1]], side: [1, 0], hand: 90 },
      },
    };
  },
} satisfies SideExercise;
