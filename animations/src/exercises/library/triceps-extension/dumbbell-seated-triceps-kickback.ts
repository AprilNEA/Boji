// The torso stays hinged with the upper arm parallel to the floor.
// The elbow changes from about 90° to full extension while the shoulder stays still.
import { makeKickback } from './_triceps-extension-3.ts';

export default makeKickback({
  "id": "dumbbell-seated-triceps-kickback",
  "name": "哑铃坐姿俯身臂屈伸",
  "en": "Dumbbell Seated Triceps Kickback",
  "equipment": [
    "dumbbell"
  ],
  "sources": [
    "hz:1737",
    "hz:0394"
  ]
}, { seated: true });
