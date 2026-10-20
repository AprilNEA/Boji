// Lie on the side with the lower knee in front. The upper leg stays long behind the torso.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { SideExercise } from '@/exercise.ts';
import { sideUpper } from './_stretch-upper.ts';

export default sideUpper({
  id: 'side-lying-lat-stretch', name: '侧卧背阔肌拉伸', en: 'Side-Lying Lat Stretch', equipment: ['bodyweight', 'mat'], sources: ['fe:Side-Lying_Floor_Stretch'],
}, 'side-lying-lat', [{ m: 'lats', side: 'both' }, { m: 'obliques', scale: 0.35 }]) satisfies SideExercise;
