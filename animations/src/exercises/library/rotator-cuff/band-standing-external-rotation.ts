// Stand side-on to an elbow-height band with the right elbow firmly against the ribs.
// Rotate the bent forearm from across the abdomen outward; the upper arm and elbow do not travel.
import type { FrontExercise } from '@/exercise.ts';
import { tuckedRotation } from './_rotator-cuff.ts';
export default tuckedRotation({ id: 'band-standing-external-rotation', name: '弹力带站姿肩外旋', en: 'Band Standing External Rotation', sources: ['fe:External_Rotation_with_Band'], device: 'band', external: true }) satisfies FrontExercise;
