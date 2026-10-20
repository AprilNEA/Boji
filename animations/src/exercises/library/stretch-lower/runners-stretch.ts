// Start in a staggered standing stance with the rear heel fixed to the floor.
// The front knee bends while both hands support on that thigh and the rear knee remains straight.
import type { SideExercise } from '@/exercise.ts';
import { libraryMeta, lowerStretch, standingRunner } from './_stretch-lower-1.ts';

export default lowerStretch({
  id: 'runners-stretch', name: '跑者弓步拉伸',
  meta: libraryMeta("Runner's Stretch", ['bodyweight'], ['hz:1585']),
  muscles: [{ m: 'calves', side: 'far' }, { m: 'hamstrings', side: 'far', scale: 0.5 }, { m: 'quads', side: 'near', scale: 0.3 }],
  pose: standingRunner,
}) satisfies SideExercise;
