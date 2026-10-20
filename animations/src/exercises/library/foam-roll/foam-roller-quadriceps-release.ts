// Lie face down with the torso supported on the forearms.
// Put the roller under one relaxed quadriceps and keep that foot off the ground.
// Roll from just above the knee toward the hip before changing legs.
import type { SideExercise } from '@/exercise.ts';
import { quadricepsRoll } from './_foam-roll.ts';

export default quadricepsRoll({
  id: 'foam-roller-quadriceps-release', name: '泡沫轴股四头肌放松', en: 'Foam Roller Quadriceps Release', sources: ['fe:Quadriceps-SMR'],
}) satisfies SideExercise;
