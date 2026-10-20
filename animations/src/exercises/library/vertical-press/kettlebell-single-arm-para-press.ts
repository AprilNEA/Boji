// Single-arm kettlebell para press, front view. The bell starts at shoulder level with the elbow held out to the side.
// The working arm travels up and slightly out to an overhead lockout. The trunk stays braced and upright.
import { frontPress } from './_vertical-press-1.ts';

export default frontPress({
  id: 'kettlebell-single-arm-para-press',
  name: '壶铃单臂外展推举',
  meta: { en: 'Kettlebell Single-Arm Para Press', equipment: ['kettlebell'], sources: ['fe:One-Arm_Kettlebell_Para_Press'] },
  implement: 'kettlebell',
  unilateral: 'l',
  style: 'para',
});
