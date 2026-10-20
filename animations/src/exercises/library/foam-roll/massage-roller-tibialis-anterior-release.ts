// Sit with both knees bent and feet flat, then lean forward to reach the shin.
// Hold a massage roller against the outer anterior-tibialis muscles, not the shin bone.
// Roll from below the knee toward the ankle and pause at tender points.
import type { SideExercise } from '@/exercise.ts';
import { tibialisMassage } from './_foam-roll.ts';

export default tibialisMassage({
  id: 'massage-roller-tibialis-anterior-release', name: '按摩棒胫骨前肌放松', en: 'Massage Roller Tibialis Anterior Release', sources: ['fe:Anterior_Tibialis-SMR'],
}) satisfies SideExercise;
