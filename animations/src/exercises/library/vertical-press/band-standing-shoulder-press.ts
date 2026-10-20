// Standing band shoulder press, side view. The band is anchored beneath both planted feet and held at shoulder level.
// Both arms press the handles straight overhead, then return with control. The torso remains vertical.
import { sidePress } from './_vertical-press-1.ts';

export default sidePress({
  id: 'band-standing-shoulder-press',
  name: '站姿弹力带肩上推举',
  meta: { en: 'Band Standing Shoulder Press', equipment: ['band'], sources: ['fe:Shoulder_Press_-_With_Bands', 'hz:0997'] },
  implement: 'band',
});
