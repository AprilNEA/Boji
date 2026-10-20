// Start with a rear-anchored band behind the neck and the hips pushed back.
// The torso folds to near parallel with a long spine, then the hips extend.
// The low rear anchor stays fixed while the hands retain the band position.
import type { SideExercise } from '@/exercise.ts';
import { goodMorning } from './_hinge-1.ts';

export default goodMorning({
  id: 'band-rear-anchored-good-morning', name: '弹力带后锚定早安式', en: 'Band Rear-Anchored Good Morning',
  sources: ['fe:Band_Good_Morning_Pull_Through'], band: 'rear-anchor', startTall: true,
}) satisfies SideExercise;
