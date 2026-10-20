// Start on hands and feet with the knees off the ground and a flat back.
// The harness attaches behind the waist to the sled while opposite limbs alternate.
// The hands support balance and the legs provide the drive without the knees touching down.
import type { SideExercise } from '@/exercise.ts';
import { bearCrawlSledDrag } from './_carry-strongman.ts';

export default bearCrawlSledDrag({
  id: 'sled-bear-crawl-drag', name: '熊爬拖雪橇', en: 'Sled Bear Crawl Drag',
  equipment: ['sled', 'rope'], sources: ['fe:Bear_Crawl_Sled_Drags'],
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.6 }, { m: 'hamstrings', side: 'both', scale: 0.5 }, { m: 'abs', scale: 0.35 }],
}) satisfies SideExercise;
