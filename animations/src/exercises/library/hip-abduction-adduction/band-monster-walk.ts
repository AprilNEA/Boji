// Start in a shallow athletic stance with bands around the knees and ankles.
// Short alternating steps travel forward in depth while the knees stay pressed gently apart.
// The torso remains braced and level; the loop returns to the same stance.
import type { FrontExercise } from '@/exercise.ts';
import { project } from '@/front-rig.ts';
import { bandCurve, miniBandPoints } from '@/exercises/equipment/index.ts';
import { standingPose } from './_hip-abduction-adduction.ts';

const step = (t: number, offset: number): number => Math.max(0, Math.sin(Math.PI * 2 * (t + offset)));

export default {
  id: 'band-monster-walk',
  name: '弹力带怪兽走',
  view: 'front',
  tl: { total: 3.4 },
  meta: { en: 'Band Monster Walk', family: 'hip-abduction-adduction', equipment: ['band'], sources: ['fe:Monster_Walk'] },
  muscles: [
    { m: 'abductors', side: 'both', e: () => 0.8 },
    { m: 'glutes', scale: 0.65, e: () => 0.65, region: { view: 'front', part: 'pelvis', c: [0, 12], s: [34, 18] } },
    { m: 'quads', side: 'both', scale: 0.3, e: () => 0.35 },
  ],
  dynamic: [
    bandCurve((J) => miniBandPoints(project(J.knee_r), project(J.knee_l), 5), 'front', 'Knee Band'),
    bandCurve((J) => miniBandPoints(project(J.ankle_r), project(J.ankle_l), 4), 'front', 'Ankle Band'),
  ],
  // A raised advancing foot is more recognizable than the neutral stance.
  poster: 0.25,
  pose(t) {
    const l = step(t, 0), r = step(t, 0.5);
    return standingPose({
      // Each advancing foot clears the floor, then travels toward the viewer with band tension.
      l: { target: [32 + 8 * l, 13 + 20 * l, 8 + 34 * l] },
      r: { target: [-32 - 8 * r, 13 + 20 * r, 8 + 34 * r] },
    }, [5 * (l - r), 193, 0]);
  },
} satisfies FrontExercise;
