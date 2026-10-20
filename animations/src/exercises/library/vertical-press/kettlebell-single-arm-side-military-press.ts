// Single-arm side military kettlebell press, front view. The bell begins racked beside one shoulder.
// The arm presses up and out to lockout while the head tracks the working side. The free arm stays relaxed.
import { frontPress } from './_vertical-press-1.ts';

export default frontPress({
  id: 'kettlebell-single-arm-side-military-press',
  name: '壶铃单臂侧向推举',
  meta: { en: 'Kettlebell Single-Arm Side Military Press', equipment: ['kettlebell'], sources: ['fe:One-Arm_Kettlebell_Military_Press_To_The_Side'] },
  implement: 'kettlebell',
  unilateral: 'l',
  style: 'side-military',
});
