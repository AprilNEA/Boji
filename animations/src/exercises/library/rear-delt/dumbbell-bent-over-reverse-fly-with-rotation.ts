// Stand in a stable hip hinge with the back neutral and both dumbbells hanging under the shoulders.
// Raise the soft elbows sideways to a T, rotate the palms down, then return without moving the torso.
import type { FrontExercise } from '@/exercise.ts';
import { frontDumbbellFly } from './_rear-delt-2.ts';

export default frontDumbbellFly({
  id: 'dumbbell-bent-over-reverse-fly-with-rotation', name: '哑铃俯身旋转反向飞鸟',
  en: 'Dumbbell Bent-Over Reverse Fly with Rotation', sources: ['hz:0386'],
}, { rotation: true }) satisfies FrontExercise;
