// Start with shoulder-width feet and a bar balanced across the upper back.
// Step the working foot wide, sit into that hip and keep the planted trailing leg almost straight.
// Return tall, then repeat the same controlled lateral lunge on the other side.
import type { FrontExercise } from '@/exercise.ts';
import { lateralLunge } from './_lateral-lunge.ts';

export default lateralLunge({
  id: 'barbell-alternating-lateral-lunge',
  name: '杠铃交替侧弓步',
  en: 'Barbell Alternating Lateral Lunge',
  sources: ['hz:1410', 'hz:0097'],
  load: 'barbell',
  stance: 'step',
  alternate: true,
  toeOut: 10,
}) satisfies FrontExercise;
