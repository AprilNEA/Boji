// Side-view 杠铃拖拉弯举. Begin with a tall torso and the elbows fixed beside the body.
// The forearms curl from nearly straight to about 45° at the elbow, then lower under control.
// The highlighted hand keeps its assigned bar or resistance band throughout the loop.
import { sideCurl } from './_biceps-curl-1.ts';

export default sideCurl({ id: 'barbell-drag-curl', name: '杠铃拖拉弯举', en: 'Barbell Drag Curl', sources: ['fe:Drag_Curl', 'hz:0038'], mode: 'standing', implement: 'barbell', drag: true });
