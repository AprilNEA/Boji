// Use a staggered standing posture between two high pulleys with a small forward lean.
// Keep both elbows near 159° as the hands travel from shoulder height to the lower sternum.
// The torso, feet, pulley points, cables, and handles stay connected throughout the movement.
import type { FrontExercise } from '@/exercise.ts';
import { makeCableFly } from './_chest-fly-1.ts';

export default makeCableFly({
  id: 'cable-high-to-low-crossover', name: '绳索高位夹胸', en: 'Cable High-to-Low Crossover',
  sources: ['fe:Cable_Crossover'], style: 'high-low', pulleyY: 62, lean: 8,
}) satisfies FrontExercise;
