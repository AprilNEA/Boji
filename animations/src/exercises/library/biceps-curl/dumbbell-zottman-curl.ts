// Start standing tall with neutral-grip dumbbells and the elbows close to the torso.
// Curl with the wrists supinated, then lower with rotation while the upper arms and feet stay fixed.
import type { SideExercise } from '@/exercise.ts';
import { standingDumbbell } from './_biceps-curl-5.ts';

export default standingDumbbell({
  id: 'dumbbell-zottman-curl', name: '哑铃佐特曼弯举', en: 'Dumbbell Zottman Curl',
  equipment: ['dumbbell'], sources: ['fe:Zottman_Curl', 'hz:0439'],
}, { profile: true }) satisfies SideExercise;
