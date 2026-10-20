// Stand facing a low pulley and hold one handle with the working arm at the side.
// Keep the elbow beside the ribs while the pronated hand curls the handle upward.
import { standingCableCurl } from './_biceps-curl-2.ts';

export default standingCableCurl({
  id: 'cable-single-arm-reverse-curl', name: '绳索单臂反握弯举', en: 'Cable Single-Arm Reverse Curl',
  sources: ['hz:1413'],
}, { unilateral: true, reverse: true });
