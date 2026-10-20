// Standing Bradford press, side view. The bar travels above the head between front and rear shoulder positions.
// The elbows remain soft as the bar crosses overhead. The trunk is upright and the feet are planted.
import { bradfordPress } from './_vertical-press-1.ts';

export default bradfordPress({
  id: 'barbell-standing-bradford-press',
  name: '站姿杠铃前后绕头推举',
  meta: { en: 'Barbell Standing Bradford Press', equipment: ['barbell'], sources: ['fe:Standing_Bradford_Press', 'hz:0105'] },
  seated: false,
});
