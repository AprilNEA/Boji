// Rope London bridge, side view. Stand with soft knees and a slight forward lean under a high rope anchor.
// Pull one taut rope toward the torso without twisting or driving the hips.
// The free hand stays at the hip and the rope remains fixed at the upper anchor.
import type { SideExercise } from '@/exercise.ts';
import { makeRopeRow } from './_horizontal-row-3.ts';

export default makeRopeRow({
  id: 'rope-london-bridge', name: '绳索伦敦桥', en: 'Rope London Bridge',
  equipment: ['rope'], sources: ['hz:0609'],
}) satisfies SideExercise;
