// The torso stays supported while the upper arm holds its fixed pressing position.
// The elbow bends under control, then extends without moving the upper arm.
import { makeLyingExtension } from './_triceps-extension-3.ts';

export default makeLyingExtension({
  "id": "ez-bar-close-grip-skull-crusher",
  "name": "曲杆窄握仰卧臂屈伸",
  "en": "EZ-Bar Close-Grip Skull Crusher",
  "equipment": [
    "ez-bar"
  ],
  "sources": [
    "fe:EZ-Bar_Skullcrusher"
  ]
}, { kind: 'ez', lower: 'forehead' });
