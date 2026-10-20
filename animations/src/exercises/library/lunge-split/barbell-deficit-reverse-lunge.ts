// Start tall with a barbell across the upper back and both feet on a low platform.
// Step one foot backward to the floor, lower into a deep reverse lunge, then return to the platform.
// The working foot stays flat on the platform and the rear knee descends toward the floor.
import { sideLunge } from './_lunge-split-1.ts';

export default sideLunge({
  id: 'barbell-deficit-reverse-lunge', name: '杠铃垫高后撤弓步蹲', kind: 'deficit', alternate: true, bar: true,
  meta: { en: 'Barbell Deficit Reverse Lunge', family: 'lunge-split', equipment: ['barbell', 'step'], sources: ['fe:Elevated_Back_Lunge'] },
});
