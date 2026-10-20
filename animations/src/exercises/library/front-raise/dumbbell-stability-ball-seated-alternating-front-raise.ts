// Sit tall on a stability ball with both feet flat and dumbbells held at the sides.
// Raise one softly bent arm toward shoulder height, return it, then alternate to the other arm.
// The ball remains on the floor while the feet and upright torso stay steady.
import type { SideExercise } from '@/exercise.ts';
import { seatedFrontRaise } from './_front-raise.ts';

export default seatedFrontRaise({
  id: 'dumbbell-stability-ball-seated-alternating-front-raise', name: '哑铃健身球坐姿交替前平举',
  en: 'Dumbbell Stability Ball Seated Alternating Front Raise', sources: ['hz:1332'], ball: true, alternate: true,
}) satisfies SideExercise;
