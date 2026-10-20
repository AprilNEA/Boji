// The torso stays supported while the upper arm holds its fixed pressing position.
// The elbow bends under control, then extends without moving the upper arm.
import { makeJmPress } from './_triceps-extension-3.ts';

export default makeJmPress({
  "id": "ez-bar-jm-press",
  "name": "曲杆半程臂屈伸卧推",
  "en": "EZ-Bar JM Press",
  "equipment": [
    "ez-bar"
  ],
  "sources": [
    "hz:0450"
  ]
});
