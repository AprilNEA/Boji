// Standing in a small hip hinge facing a waist-height band anchor. One hand rows to the waist.
// The feet stay planted and the trunk remains braced.
import type { SideExercise } from '@/exercise.ts';
import { standingRow } from './_horizontal-row-1.ts';

export default standingRow({
  id: 'band-standing-single-arm-low-row',
  name: '弹力带站姿单臂低位划船',
  meta: { en: 'Band Standing Single-Arm Low Row', family: 'horizontal-row', equipment: ['band'], sources: ['hz:0988'] },
}, { band: true, single: true, hinged: true }) satisfies SideExercise;
