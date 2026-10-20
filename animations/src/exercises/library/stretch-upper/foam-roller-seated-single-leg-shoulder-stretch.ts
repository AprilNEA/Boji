// Sit with the leg extended and hold the roller on the thighs. Raise the roller to shoulder height with straight arms.
// The stretch eases into a long hold, returns to neutral, and keeps the roller in both hands.
import type { SideExercise } from '@/exercise.ts';
import { sideUpper } from './_stretch-upper.ts';

export default sideUpper({
  id: 'foam-roller-seated-single-leg-shoulder-stretch', name: '泡沫轴坐姿单腿肩部拉伸', en: 'Foam Roller Seated Single-Leg Shoulder Stretch', equipment: ['foam-roller', 'mat'], sources: ['hz:2209'],
}, 'roller-seated-raise', [{ m: 'pecs' }, { m: 'delts', side: 'both', scale: 0.4 }, { m: 'triceps', side: 'both', scale: 0.3 }]) satisfies SideExercise;
