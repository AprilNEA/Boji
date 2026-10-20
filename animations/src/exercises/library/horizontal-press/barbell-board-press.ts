// Lie on a flat bench with a secured board stack over the chest and feet planted.
// Lower the bar to the boards, pause at contact, then press to lockout with tucked elbows.
import { barbellPress } from './_horizontal-press-1.ts';

export default barbellPress({
  id: 'barbell-board-press', name: '杠铃垫板卧推', en: 'Barbell Board Press', sources: ['fe:Board_Press'], support: 'flat', board: true, grip: 'close',
});
