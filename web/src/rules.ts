import type {Fault,Reading,Route,Phase} from './types';

export type SignalValue = 0|1|null;
export interface RepairPreview {bit:SignalValue;phase:SignalValue}

// A prediction from the one public reading, never another device query.
// Unknown dimensions remain unknown even if their repair switch is on.
export function repairPreview(reading:Reading|null,repair:Repair):RepairPreview {
  let bit:SignalValue=null, phase:SignalValue=null;
  if(reading?.tool==='z'&&/^[01]$/.test(reading.bits))bit=Number(reading.bits) as SignalValue;
  if(reading?.tool==='x'&&/^[01]$/.test(reading.bits))phase=Number(reading.bits) as SignalValue;
  if(reading?.tool==='bell'&&/^[01]{2}$/.test(reading.bits)){
    bit=Number(reading.bits[0]) as SignalValue;
    phase=Number(reading.bits[1]) as SignalValue;
  }
  return {bit:bit===null?null:(bit^Number(repair.bit)) as SignalValue,phase:phase===null?null:(phase^Number(repair.phase)) as SignalValue};
}

export interface Repair {bit:boolean;phase:boolean}

export function repairFault(repair:Repair):Fault {
  return repair.bit ? (repair.phase ? 'Y' : 'X') : (repair.phase ? 'Z' : 'I');
}

export function canProbe(shift: {phase: string; bell_tokens: number}, tool: string): boolean {
  return shift.phase === 'choose_tool' && ['z', 'x', 'bell'].includes(tool) && (tool !== 'bell' || shift.bell_tokens > 0);
}

export function routePlan(route:unknown,phase:Phase|null):{route:Route;confirm:boolean}|null {
  if(typeof route!=='string'||!['story','bits','phase','entanglement'].includes(route))return null;
  return {route:route as Route,confirm:phase!==null&&phase!=='complete'};
}
