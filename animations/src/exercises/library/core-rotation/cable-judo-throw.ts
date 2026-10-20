// Start side-on to a low cable with a wide, planted stance and the rope near one shoulder.
// Rotate away from the stack, shift into a forward crunch, and pull the rope down across the body.
// Both feet stay planted while the two hands remain on the rope.
import { cableRotation, lerpN, standing } from './_core-rotation-2.ts';

export default cableRotation({
  id: 'cable-judo-throw',
  name: '绳索柔道过肩摔',
  en: 'Cable Judo Throw',
  sources: ['fe:Cable_Judo_Flip'],
  start: [-52, 300, 72],
  end: [58, 155, 82],
  columnX: -184,
  pulleyY: 390,
  handle: 'rope',
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.6 }],
  body: (p) => standing(54, lerpN(188, 154, p), lerpN(0, 42, p), lerpN(0, 32, p)),
  poster: 0.31,
});
