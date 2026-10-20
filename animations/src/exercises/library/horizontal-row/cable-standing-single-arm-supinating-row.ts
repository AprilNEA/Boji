// Stand back from a low cable in a broad, stable stance with the arm extended.
// Retract the shoulder and row one handle in while turning the palm upward.
import type { SideExercise } from '@/exercise.ts';
import { standingCableRow } from './_horizontal-row-2.ts';

export default standingCableRow({
  id: 'cable-standing-single-arm-supinating-row', name: '站姿单臂旋后绳索划船', en: 'Cable Standing Single-Arm Supinating Row',
  equipment: ['cable'], sources: ['fe:Shotgun_Row'], single: true, split: true, handle: 'single', rotate: true,
}) satisfies SideExercise;
