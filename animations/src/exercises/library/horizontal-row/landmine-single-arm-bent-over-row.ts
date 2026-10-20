// Landmine single-arm bent-over row, side view. Stand with soft knees and a fixed hip hinge.
// The near hand pulls the loaded sleeve toward the lower ribs, while the other hand supports on the knee.
// The landmine end stays anchored, and the torso does not twist or swing.
import type { SideExercise } from '@/exercise.ts';
import { makeLandmineRow } from './_horizontal-row-3.ts';

export default makeLandmineRow({
  id: 'landmine-single-arm-bent-over-row', name: '地雷杆单臂俯身划船', en: 'Landmine Single-Arm Bent-Over Row',
  equipment: ['landmine', 'barbell'], sources: ['hz:0589'],
}, { single: true }) satisfies SideExercise;
