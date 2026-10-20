// Start upright with both hands on a low handle at the waist and the feet shoulder-width apart.
// Keep the arms long while lifting diagonally to the opposite shoulder and rotating the torso.
// Both feet remain flat and the cable stays connected to the moving handle.
import { cableRotation, lerpN, standing } from './_core-rotation-2.ts';

export default cableRotation({
  id: 'cable-standing-diagonal-lift',
  name: '绳索站姿斜向上提',
  en: 'Cable Standing Diagonal Lift',
  sources: ['hz:0230'],
  start: [-30, 188, 50],
  end: [58, 295, 96],
  columnX: -184,
  pulleyY: 390,
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.65 }],
  body: (p) => standing(43, lerpN(176, 188, p), lerpN(0, 32, p)),
  poster: 0.31,
});
