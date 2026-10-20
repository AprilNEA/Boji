// The torso stays supported while the upper arm holds its fixed pressing position.
// The elbow bends under control, then extends without moving the upper arm.
import { makeLyingExtension } from './_triceps-extension-3.ts';

export default makeLyingExtension({
  "id": "ez-bar-lying-triceps-extension",
  "name": "曲杆仰卧臂屈伸",
  "en": "EZ Bar Lying Triceps Extension",
  "equipment": [
    "ez-bar"
  ],
  "sources": [
    "fe:Lying_Triceps_Press"
  ]
}, { kind: 'ez', lower: 'forehead' });
