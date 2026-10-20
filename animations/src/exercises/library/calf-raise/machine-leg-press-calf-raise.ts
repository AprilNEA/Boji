// Machine leg-press calf raise, side view. The back remains on the reclined seat and both knees stay slightly soft.
// The toes and balls of the feet remain on the lower sled edge as the ankles extend and return under control.
import type { SideExercise } from '@/exercise.ts';
import { calfTL, legPressMachineProps, legPressPose } from './_calf-raise-2.ts';

export default {
  id: 'machine-leg-press-calf-raise',
  name: '腿举机提踵',
  tl: calfTL,
  meta: {
    en: 'Machine Leg Press Calf Raise', family: 'calf-raise', equipment: ['machine', 'sled'],
    sources: ['fe:Calf_Press_On_The_Leg_Press_Machine', 'hz:1391', 'hz:1385'],
  },
  muscles: [{ m: 'calves', side: 'both' }, { m: 'quads', side: 'both', scale: 0.3 }, { m: 'hamstrings', side: 'both', scale: 0.3 }],
  props: legPressMachineProps('angled'),
  propsBox: [40, 405],
  pose: (t) => legPressPose(calfTL.at(t).p),
} satisfies SideExercise;
