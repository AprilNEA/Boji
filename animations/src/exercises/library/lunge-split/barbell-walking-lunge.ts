// Start tall with a barbell across the upper back and both feet under the body.
// Step forward into a lunge, drive through the lead heel and continue with the other leg.
// The torso stays upright, the lead foot stays flat and the rear knee stops above the floor.
import { sideLunge } from './_lunge-split-1.ts';

export default sideLunge({
  id: 'barbell-walking-lunge', name: '杠铃行走弓步', kind: 'forward', alternate: true, walking: true, bar: true,
  meta: { en: 'Barbell Walking Lunge', family: 'lunge-split', equipment: ['barbell'], sources: ['fe:Barbell_Walking_Lunge'] },
});
