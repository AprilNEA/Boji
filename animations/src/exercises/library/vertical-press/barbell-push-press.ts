// Barbell push press, side view. The bar starts across the front shoulders with a tall torso.
// The knees dip only slightly, then the leg drive sends the bar overhead. There is no second dip at lockout.
import { sidePress } from './_vertical-press-1.ts';

export default sidePress({
  id: 'barbell-push-press',
  name: '杠铃借力推举',
  meta: { en: 'Barbell Push Press', equipment: ['barbell'], sources: ['fe:Push_Press'] },
  implement: 'barbell',
  push: true,
});
