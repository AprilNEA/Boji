// The torso stays hinged with the upper arm parallel to the floor.
// The elbow changes from about 90° to full extension while the shoulder stays still.
import { makeKickback } from './_triceps-extension-3.ts';

export default makeKickback({
  "id": "dumbbell-triceps-kickback",
  "name": "哑铃俯身臂屈伸",
  "en": "Dumbbell Triceps Kickback",
  "equipment": [
    "dumbbell"
  ],
  "sources": [
    "hz:0333",
    "hz:1741",
    "hz:0420"
  ]
}, {});
