// 一脚的脚跟靠近凳缘，另一脚在地面。
// 箱面脚蹬伸，空中交换两脚位置。
// 对侧脚轻落在凳面并持续交替。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'bench-alternating-step-up-jump', name: '凳上交替登阶跳', en: 'Bench Alternating Step-Up Jump',
  equipment: ['bench'], sources: ['fe:Bench_Sprint'],
}, 'bench-step') satisfies SideExercise;
