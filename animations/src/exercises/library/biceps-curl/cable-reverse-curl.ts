// Face the low pulley with planted feet and a straight bar in a pronated grip.
// Hold both upper arms fixed at the ribs while the forearms curl the bar upward.
import { standingCableCurl } from './_biceps-curl-2.ts';

export default standingCableCurl({
  id: 'cable-reverse-curl', name: '绳索反握弯举', en: 'Cable Reverse Curl',
  sources: ['fe:Reverse_Cable_Curl', 'hz:0206'],
}, { reverse: true });
