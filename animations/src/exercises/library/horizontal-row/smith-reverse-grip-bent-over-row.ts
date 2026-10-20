// Reverse-grip Smith bent-over row, side view. Keep a soft-knee hip hinge and a flat back.
// Pull the supinated bar to the lower chest, keeping both elbows close to the torso.
// The guided bar rises vertically and the hips do not drive or swing it.
import type { SideExercise } from '@/exercise.ts';
import { makeSmithBentRow } from './_horizontal-row-3.ts';

export default makeSmithBentRow({
  id: 'smith-reverse-grip-bent-over-row', name: '史密斯反握俯身划船', en: 'Smith Reverse-Grip Bent-Over Row',
  equipment: ['smith', 'barbell'], sources: ['hz:1361'],
}, { underhand: true }) satisfies SideExercise;
