// The torso stays supported while the upper arm holds its fixed pressing position.
// The elbow bends under control, then extends without moving the upper arm.
import { makeLyingExtension } from './_triceps-extension-3.ts';

export default makeLyingExtension({
  "id": "dumbbell-single-arm-lying-triceps-extension",
  "name": "哑铃单臂仰卧臂屈伸",
  "en": "Dumbbell Single-Arm Lying Triceps Extension",
  "equipment": [
    "dumbbell"
  ],
  "sources": [
    "hz:1735"
  ]
}, { kind: 'dumbbell', lower: 'forehead', single: true });
