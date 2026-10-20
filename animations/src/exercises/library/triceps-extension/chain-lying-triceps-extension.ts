// The torso stays supported while the upper arm holds its fixed pressing position.
// The elbow bends under control, then extends without moving the upper arm.
import { makeLyingExtension } from './_triceps-extension-3.ts';

export default makeLyingExtension({
  "id": "chain-lying-triceps-extension",
  "name": "铁链仰卧臂屈伸",
  "en": "Chain Lying Triceps Extension",
  "equipment": [
    "other"
  ],
  "sources": [
    "fe:Chain_Handle_Extension"
  ]
}, { kind: 'chain', lower: 'forehead' });
