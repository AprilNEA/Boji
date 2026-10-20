// Lie on one side with the roller under the lateral back just behind the armpit.
// Reach the working arm behind and to the side to expose the latissimus.
// Keep the upper body clear of the floor while shifting pressure through the lat.
import type { SideExercise } from '@/exercise.ts';
import { latRoll } from './_foam-roll.ts';

export default latRoll({
  id: 'foam-roller-lat-release', name: '泡沫轴背阔肌放松', en: 'Foam Roller Lat Release', sources: ['fe:Latissimus_Dorsi-SMR'],
}) satisfies SideExercise;
