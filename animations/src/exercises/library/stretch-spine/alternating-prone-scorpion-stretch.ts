// Lie prone with the chest and both palms supported by the mat.
// Bend one knee and sweep it across the back, then repeat on the other side without moving the upper body.
import type { SideExercise } from '@/exercise.ts';
import { alternatingStretchTL, proneScorpionPose } from './_stretch-spine.ts';

export default {
  id: 'alternating-prone-scorpion-stretch', name: '俯卧交替蝎子式拉伸', tl: alternatingStretchTL, mat: true,
  meta: { en: 'Alternating Prone Scorpion Stretch', family: 'stretch-spine', equipment: ['bodyweight', 'mat'], sources: ['fe:Iron_Crosses_stretch'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'lowerBack', scale: 0.4 }, { m: 'glutes', scale: 0.35 }],
  poster: 0.44,
  pose: (t) => proneScorpionPose(alternatingStretchTL.at(t).p),
} satisfies SideExercise;
