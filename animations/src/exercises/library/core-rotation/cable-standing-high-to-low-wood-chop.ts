// Start side-on to a high cable with both hands overhead and feet set wide.
// Pull the handle diagonally to the front knee as the trunk rotates and the knees soften.
// The arms stay long, the cable stays taut, and the trailing foot stays on the floor.
import { cableRotation, lerpN, standing } from './_core-rotation-2.ts';

export default cableRotation({
  id: 'cable-standing-high-to-low-wood-chop',
  name: '绳索站姿高位下斜伐木',
  en: 'Cable Standing High-to-Low Wood Chop',
  sources: ['fe:Standing_Cable_Wood_Chop'],
  start: [-48, 340, 80],
  end: [50, 130, 65],
  columnX: -184,
  pulleyY: 72,
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.75 }, { m: 'delts', scale: 0.35 }],
  body: (p) => standing(53, lerpN(191, 125, p), lerpN(-8, 36, p), lerpN(0, 24, p)),
  poster: 0.31,
});
