// Start with a barbell across the upper back, the front foot planted and the rear foot on a flat bench.
// Lower with a straight back until the front thigh is parallel, then drive through the front heel.
// The bench foot stays fixed and the bar remains over the upper back.
import { sideLunge } from './_lunge-split-1.ts';

export default sideLunge({
  id: 'barbell-bulgarian-split-squat', name: '杠铃保加利亚分腿蹲', kind: 'bulgarian', bar: true,
  meta: { en: 'Barbell Bulgarian Split Squat', family: 'lunge-split', equipment: ['barbell', 'bench'], sources: ['fe:One_Leg_Barbell_Squat'] },
});
