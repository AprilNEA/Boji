// Seated Bradford press, side view. The bar moves from the front shoulders, above the head, to behind the head.
// The elbows do not fully lock out during the transition. The bench holds the upright torso steady.
import { bradfordPress } from './_vertical-press-1.ts';

export default bradfordPress({
  id: 'barbell-seated-bradford-press',
  name: '坐姿杠铃前后交替推举',
  meta: { en: 'Barbell Seated Bradford Press', equipment: ['barbell', 'bench'], sources: ['fe:Bradford_Rocky_Presses', 'hz:0087'] },
  seated: true,
});
