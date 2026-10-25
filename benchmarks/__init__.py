"""Independent Qiskit reference circuits, deliberately not importing the game engine."""

import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import DensityMatrix, Kraus


def _state(tool: str, fault: str, noise: float = 0.0) -> DensityMatrix:
    """Return the measured state; q0 alone passes through the unknown device."""
    if tool not in ("z", "x", "bell", "correlated") or fault not in ("I", "X", "Z", "Y"):
        raise ValueError("Unknown tool or fault")
    qubits = 2 if tool in ("bell", "correlated") else 1
    prepare = QuantumCircuit(qubits)
    if tool in ("x", "bell"):
        prepare.h(0)
    if tool == "bell":
        prepare.cx(0, 1)
    if tool == "correlated":
        # Same qubit count as Bell; shared randomness without entanglement.
        state = DensityMatrix(np.diag([0.5, 0.0, 0.0, 0.5]))
    else:
        state = DensityMatrix(prepare)
    channel = QuantumCircuit(qubits)
    if fault != "I":
        getattr(channel, fault.lower())(0)
    state = state.evolve(channel)
    if noise:
        paulis = [
            np.eye(2),
            np.array([[0, 1], [1, 0]]),
            np.array([[0, -1j], [1j, 0]]),
            np.diag([1, -1]),
        ]
        weights = [1 - 3 * noise / 4, noise / 4, noise / 4, noise / 4]
        state = state.evolve(
            Kraus([np.sqrt(weight) * operator for weight, operator in zip(weights, paulis)]),
            qargs=[0],
        )
    decode = QuantumCircuit(qubits)
    if tool == "bell":
        decode.cx(0, 1)
    if tool in ("x", "bell"):
        decode.h(0)
    return state.evolve(decode)


def distribution(tool: str, fault: str) -> dict[str, float]:
    """Exact computational-basis probabilities derived from the reference circuit."""
    return {
        str(bits): float(probability)
        for bits, probability in _state(tool, fault).probabilities_dict().items()
        if probability > 1e-12
    }


FAULTS = ("I", "X", "Z", "Y")
DECODERS = {
    "z": {"0": "I", "1": "X"},
    "x": {"0": "I", "1": "Z"},
    "bell": {"00": "I", "10": "X", "01": "Z", "11": "Y"},
    "correlated": {"00": "I", "11": "I", "01": "X", "10": "X"},
}


def run_experiment(*, shots: int, seed: int, noise_levels: list[float]) -> dict:
    """Sample each explicitly balanced fault; fixed decoders never see the true label."""
    from datetime import UTC, datetime

    import qiskit

    if type(shots) is not int or not 1 <= shots <= 100_000:
        raise ValueError("shots must be an integer between 1 and 100000")
    if type(seed) is not int or seed < 0:
        raise ValueError("seed must be a nonnegative integer")
    if not noise_levels or any(not np.isfinite(p) or not 0 <= p <= 1 for p in noise_levels):
        raise ValueError("noise levels must be nonempty finite probabilities in [0,1]")
    rows = []
    for level_index, noise in enumerate(noise_levels):
        for tool_index, (tool, decoder) in enumerate(DECODERS.items()):
            counts_by_fault = {}
            expected = 0.0
            correct = 0
            for fault_index, fault in enumerate(FAULTS):
                state = _state(tool, fault, noise)
                state.seed(seed + level_index * 1000 + tool_index * 100 + fault_index)
                counts = {str(key): int(value) for key, value in state.sample_counts(shots).items()}
                counts_by_fault[fault] = counts
                correct += sum(count for bits, count in counts.items() if decoder[bits] == fault)
                expected += sum(
                    float(probability) / len(FAULTS)
                    for bits, probability in state.probabilities_dict().items()
                    if decoder[str(bits)] == fault
                )
            rows.append(
                {
                    "tool": tool,
                    "noise": noise,
                    "total": shots * len(FAULTS),
                    "correct": correct,
                    "accuracy": correct / (shots * len(FAULTS)),
                    "expected_accuracy": round(expected, 12),
                    "counts_by_fault": counts_by_fault,
                    "decoder": decoder,
                }
            )
    return {
        "schema_version": 1,
        "generated_at": datetime.now(UTC).isoformat(),
        "hardware_used": False,
        "engine": "qiskit-densitymatrix",
        "qiskit_version": qiskit.__version__,
        "numpy_version": np.__version__,
        "seed": seed,
        "shots_per_fault": shots,
        "conditions": {
            "device_uses_per_trial": 1,
            "fault_prior": {fault: 0.25 for fault in FAULTS},
            "sampling_design": "Balanced fixed number of shots for each fault; accuracy averages uniform priors.",
            "decoder": "Fixed outcome-only decoder, not given the secret fault. Ties choose one label consistently.",
            "reference": "bell and correlated both use two qubits; only q0 passes through the device.",
            "bit_order": "c1c0 (reference,probe) for two-qubit outputs; c0 for single-qubit probes.",
            "noise_model": "Synthetic local depolarizing channel after the hidden Pauli and before decoding: E(rho)=(1-p)rho+p I/2 on q0 only. Ideal preparation, reference and readout. Not calibrated hardware noise.",
        },
        "results": rows,
        "limitations": [
            "Classical Qiskit simulation, not a physical QPU experiment or computational speedup.",
            "Deterministic Pauli hypotheses with uniform priors, not arbitrary noise diagnosis.",
            "Theoretical 50% bound applies to any unassisted one-query strategy for this task.",
            "Finite-shot data demonstrate implementations, not a proof of the general bound.",
        ],
    }
