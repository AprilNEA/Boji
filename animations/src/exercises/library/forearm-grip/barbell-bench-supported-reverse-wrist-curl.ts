// Kneel facing a raised flat bench with both forearms supported and the wrists past the pad edge.
// With palms down, extend only the wrists to lift the barbell, then lower without moving the forearms.
import { wristCurl } from './_forearm-grip-1.ts';

export default wristCurl({
  id: 'barbell-bench-supported-reverse-wrist-curl', name: '杠铃凳上反握腕弯举', en: 'Barbell Bench-Supported Reverse Wrist Curl',
  sources: ['fe:Palms-Down_Wrist_Curl_Over_A_Bench', 'hz:1411'], implement: 'barbell', reverse: true, bench: true,
});
