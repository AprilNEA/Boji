// Sit facing the cable station with the feet planted and the torso quiet.
// One elbow rows close to the body as the other arm extends, then the sides exchange.
import type { SideExercise } from '@/exercise.ts';
import { seatedCableRow } from './_horizontal-row-2.ts';

export default seatedCableRow({
  id: 'cable-seated-alternating-single-arm-row', name: '坐姿交替单臂划船', en: 'Cable Seated Alternating Single-Arm Row',
  equipment: ['cable'], sources: ['hz:0214'], handle: 'single', alternating: true,
}) satisfies SideExercise;
