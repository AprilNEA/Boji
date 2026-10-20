// Incline dumbbell shoulder press, side view. The back stays on a steep incline bench while dumbbells begin at shoulder height.
// Both arms press overhead to lockout and lower under control. The feet remain flat on the floor.
import { sidePress } from './_vertical-press-1.ts';

export default sidePress({
  id: 'dumbbell-incline-shoulder-press',
  name: '上斜哑铃肩上推举',
  meta: { en: 'Dumbbell Incline Shoulder Press', equipment: ['dumbbell', 'bench'], sources: ['hz:0325'] },
  implement: 'dumbbell',
  seated: true,
  incline: true,
});
