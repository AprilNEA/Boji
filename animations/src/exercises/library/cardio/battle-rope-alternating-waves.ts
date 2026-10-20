// Stand in a shallow athletic stance with one rope end in each hand.
// Rapidly lift one arm to shoulder height while the other drops, creating opposite rope waves.
import type { SideExercise } from '@/exercise.ts';
import { battleRope } from './_cardio-2.ts';

export default {
  ...battleRope({ en: 'Battle Rope Alternating Waves', sources: ['fe:Battling_Ropes', 'hz:0128'] }, '战绳交替波浪'),
  id: 'battle-rope-alternating-waves',
} satisfies SideExercise;
