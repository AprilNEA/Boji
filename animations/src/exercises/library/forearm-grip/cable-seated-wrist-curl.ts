// Sit on a bench facing a low cable pulley with palms up and forearms supported on the thighs.
// Flex the wrists against the straight cable bar, then lower it without lifting the forearms.
import { wristCurl } from './_forearm-grip-1.ts';

export default wristCurl({
  id: 'cable-seated-wrist-curl', name: '绳索坐姿腕弯举', en: 'Cable Seated Wrist Curl',
  sources: ['fe:Cable_Wrist_Curl', 'fe:Seated_Two-Arm_Palms-Up_Low-Pulley_Wrist_Curl'], implement: 'cable', reverse: false,
});
