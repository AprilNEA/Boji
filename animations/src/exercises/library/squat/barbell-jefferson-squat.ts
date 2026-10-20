// Straddle a floor bar and use the arms only as straight hooks while the legs lift the load.
// Lower through the knees with the torso as upright as practical, then stand through the feet.
// The side view shows the supported bar and locked arms; the staggered hand relation is depth-wise.
import { makeJeffersonSquat } from './_squat-1.ts';

export default makeJeffersonSquat({
  id: 'barbell-jefferson-squat',
  name: '杠铃杰斐逊深蹲',
  en: 'Barbell Jefferson Squat',
  equipment: ['barbell'],
  sources: ['fe:Jefferson_Squats', 'hz:0051'],
}) satisfies import('@/exercise.ts').SideExercise;
