// The torso stays supported while the upper arm holds its fixed pressing position.
// The elbow bends under control, then extends without moving the upper arm.
import { makeLyingExtension } from './_triceps-extension-3.ts';

export default makeLyingExtension({
  "id": "dumbbell-single-arm-supinated-lying-triceps-extension",
  "name": "哑铃单臂反握仰卧臂屈伸",
  "en": "Dumbbell Single-Arm Supinated Lying Triceps Extension",
  "equipment": [
    "dumbbell"
  ],
  "sources": [
    "fe:One_Arm_Supinated_Dumbbell_Triceps_Extension",
    "hz:0346"
  ]
}, { kind: 'dumbbell', lower: 'behind-head', single: true, supported: true });
