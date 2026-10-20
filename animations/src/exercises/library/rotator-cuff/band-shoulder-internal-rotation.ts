// Stand side-on to an elbow-height band with the right elbow pinned against the ribs.
// Rotate the bent forearm from away from the torso to across the abdomen; the elbow stays fixed.
import type { FrontExercise } from '@/exercise.ts';
import { tuckedRotation } from './_rotator-cuff.ts';
export default tuckedRotation({ id: 'band-shoulder-internal-rotation', name: '弹力带肩内旋', en: 'Band Shoulder Internal Rotation', sources: ['fe:Internal_Rotation_with_Band'], device: 'band', external: false }) satisfies FrontExercise;
