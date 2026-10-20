// Stand side-on to an elbow-height pulley with the working elbow held against the ribs.
// Rotate the right forearm out from the abdomen while the upper arm remains completely still.
import type { FrontExercise } from '@/exercise.ts';
import { tuckedRotation } from './_rotator-cuff.ts';
export default tuckedRotation({ id: 'cable-standing-external-rotation', name: '绳索站姿肩外旋', en: 'Cable Standing External Rotation', sources: ['fe:External_Rotation_with_Cable'], device: 'cable', external: true }) satisfies FrontExercise;
