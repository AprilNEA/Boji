// Stand upright at the high pulley with elbows held close beside the torso.
// Press the V-bar down until both elbows are straight, then control the return.
import type { SideExercise } from '@/exercise.ts';
import { cablePushdown } from './_triceps-extension-2.ts';

export default cablePushdown({
  id: 'cable-v-bar-triceps-pushdown', name: '绳索V形把下压', attachment: 'vbar',
  meta: { en: 'Cable V-Bar Triceps Pushdown', family: 'triceps-extension', equipment: ['cable'], sources: ['fe:Triceps_Pushdown_-_V-Bar_Attachment', 'hz:0241'] },
}) satisfies SideExercise;
