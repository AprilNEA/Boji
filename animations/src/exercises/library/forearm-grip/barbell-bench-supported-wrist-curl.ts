// Kneel facing a raised flat bench with both forearms supported and the wrists past the pad edge.
// With palms up, flex only the wrists to lift the barbell, then lower while the forearms stay on the pad.
import { wristCurl } from './_forearm-grip-1.ts';

export default wristCurl({
  id: 'barbell-bench-supported-wrist-curl', name: '杠铃凳上正握腕弯举', en: 'Barbell Bench-Supported Wrist Curl',
  sources: ['fe:Palms-Up_Barbell_Wrist_Curl_Over_A_Bench', 'hz:1412'], implement: 'barbell', reverse: false, bench: true,
});
