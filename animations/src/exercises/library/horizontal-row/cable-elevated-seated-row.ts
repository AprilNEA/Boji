// Seated on a raised platform facing a low cable. Both hands row a V-handle to the abdomen.
// The platform and feet stay fixed while the torso remains tall.
import type { SideExercise } from '@/exercise.ts';
import { seatedRow } from './_horizontal-row-1.ts';

export default seatedRow({
  id: 'cable-elevated-seated-row',
  name: '绳索垫高坐姿划船',
  meta: { en: 'Cable Elevated Seated Row', family: 'horizontal-row', equipment: ['cable', 'bench'], sources: ['fe:Elevated_Cable_Rows'] },
}, { elevated: true }) satisfies SideExercise;
