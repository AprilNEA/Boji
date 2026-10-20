// Stand on a low platform while the loaded bar begins on the floor below the feet.
// Set the hips and knees into a braced deadlift start, then extend to a tall lockout.
// The platform stays under both feet and the bar returns to the floor on every repetition.
import type { SideExercise } from '@/exercise.ts';
import { barDeadlift, deficitPlatform } from './_hinge-1.ts';

const platform = deficitPlatform(12);

export default barDeadlift({
  id: 'barbell-deficit-deadlift', name: '杠铃垫高硬拉', en: 'Barbell Deficit Deadlift',
  sources: ['fe:Deficit_Deadlift'], floor: platform.floor, top: 180, equipment: ['barbell', 'box'],
  props: platform.props, propsBox: platform.box,
}) satisfies SideExercise;
