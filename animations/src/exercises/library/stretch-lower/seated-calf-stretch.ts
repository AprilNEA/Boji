// Start on a bench edge with one heel fixed on the floor and the other foot supporting the seat.
// The long knee remains straight as the torso reaches forward and the ankle pulls the toes toward the shin.
import type { SideExercise } from '@/exercise.ts';
import { libraryMeta, lowerStretch, seatedCalf } from './_stretch-lower-1.ts';

export default lowerStretch({
  id: 'seated-calf-stretch', name: '坐姿小腿拉伸',
  meta: libraryMeta('Seated Calf Stretch', ['bodyweight'], ['hz:1390']),
  muscles: [{ m: 'calves', side: 'near' }, { m: 'hamstrings', side: 'near', scale: 0.3 }],
  pose: seatedCalf,
}) satisfies SideExercise;
