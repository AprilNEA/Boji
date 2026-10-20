// The torso stays supported while the upper arm holds its fixed pressing position.
// The elbow bends under control, then extends without moving the upper arm.
import { makeLyingExtension } from './_triceps-extension-3.ts';

export default makeLyingExtension({
  "id": "ez-bar-close-grip-lying-triceps-extension-behind-head",
  "name": "曲杆窄握仰卧颈后臂屈伸",
  "en": "EZ-Bar Close-Grip Lying Triceps Extension Behind Head",
  "equipment": [
    "ez-bar"
  ],
  "sources": [
    "hz:1748"
  ]
}, { kind: 'ez', lower: 'behind-head' });
