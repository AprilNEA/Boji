// Begin in a wide stance with the bar resting across the upper back.
// Shift toward the lead foot, bend that hip and knee, and keep the opposite knee only softly bent.
// Drive through the lead heel to return to the tall, fixed wide stance.
import type { FrontExercise } from '@/exercise.ts';
import { lateralLunge } from './_lateral-lunge.ts';

export default lateralLunge({
  id: 'barbell-lateral-split-squat',
  name: '杠铃侧向分腿蹲',
  en: 'Barbell Lateral Split Squat',
  sources: ['fe:Barbell_Side_Split_Squat'],
  load: 'barbell',
  stance: 'fixed',
  alternate: false,
  toeOut: 30,
}) satisfies FrontExercise;
