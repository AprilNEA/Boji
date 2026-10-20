// Sit beside a low pulley with the near elbow pinned to the side and the forearm at a right angle to the torso.
// Sweep the handle from the pulley across the abdomen by internally rotating the shoulder; the elbow stays still.
import type { SideExercise } from '@/exercise.ts';
import { seatedCableInternal } from './_rotator-cuff.ts';
export default seatedCableInternal({ id: 'cable-seated-shoulder-internal-rotation', name: '绳索坐姿肩内旋', en: 'Cable Seated Shoulder Internal Rotation', sources: ['fe:Cable_Internal_Rotation'] }) satisfies SideExercise;
