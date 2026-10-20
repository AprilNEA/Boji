// Sit with flat feet and the thighs locked beneath the pad.
// Pull the wide overhand bar toward the upper chest without moving the torso.
import type { FrontExercise } from '@/exercise.ts';
import { frontPulldown } from './_vertical-pull-1.ts';

export default frontPulldown({
  id: 'cable-wide-grip-lat-pulldown', name: '绳索宽握高位下拉', en: 'Cable Wide-Grip Lat Pulldown',
  equipment: ['cable'], sources: ['fe:Wide-Grip_Lat_Pulldown', 'hz:0150'],
}, { wide: true }) satisfies FrontExercise;
