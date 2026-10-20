// Dumbbell push press, side view. The dumbbells start at shoulder height and the knees make a brief shallow dip.
// Leg drive sends both weights overhead to lockout. The feet remain planted as the weights return to the shoulders.
import { sidePress } from './_vertical-press-1.ts';

export default sidePress({
  id: 'dumbbell-push-press',
  name: '哑铃借力推举',
  meta: { en: 'Dumbbell Push Press', equipment: ['dumbbell'], sources: ['hz:1700'] },
  implement: 'dumbbell',
  push: true,
});
