// Sit upright with bent knees, grounded feet, and hands behind the head.
// Rotate the torso so one elbow moves toward the opposite knee.
// Return to a tall seated position and alternate without moving the feet.
import { seatedTwist } from './_core-rotation-1.ts';

export default seatedTwist({
  id: 'seated-spine-twist', name: '坐姿脊柱转体', en: 'Seated Spine Twist',
  equipment: ['bodyweight'], sources: ['hz:2329'],
}, { handsHead: true });
