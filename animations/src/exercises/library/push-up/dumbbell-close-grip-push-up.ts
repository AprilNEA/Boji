// Grip two stable dumbbells directly under the shoulders while holding a rigid high plank.
// Keep both elbows close to the ribs as the chest lowers, then press back to straight supporting arms.
import type { SideExercise } from '@/exercise.ts';
import { floorDumbbells, floorPush, tricepsMuscles } from './_push-up-2.ts';

export default floorPush({
  id: 'dumbbell-close-grip-push-up', name: '哑铃窄距俯卧撑', en: 'Dumbbell Close-Grip Push-Up',
  equipment: ['bodyweight', 'dumbbell'], sources: ['hz:0660'], muscles: tricepsMuscles(), dynamic: floorDumbbells(),
}) satisfies SideExercise;
