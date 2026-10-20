// Start with a rear-shoulder bar, a shoulder-width stance and knees only slightly bent.
// Keep the legs nearly fixed as the hips hinge back and the torso reaches near parallel.
// The head follows the neutral spine and the bar remains fixed across the upper back.
import type { SideExercise } from '@/exercise.ts';
import { goodMorning } from './_hinge-1.ts';

export default goodMorning({
  id: 'barbell-stiff-leg-good-morning', name: '杠铃直腿早安式', en: 'Barbell Stiff-Leg Good Morning',
  sources: ['fe:Stiff_Leg_Barbell_Good_Morning', 'hz:0115'], bar: true, stiff: true, startTall: true,
}) satisfies SideExercise;
