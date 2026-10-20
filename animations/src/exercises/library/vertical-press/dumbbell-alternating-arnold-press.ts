// Alternating Arnold-style dumbbell press, front view. One dumbbell reaches overhead as the torso leans slightly away.
// The other dumbbell stays at the shoulder and the sides exchange smoothly. The feet remain planted.
import { frontPress } from './_vertical-press-1.ts';

export default frontPress({
  id: 'dumbbell-alternating-arnold-press',
  name: '交替哑铃阿诺德推举',
  meta: { en: 'Dumbbell Alternating Arnold Press', equipment: ['dumbbell'], sources: ['fe:See-Saw_Press_Alternating_Side_Press'] },
  implement: 'dumbbell',
  alternating: true,
  twisting: true,
  style: 'arnold',
});
