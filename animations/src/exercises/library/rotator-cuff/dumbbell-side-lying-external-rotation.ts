// Lie on the side on a flat bench with the working upper arm parallel to the torso and elbow at 90 degrees.
// Rotate the forearm and dumbbell from forward of the abdomen toward the ceiling without moving the upper arm.
import type { SideExercise } from '@/exercise.ts';
import { sideLyingExternal } from './_rotator-cuff.ts';
export default sideLyingExternal({ id: 'dumbbell-side-lying-external-rotation', name: '哑铃侧卧肩外旋', en: 'Dumbbell Side-Lying External Rotation', sources: ['fe:External_Rotation', 'hz:0863'] }) satisfies SideExercise;
