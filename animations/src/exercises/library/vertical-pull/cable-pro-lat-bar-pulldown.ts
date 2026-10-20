// Sit with feet flat and thighs parallel to the floor beneath the pad.
// Pull the specialized lat bar toward the chest, then return to full reach.
import type { SideExercise } from '@/exercise.ts';
import { sidePulldown } from './_vertical-pull-1.ts';

export default sidePulldown({
  id: 'cable-pro-lat-bar-pulldown', name: '绳索专业背阔肌杆高位下拉', en: 'Cable Pro Lat Bar Pulldown',
  equipment: ['cable', 'machine'], sources: ['hz:0197'],
}, { attachment: 'bar', wide: true }) satisfies SideExercise;
