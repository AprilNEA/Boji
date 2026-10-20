// The torso stays hinged with the upper arm parallel to the floor.
// The elbow changes from about 90° to full extension while the shoulder stays still.
import { makeKickback } from './_triceps-extension-3.ts';

export default makeKickback({
  "id": "dumbbell-single-arm-triceps-kickback",
  "name": "哑铃单臂俯身臂屈伸",
  "en": "Dumbbell Single-Arm Triceps Kickback",
  "equipment": [
    "dumbbell"
  ],
  "sources": [
    "fe:Standing_Bent-Over_One-Arm_Dumbbell_Triceps_Extension",
    "hz:0354",
    "hz:1740",
    "hz:1742"
  ]
}, { single: true });
