// Sit tall with the feet flat and both hands holding a cable handle straight in front of the chest.
// Rotate the torso to one side against the middle pulley, then return and repeat to the other side.
// The hips and feet remain stable while the long arms and cable move together.
import { cableRotation, cableSeatProps, lerpN, seated } from './_core-rotation-2.ts';

export default cableRotation({
  id: 'cable-seated-torso-twist',
  name: '绳索坐姿转体',
  en: 'Cable Seated Torso Twist',
  sources: ['hz:2399'],
  start: [-26, 220, 86],
  end: [26, 220, 86],
  columnX: -184,
  pulleyY: 262,
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.7 }],
  body: (p) => seated(lerpN(-30, 30, p)),
  extraProps: cableSeatProps,
  poster: 0.31,
});
