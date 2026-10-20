// Balance seated with a straight back, bent knees, and feet lifted from the floor.
// Keep the hands together in front of the chest while rotating the rib cage side to side.
// Maintain the V-shaped torso and thigh position during the controlled twist.
import { seatedTwist } from './_core-rotation-1.ts';

export default seatedTwist({
  id: 'russian-twist', name: '俄罗斯转体', en: 'Russian Twist',
  equipment: ['bodyweight'], sources: ['fe:Russian_Twist', 'hz:0687'],
}, { liftedFeet: true });
