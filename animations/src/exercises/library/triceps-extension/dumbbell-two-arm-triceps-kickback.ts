// The torso stays hinged with the upper arm parallel to the floor.
// The elbow changes from about 90° to full extension while the shoulder stays still.
import { makeKickback } from './_triceps-extension-3.ts';

export default makeKickback({
  "id": "dumbbell-two-arm-triceps-kickback",
  "name": "哑铃双臂俯身臂屈伸",
  "en": "Dumbbell Two-Arm Triceps Kickback",
  "equipment": [
    "dumbbell"
  ],
  "sources": [
    "fe:Tricep_Dumbbell_Kickback",
    "fe:Standing_Bent-Over_Two-Arm_Dumbbell_Triceps_Extension"
  ]
}, {});
