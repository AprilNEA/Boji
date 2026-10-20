// The torso stays tall and the upper arm remains beside the head.
// The elbow bends behind the head, then extends to a controlled lockout.
import { makeOverhead } from './_triceps-extension-3.ts';

export default makeOverhead({
  "id": "dumbbell-single-arm-overhead-triceps-extension",
  "name": "哑铃单臂颈后臂屈伸",
  "en": "Dumbbell Single-Arm Overhead Triceps Extension",
  "equipment": [
    "dumbbell"
  ],
  "sources": [
    "fe:Dumbbell_One-Arm_Triceps_Extension"
  ]
}, { kind: 'dumbbell', seat: 'bench', single: true });
