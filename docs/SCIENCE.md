# Scientific model and limits

## Task
A fresh device implements one unknown deterministic unitary from{I,X,Z,Y}, chosen with equal prior probability for the four-way benchmark. Exactly one use of that device is permitted. The game includes easier contracts with onlyI/X orI/Z hypotheses. Those easier contracts do NOT have the same50% unassisted bound.

This is a deliberately specified channel-discrimination task, not a claim that arbitrary quantum hardware errors are four perfectly diagnosable deterministic gates. State preparation, gates and measurements are ideal in the campaign.

## Circuits and bit ordering
Z probe: prepare|0>, apply fault, measure inZ.
X probe: prepare|+> withH, apply fault, applyH, measure inZ (equivalently measureX).
Bell reference: H(q0),CX(q0,q1); fault onq0 only; CX(q0,q1),H(q0); measureq0 toc0 andq1 toc1. A barrier can preserve stages for a physical implementation; current Statevector simulation follows the explicit circuit. Referenceq1 does not pass through the device.

Output strings arec1c0 (reference then probe), matching Qiskit's displayed bit ordering. The independently specified literal fixture is:

|Fault|Z|X|Bell|
|---|---|---|---|
|I|0|0|00|
|X|1|0|10|
|Z|0|1|01|
|Y|1|1|11|

XZ andY differ by a global phase, which does not affect these measurement probabilities.

## Why the unassisted ceiling is50%, not just a weak baseline
For any single-qubit input, call the four possible output density operators rho_j. Any four-outcome POVM has positive measurement operatorsM_j whose sum isI_2. Since eachrho_j<=I_2,

    p_success = (1/4) sum_j Tr(M_j rho_j)
              <= (1/4) sum_j Tr(M_j)
               = (1/4) Tr(I_2) = 1/2.

TheZ strategy with a fixed tie-breaking decoder attains1/2, so this bound is tight. Classical randomization does not improve it; a retained separable/classically correlated reference also cannot beat the bound, by decomposing its input into a mixture of product states and applying the same bound to each component. An entangled reference changes the accessible joint output space.

Applying the four faults to one half of|Phi+> produces four orthogonal Bell states, up to global phase. A joint Bell decoder distinguishes them perfectly in the ideal model. This is the same mathematical mechanism exploited by superdense coding, not a new protocol invented here.

## Do not confuse marginals with decoded bits
Immediately after the faulty device and BEFORE joint decoding, either individual member of the Bell pair has reduced stateI/2 for every fault. Neither local reduced state identifies the fault. The joint state does. After applying the Bell decoder, individual output bits are deterministic for a given fault. Any UI displaying1/2 marginals must label them as pre-decoder marginals.

The reference alone does not receive a readable remote message. The returned probe and retained reference must be brought together for the joint decoding operation. No faster-than-light communication is implied.

## Matched resource control
The benchmark includes a two-qubit classically correlated inputrho=(|00><00|+|11><11|)/2. Onlyq0 sees the device, just as in the Bell experiment. Measuring both distinguishes bit-flipping from non-bit-flipping faults but not phase changes; its four-way optimum remains50%. This control avoids confusing an extra unentangled qubit with entanglement.

Bell preparation and decoding require extra gates and a retained quantum reference. Those are explicit resources. The game's cartridge scarcity is a game-design budget, not a measured cost model. Allowing additional queries per device changes the discrimination problem: this is not a universal50% limit on all diagnosis.

## Evidence provenance
benchmarks/ builds its own reference circuits, independently of server.engine, and checks literal expected mappings in tests/evidence. The experiment fixes an equal number of shots for each fault (stratified, balanced sampling), rather than randomly drawing uneven fault counts. Its reported accuracy averages the equal priors. Fixed decoders never receive the true fault as input.

Exact probabilities are computed by Qiskit. Empirical counts are sampled by Qiskit DensityMatrix.sample_counts with recorded seeds. At ideal deterministic outputs the resulting correct counts are exact for these fixed decoders; they are not hand-entered outcomes. The reference-correlation control has genuinely random local outcomes.

Synthetic sensitivity model: after the hidden fault, apply a local channelE(rho)=(1-p)rho+pI/2 toq0, before decoding, with ideal preparation/reference/readout. Kraus operators are sqrt(1-3p/4)I and sqrt(p/4)X,Y,Z. This is a valid channel for0<=p<=1. Bell's expected success becomes1-3p/4. The noise sweep is a separate experiment, not a claim to reproduce a particular IBM device.

No finite set of experiments proves the general information-theoretic bound; the short argument above does. No quantum-computational speedup, hardware advantage, new channel-discrimination theorem, or learning efficacy has been established by this simulation.

## Primary references
1. IBM Quantum Learning, Entanglement in Action, Qiskit implementation: https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information/entanglement-in-action/qiskit-implementation
2. Lien andQuintino, Entanglement in quantum channel discrimination: sometimes less is more, section2.1.1: https://arxiv.org/html/2605.31519v1
3. Qiskit Statevector sampling: https://quantum.cloud.ibm.com/docs/en/api/qiskit/qiskit.quantum_info.Statevector
4. Qiskit Kraus channel representation: https://quantum.cloud.ibm.com/docs/api/qiskit/qiskit.quantum_info.Kraus
