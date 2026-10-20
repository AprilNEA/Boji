// Seated cable shoulder press, side view. The low-pulley handles begin at shoulder height with bent elbows.
// Both hands press upward to full extension and lower while cable tension remains. The bench keeps the torso upright.
import { sidePress } from './_vertical-press-1.ts';

export default sidePress({
  id: 'cable-seated-shoulder-press',
  name: '坐姿绳索肩上推举',
  meta: { en: 'Cable Seated Shoulder Press', equipment: ['cable', 'bench'], sources: ['fe:Seated_Cable_Shoulder_Press'] },
  implement: 'cable',
  seated: true,
});
