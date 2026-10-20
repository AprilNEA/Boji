// Start beside a shoulder-high cable with the handle at the chest and feet hip-width apart.
// Press both hands forward, then rotate the torso a quarter turn away from the pulley.
// The hips and soles stay square and planted during the anti-rotation press.
import { cableRotation, lerpN, standing } from './_core-rotation-2.ts';

export default cableRotation({
  id: 'cable-pallof-press-with-rotation',
  name: '绳索帕洛夫推举转体',
  en: 'Cable Pallof Press with Rotation',
  sources: ['fe:Pallof_Press_With_Rotation'],
  start: [0, 264, 48],
  end: [39, 248, 89],
  columnX: -184,
  pulleyY: 178,
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.7 }, { m: 'pecs', scale: 0.4 }],
  body: (p) => standing(35, 195, lerpN(0, 42, p)),
  poster: 0.32,
});
