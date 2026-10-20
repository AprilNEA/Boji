// Sit on the bench end with the feet planted and hinge over the thighs while the back stays neutral.
// Raise both softly bent arms directly sideways to shoulder height, pause, and lower without torso swing.
import type { FrontExercise } from '@/exercise.ts';
import { frontDumbbellFly } from './_rear-delt-2.ts';

export default frontDumbbellFly({
  id: 'dumbbell-seated-bent-over-rear-delt-fly', name: '哑铃坐姿俯身反向飞鸟',
  en: 'Dumbbell Seated Bent-Over Rear Delt Fly', sources: ['fe:Seated_Bent-Over_Rear_Delt_Raise'],
}, { support: 'seated' }) satisfies FrontExercise;
