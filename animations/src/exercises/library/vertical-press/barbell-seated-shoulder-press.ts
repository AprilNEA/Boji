// Back-supported barbell shoulder press, side view. The bar begins slightly in front of the shoulders.
// Both arms press it overhead and return to shoulder height. The figure keeps the back against the upright pad.
import { sidePress } from './_vertical-press-1.ts';

export default sidePress({
  id: 'barbell-seated-shoulder-press',
  name: '坐姿杠铃肩上推举',
  meta: { en: 'Barbell Seated Shoulder Press', equipment: ['barbell', 'bench'], sources: ['fe:Barbell_Shoulder_Press'] },
  implement: 'barbell',
  seated: true,
});
