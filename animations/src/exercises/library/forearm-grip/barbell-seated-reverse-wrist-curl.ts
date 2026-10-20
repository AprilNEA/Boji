// Sit forward with palms down and forearms supported on the upper thighs beyond the knees.
// Raise the barbell by extending the wrists only, then return it slowly with the forearms fixed.
import { wristCurl } from './_forearm-grip-1.ts';

export default wristCurl({
  id: 'barbell-seated-reverse-wrist-curl', name: '杠铃坐姿反向腕弯举', en: 'Barbell Seated Reverse Wrist Curl',
  sources: ['fe:Seated_Palms-Down_Barbell_Wrist_Curl', 'hz:0079', 'hz:0082'], implement: 'barbell', reverse: true,
});
