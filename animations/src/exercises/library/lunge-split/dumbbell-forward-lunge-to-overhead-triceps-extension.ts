// Step forward into an upright lunge while both dumbbells travel overhead near the ears.
// At the lunge bottom, bend the elbows to lower the weights behind the head, then straighten them.
// Keep the upper arms overhead and the front heel planted during the extension.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellLunge } from './_lunge-split-2.ts';

export default dumbbellLunge({
  id: 'dumbbell-forward-lunge-to-overhead-triceps-extension', name: '哑铃前弓步接过顶臂屈伸',
  en: 'Dumbbell Forward Lunge to Overhead Triceps Extension', sources: ['hz:1732'],
  direction: 'forward', arm: 'triceps',
}) satisfies SideExercise;
