// Seated barbell military press, side view. The bar lowers to the front collarbone from overhead.
// Both arms extend to a full overhead lockout and lower under control. The feet stay flat beside the bench.
import { sidePress } from './_vertical-press-1.ts';

export default sidePress({
  id: 'barbell-seated-military-press',
  name: '坐姿杠铃军用推举',
  meta: { en: 'Barbell Seated Military Press', equipment: ['barbell', 'bench'], sources: ['fe:Seated_Barbell_Military_Press'] },
  implement: 'barbell',
  seated: true,
});
