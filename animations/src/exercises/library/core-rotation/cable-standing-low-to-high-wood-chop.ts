// Start beside a low cable in a shallow squat, with both hands close to the front knee.
// Drive through the legs and rotate while lifting the handle diagonally overhead across the body.
// The arms remain extended and both feet stay planted during the controlled return.
import { cableRotation, lerpN, standing } from './_core-rotation-2.ts';

export default cableRotation({
  id: 'cable-standing-low-to-high-wood-chop',
  name: '绳索站姿低位上斜伐木',
  en: 'Cable Standing Low-to-High Wood Chop',
  sources: ['fe:Standing_Cable_Lift'],
  start: [-36, 114, 78],
  end: [44, 365, 82],
  columnX: -184,
  pulleyY: 392,
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.75 }, { m: 'delts', scale: 0.4 }],
  body: (p) => standing(53, lerpN(125, 190, p), lerpN(-28, 32, p), lerpN(24, 0, p)),
  poster: 0.31,
});
