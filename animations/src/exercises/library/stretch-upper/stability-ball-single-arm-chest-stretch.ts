// Kneel beside the ball with one elbow supported on top. Lower the torso while that elbow stays fixed.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { SideExercise } from '@/exercise.ts';
import { sideUpper } from './_stretch-upper.ts';

export default sideUpper({
  id: 'stability-ball-single-arm-chest-stretch', name: '健身球单臂胸部拉伸', en: 'Stability Ball Single-Arm Chest Stretch', equipment: ['stability-ball', 'mat'], sources: ['fe:Chest_Stretch_on_Stability_Ball'],
}, 'ball-single-chest', [{ m: 'pecs', side: 'near' }, { m: 'delts', side: 'near', scale: 0.35 }]) satisfies SideExercise;
