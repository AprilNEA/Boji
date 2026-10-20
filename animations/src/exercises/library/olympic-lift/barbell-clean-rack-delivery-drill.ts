// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell clean rack delivery drill path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { rackDelivery } from './_olympic-lift.ts';

export default rackDelivery({id: 'barbell-clean-rack-delivery-drill', name: '杠铃翻站接杠练习', en: 'Barbell Clean Rack Delivery Drill', sources: ['fe:Rack_Delivery']}) satisfies SideExercise;
