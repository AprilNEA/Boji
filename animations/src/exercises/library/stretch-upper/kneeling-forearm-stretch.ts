// Kneel with palms flat and fingers pointing toward the knees. Shift the hips back while palms stay planted.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { SideExercise } from '@/exercise.ts';
import { sideUpper } from './_stretch-upper.ts';

export default sideUpper({
  id: 'kneeling-forearm-stretch', name: '跪姿前臂拉伸', en: 'Kneeling Forearm Stretch', equipment: ['bodyweight', 'mat'], sources: ['fe:Kneeling_Forearm_Stretch'],
}, 'kneeling-forearm', [{ m: 'forearms', side: 'both' }]) satisfies SideExercise;
