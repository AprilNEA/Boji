// The torso stays tall and the upper arm remains beside the head.
// The elbow bends behind the head, then extends to a controlled lockout.
import { makeOverhead } from './_triceps-extension-3.ts';

export default makeOverhead({
  "id": "ez-bar-seated-overhead-triceps-extension",
  "name": "曲杆坐姿颈后臂屈伸",
  "en": "EZ-Bar Seated Overhead Triceps Extension",
  "equipment": [
    "ez-bar"
  ],
  "sources": [
    "hz:0453"
  ]
}, { kind: 'ez', seat: 'bench' });
