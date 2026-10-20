// Sit with both legs extended and hold the roller on the thighs. Roll it forward as both arms lengthen in front.
// The stretch eases into a long hold, returns to neutral, and keeps the roller in both hands.
import type { SideExercise } from '@/exercise.ts';
import { sideUpper } from './_stretch-upper.ts';

export default sideUpper({
  id: 'foam-roller-seated-shoulder-stretch', name: '泡沫轴坐姿肩部拉伸', en: 'Foam Roller Seated Shoulder Stretch', equipment: ['foam-roller', 'mat'], sources: ['hz:2203'],
}, 'roller-seated-forward', [{ m: 'pecs' }, { m: 'delts', side: 'both', scale: 0.4 }, { m: 'triceps', side: 'both', scale: 0.3 }]) satisfies SideExercise;
