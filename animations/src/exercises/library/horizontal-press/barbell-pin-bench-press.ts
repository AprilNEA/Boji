// Lie in a rack with feet planted and the bar resting on chest-height safety pins.
// Drive from the pins to lockout, then return the bar to the fixed pins before each rep.
import { barbellPress } from './_horizontal-press-1.ts';

export default barbellPress({
  id: 'barbell-pin-bench-press', name: '杠铃插销卧推', en: 'Barbell Pin Bench Press', sources: ['fe:Pin_Presses', 'hz:1751'], support: 'flat', grip: 'close', pins: true,
});
