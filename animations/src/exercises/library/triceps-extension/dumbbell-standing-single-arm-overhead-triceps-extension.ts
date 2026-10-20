// The torso stays tall and the upper arm remains beside the head.
// The elbow bends behind the head, then extends to a controlled lockout.
import { makeOverhead } from './_triceps-extension-3.ts';

export default makeOverhead({
  "id": "dumbbell-standing-single-arm-overhead-triceps-extension",
  "name": "哑铃站姿单臂颈后臂屈伸",
  "en": "Dumbbell Standing Single-Arm Overhead Triceps Extension",
  "equipment": [
    "dumbbell"
  ],
  "sources": [
    "fe:Standing_One-Arm_Dumbbell_Triceps_Extension",
    "hz:0423",
    "hz:0430"
  ]
}, { kind: 'dumbbell', single: true });
