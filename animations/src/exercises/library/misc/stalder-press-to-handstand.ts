// Start in a low straddle support with both palms fixed to the floor.
// Fold the straight legs toward the torso, press the hips above the shoulders, then open to handstand.
// The side projection overlaps the frontal straddle while the hips travel over the planted hands.
import type { SideExercise } from '@/exercise.ts';
import { type Vec2 } from '@/math/vec2.ts';
import { keyframes, timeline } from '@/math/timeline.ts';
import { ARM_STRAIGHT, FLOOR, hipForShoulder } from '@/exercises/common.ts';

const tl = timeline([
  { d: 1.25, from: 0, to: 1, e: [0.64, 1] },
  { d: 0.5, from: 1, to: 1, e: [1, 1] },
  { d: 1.55, from: 1, to: 0, e: [1, 0.64] },
  { d: 0.5, from: 0, to: 0, e: [0.64, 0.64] },
]);

const WRIST: Vec2 = [260, FLOOR - 7];
const SHOULDER: Vec2 = [WRIST[0], WRIST[1] - ARM_STRAIGHT];
// Keep the thighs on the flexed side of the torso while it turns. Opening the hips waits until they are high enough
// for the straight legs to clear the floor.
const spineAngle = keyframes([[0, -90], [0.24, -90], [0.68, 90], [1, 90]]);
const legAngle = keyframes([[0, 0], [0.24, -70], [0.68, 110], [1, 270]]);

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
    const spine = { lumbar: spineAngle(p), thoracic: spineAngle(p) };
    const leg = legAngle(p);
    return {
      // The shoulder stays directly above the planted wrists through the full press.
      hip: hipForShoulder(SHOULDER, spine),
      farHip: 0,
      farShoulder: 0,
      spine,
      neck: spine.thoracic,
      head: spine.thoracic,
      legs: {
        near: { a1: leg, a2: leg, foot: leg },
        far: { a1: leg, a2: leg, foot: leg },
      },
      arms: {
        near: { target: WRIST, side: [1, 0], hand: 90 },
        far: { target: (J) => [WRIST[0] + J.Sf[0] - J.S[0], WRIST[1] + J.Sf[1] - J.S[1]], side: [1, 0], hand: 90 },
      },
    };
  },
} satisfies SideExercise;
