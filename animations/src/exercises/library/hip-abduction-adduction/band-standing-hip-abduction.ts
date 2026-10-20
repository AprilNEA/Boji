// Stand tall beside a fixed anchor, with the band attached around the working ankle.
// The straight working leg abducts about 40° in the frontal plane.
// The support foot, pelvis and held anchor stay fixed; the band stays under tension.
import type { FrontExercise } from '@/exercise.ts';
import { lerp } from '@/math.ts';
import { project } from '@/front-rig.ts';
import { bandLine, workTL } from '@/exercises/equipment/index.ts';
import { standingPose } from './_hip-abduction-adduction.ts';

const tl = workTL(0.4);
const ANCHOR: [number, number] = [120, 416];

export default {
  id: 'band-standing-hip-abduction',
  name: '弹力带站姿髋外展',
  view: 'front',
  tl,
  meta: { en: 'Band Standing Hip Abduction', family: 'hip-abduction-adduction', equipment: ['band'], sources: ['fe:Band_Hip_Adductions'] },
  muscles: [{ m: 'abductors', side: 'r' }, { m: 'glutes', scale: 0.6, region: { view: 'front', part: 'pelvis', c: [-9, 12], s: [20, 18] } }],
  props: (pal) => ({ back: [
    { kind: 'box', nm: 'anchor-post', color: pal.metalDark, c: [120, 290], s: [18, 264], r: 6 },
    { kind: 'box', nm: 'anchor-base', color: pal.metalDark, c: [120, 448], s: [78, 8], r: 3 },
  ] }),
  propsBox: [-151, 159],
  dynamic: [bandLine((J) => [ANCHOR, project(J.ankle_r)], 'front', 'Ankle Band')],
  pose(t) {
    const p = tl.at(t).p;
    const pose = standingPose({
      l: { target: [27, 13, 5] },
      // A 184 px hip-to-ankle reach keeps the knee at about 175° at the 40° top position.
      r: { target: [lerp(-27, -135, p), lerp(13, 56, p), 5] },
    });
    // One hand steadies on the post. The working leg remains straight and the torso does not lean.
    pose.arms = { l: { target: [94, 228, 8] }, r: { target: [-46, 213, 20] } };
    return pose;
  },
} satisfies FrontExercise;
