// The torso stays supported while the upper arm holds its fixed pressing position.
// The elbow bends under control, then extends without moving the upper arm.
import { makeDeclineEz } from './_triceps-extension-3.ts';

export default makeDeclineEz({
  "id": "ez-bar-decline-triceps-extension",
  "name": "曲杆下斜臂屈伸",
  "en": "EZ Bar Decline Triceps Extension",
  "equipment": [
    "ez-bar"
  ],
  "sources": [
    "fe:Decline_EZ_Bar_Triceps_Extension",
    "hz:2186"
  ]
}, false);
