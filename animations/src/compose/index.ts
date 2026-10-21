// Compose one exercise and palette into a Lottie animation. Side-view exercises go to side.ts and front-view
// exercises to front.ts. shared.ts holds the floor, prop and muscle layers, the auto zoom and the output that
// both views use.
import type { Exercise } from '@/exercise.ts';
import type { PaletteName } from '@/draw/palettes.ts';
import { composeFront } from './front.ts';
import { composeSide } from './side.ts';
import type { Composition } from './shared.ts';

export { FPS, muscleEffort, type Composition } from './shared.ts';

export function compose(ex: Exercise, palName: PaletteName): Composition {
  return ex.view === 'front' ? composeFront(ex, palName) : composeSide(ex, palName);
}
