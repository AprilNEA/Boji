// Lie in a rack with a braced arch and bands anchored from the top of the frame to the bar.
// Lower to the lower chest and press to lockout as the top bands assist the bottom position.
import { barbellPress } from './_horizontal-press-1.ts';

export default barbellPress({
  id: 'barbell-reverse-band-bench-press', name: '杠铃反向弹力带卧推', en: 'Barbell Reverse-Band Bench Press', sources: ['fe:Reverse_Band_Bench_Press'], support: 'flat', grip: 'close', reverseBand: true, power: true,
});
