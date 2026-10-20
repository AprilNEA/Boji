// Stand facing the cable with a shoulder-width stance and both hands just in front of the chest.
// Rotate the trunk and softly bent arms across the body, alternating from one side to the other.
// The feet remain flat and the cable line stays attached to the two-handed handle.
import { cableRotation, lerpN, standing } from './_core-rotation-2.ts';

export default cableRotation({
  id: 'cable-standing-rotation',
  name: '绳索站姿转体',
  en: 'Cable Standing Rotation',
  sources: ['hz:0243'],
  start: [-54, 255, 77],
  end: [54, 255, 77],
  columnX: -184,
  pulleyY: 250,
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.75 }],
  body: (p) => standing(38, 193, lerpN(-34, 34, p)),
  poster: 0.31,
});
