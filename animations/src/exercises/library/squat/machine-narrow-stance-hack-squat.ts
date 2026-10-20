// Stand with the back on the angled pad and feet close together on the hack-squat platform.
// Descend with the torso supported until the knees bend slightly beyond 90 degrees, then drive through the heels.
import type { SideExercise } from '@/exercise.ts';
import { hackSquat } from './_squat-3.ts';

export default hackSquat({
  id: 'machine-narrow-stance-hack-squat', name: '器械窄距哈克深蹲', en: 'Machine Narrow-Stance Hack Squat',
  sources: ['fe:Narrow_Stance_Hack_Squats', 'hz:0741'],
}, true) satisfies SideExercise;
