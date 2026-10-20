// Stand facing a low pulley and hold one handle with the working arm at the side.
// Keep that upper arm still while the forearm curls the handle to the shoulder.
import { standingCableCurl } from './_biceps-curl-2.ts';

export default standingCableCurl({
  id: 'cable-single-arm-curl', name: '绳索单臂弯举', en: 'Cable Single-Arm Curl',
  sources: ['hz:0190', 'fe:Standing_One-Arm_Cable_Curl'],
}, { unilateral: true });
