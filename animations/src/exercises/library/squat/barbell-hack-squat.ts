// Hold the bar behind the legs at arm's length with the palms facing backward.
// Keep the arms as hooks while lowering to parallel through knee and hip flexion.
// Press through the heels to stand without moving the bar in front of the legs.
import { makeHackSquat } from './_squat-1.ts';

export default makeHackSquat({
  id: 'barbell-hack-squat',
  name: '杠铃哈克深蹲',
  en: 'Barbell Hack Squat',
  equipment: ['barbell'],
  sources: ['fe:Barbell_Hack_Squat', 'hz:0046'],
}) satisfies import('@/exercise.ts').SideExercise;
