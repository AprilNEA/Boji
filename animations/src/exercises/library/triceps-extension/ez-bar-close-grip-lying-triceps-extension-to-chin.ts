// The torso stays supported while the upper arm holds its fixed pressing position.
// The elbow bends under control, then extends without moving the upper arm.
import { makeLyingExtension } from './_triceps-extension-3.ts';

export default makeLyingExtension({
  "id": "ez-bar-close-grip-lying-triceps-extension-to-chin",
  "name": "曲杆窄握仰卧下巴臂屈伸",
  "en": "EZ Bar Close-Grip Lying Triceps Extension to Chin",
  "equipment": [
    "ez-bar"
  ],
  "sources": [
    "fe:Lying_Close-Grip_Barbell_Triceps_Press_To_Chin"
  ]
}, { kind: 'ez', lower: 'chin' });
