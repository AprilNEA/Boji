// Rickshaw-frame deadlift, side view. The athlete stands centered in the loaded frame with handles at the sides.
// The frame rises through simultaneous knee and hip extension, then lowers toward the floor under control.
import type { SideExercise } from '@/exercise.ts'; import { floorDeadlift } from './_hinge-2.ts';
export default floorDeadlift({id:'rickshaw-frame-deadlift',name:'框架硬拉',en:'Rickshaw Frame Deadlift',equipment:['other'],sources:['fe:Rickshaw_Deadlift'],muscles:[{m:'quads',side:'both'},{m:'glutes',scale:0.85},{m:'hamstrings',side:'both',scale:0.7},{m:'lowerBack',scale:0.45},{m:'forearms',side:'both',scale:0.35}]},{implement:'frame'}) satisfies SideExercise;
