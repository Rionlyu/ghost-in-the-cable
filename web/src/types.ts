export type Route = 'story'|'bits'|'phase'|'entanglement';
export type Fault = 'I'|'X'|'Z'|'Y';
export type Tool = 'z'|'x'|'bell';
export type Phase = 'choose_tool'|'diagnose'|'resolved'|'complete';
export interface Meta {title:string;faults:{id:Fault;name:string;description:string}[];tools:{id:Tool;name:string;description:string;measurement_hint:string;cost_tokens:number}[]}
export interface Ticket {id:string;title:string;customer:string;description:string;suspects:Fault[];reward:number;penalty:number;hint:string;chapter:string}
export interface Reading {tool:Tool;bits:string;engine:'qiskit-statevector';qubits:1|2;query_count:1}
export interface Debrief {fault:Fault;guessed_fault:Fault;correct:boolean;explanation:string;lesson:string;circuit_text:string;gates:{gate:string;qubits:number[]}[];probabilities:Record<string,number>;reward_delta:number;probe_marginal:Record<string,number>;reference_marginal:Record<string,number>|null}
export interface History {ticket_id:string;title:string;tool:Tool;bits:string;fault:Fault;guess:Fault;correct:boolean;delta:number}
export interface Shift {id:string;route:Route;revision:number;phase:Phase;ticket_index:number;ticket_count:number;correct:number;credits:number;bell_tokens:number;ticket:Ticket|null;reading:Reading|null;debrief:Debrief|null;history:History[]}
export interface Evidence {kind:string;conditions:string;unassisted_bound:number;entangled_ideal:number;mappings:{fault:string;z:Record<string,number>;x:Record<string,number>;bell:Record<string,number>}[];sources:{title:string;url:string}[];limitations:string[]}
