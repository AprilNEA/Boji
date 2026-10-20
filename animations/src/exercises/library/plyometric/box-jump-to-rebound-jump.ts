// Start from a short ground squat, land softly on the box, and immediately extend off the top.
// Both feet absorb the floor landing. The same rapid box-to-floor cycle covers the repeated-jump source.
import { boxExercise } from './_plyometric-2.ts';

export default boxExercise({
  id: 'box-jump-to-rebound-jump', name: '跳箱接反弹跳', en: 'Box Jump to Rebound Jump',
  sources: ['fe:Quick_Leap', 'fe:Box_Jump_Multiple_Response'], kind: 'rebound',
});
