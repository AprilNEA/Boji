// Sit with flat feet and thighs secured beneath the pad, holding parallel handles.
// Pull both handles toward the upper chest, then control the return.
import type { SideExercise } from '@/exercise.ts';
import { sidePulldown } from './_vertical-pull-1.ts';

export default sidePulldown({
  id: 'cable-dual-handle-neutral-grip-lat-pulldown', name: '绳索双把对握高位下拉', en: 'Cable Dual-Handle Neutral-Grip Lat Pulldown',
  equipment: ['cable', 'machine'], sources: ['hz:0818'],
}, { attachment: 'd', neutral: true }) satisfies SideExercise;
