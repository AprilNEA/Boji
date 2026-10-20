// Seated Arnold press, front view. The dumbbells start at the front of the shoulders with bent elbows.
// Both arms press to full overhead extension on a supported bench, then lower under control.
import { type PressInfo, frontPress } from './_vertical-press-1.ts';

export default frontPress({
  id: 'dumbbell-seated-arnold-press',
  name: '坐姿哑铃阿诺德推举',
  meta: {
    en: 'Dumbbell Seated Arnold Press', equipment: ['dumbbell'],
    sources: ['fe:Arnold_Dumbbell_Press', 'hz:2137', 'hz:0287'],
  },
  implement: 'dumbbell',
  seated: true,
  style: 'arnold',
});
