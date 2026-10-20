// Standing cable shoulder press, side view. The low-pulley handles start at shoulder height before the press.
// Both arms extend directly overhead and return under tension. The torso stays tall between the cable uprights.
import { sidePress } from './_vertical-press-1.ts';

export default sidePress({
  id: 'cable-standing-shoulder-press',
  name: '站姿绳索肩上推举',
  meta: { en: 'Cable Standing Shoulder Press', equipment: ['cable'], sources: ['fe:Cable_Shoulder_Press', 'hz:0219'] },
  implement: 'cable',
});
