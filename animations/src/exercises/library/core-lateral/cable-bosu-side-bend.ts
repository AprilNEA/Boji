// Stand beside a low cable with one hand on the handle and the free hand at the hip.
// Flex laterally toward the loaded hand, then return tall under control.
// Keep the torso long and the cable under tension throughout the movement.
import type { FrontExercise } from '@/exercise.ts';
import { standingSideBend } from './_core-lateral.ts';

const exercise = standingSideBend({
  id: 'cable-bosu-side-bend', name: '绳索半球平衡球体侧屈', en: 'Cable BOSU Side Bend', kind: 'cable-low',
  equipment: ['bodyweight', 'cable', 'bosu'], bosu: true, sources: ['hz:0221'],
});
export default exercise satisfies FrontExercise;
