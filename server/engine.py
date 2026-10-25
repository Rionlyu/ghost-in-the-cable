"""Real ideal-circuit physics; no fault-to-result lookup tables.

Public benchmark interface (tools z/x/bell, faults I/X/Z/Y):
    build_circuit(tool: str, fault: str) -> QuantumCircuit
        Includes final q_i -> c_i measurements; Bell display order is c1c0.
    exact_probabilities(tool: str, fault: str) -> dict[str, float]
        Computational-basis probabilities, including zero-probability outcomes.
    run_probe(tool: str, fault: str, seed: int | None = None) -> dict
        One Qiskit sample plus private debrief data. Keys: tool, bits, engine,
        qubits, query_count, circuit_text, gates, probabilities, probe_marginal,
        reference_marginal. Never serialize the full dict before diagnosis.

The text circuit is Qiskit's actual text drawing with only box-drawing glyphs
transliterated to ASCII. Gate metadata includes barriers and measurements.
Probabilities are Statevector-derived, rounded to 15 decimals to remove float
roundoff; they are not an empirical sample-frequency estimate.
"""

from qiskit import QuantumCircuit
from qiskit.quantum_info import DensityMatrix, Statevector, partial_trace


def _device_circuit(tool: str, fault: str) -> QuantumCircuit:
    if tool not in ("z", "x", "bell") or fault not in ("I", "X", "Z", "Y"):
        raise ValueError("Expected tool z/x/bell and fault I/X/Z/Y")
    circuit = QuantumCircuit(2 if tool == "bell" else 1)
    if tool in ("x", "bell"):
        circuit.h(0)
    if tool == "bell":
        circuit.cx(0, 1)
    circuit.barrier(label="device")
    if fault == "I":
        circuit.id(0)
    else:
        getattr(circuit, fault.lower())(0)
    return circuit


def build_circuit(tool: str, fault: str) -> QuantumCircuit:
    """Prepare, apply exactly one device Pauli on q0, decode, measure."""
    circuit = _device_circuit(tool, fault)
    circuit.barrier(label="decode")
    if tool == "bell":
        circuit.cx(0, 1)
    if tool in ("x", "bell"):
        circuit.h(0)
    circuit.measure_all(add_bits=True)
    return circuit


def _probabilities(state: Statevector | DensityMatrix) -> dict[str, float]:
    return {
        format(index, f"0{state.num_qubits}b"): round(float(probability), 15)
        for index, probability in enumerate(state.probabilities())
    }


def exact_probabilities(tool: str, fault: str) -> dict[str, float]:
    """Compute ideal probabilities from the actual circuit, not a truth table."""
    circuit = build_circuit(tool, fault).remove_final_measurements(inplace=False)
    return _probabilities(Statevector(circuit))


def run_probe(tool: str, fault: str, seed: int | None = None) -> dict:
    """Sample one Qiskit shot; seed is for offline benchmarks, never a web input.

    Returns reading fields plus debrief-only circuit_text, gates, probabilities.
    The HTTP layer must explicitly allowlist the public reading fields.
    """
    circuit = build_circuit(tool, fault)
    state = Statevector(circuit.remove_final_measurements(inplace=False))
    state.seed(seed)
    bits = str(state.sample_memory(shots=1)[0])
    # Trace out the other subsystem BEFORE the inverse Bell decoder. Final
    # decoded measurement marginals would incorrectly look deterministic.
    device_state = Statevector(_device_circuit(tool, fault))
    probe_density = (
        partial_trace(device_state, [1]) if tool == "bell" else DensityMatrix(device_state)
    )
    reference_density = partial_trace(device_state, [0]) if tool == "bell" else None
    return {
        "probe_marginal": _probabilities(probe_density),
        "reference_marginal": (
            _probabilities(reference_density) if reference_density is not None else None
        ),
        "tool": tool,
        "bits": bits,
        "engine": "qiskit-statevector",
        "qubits": circuit.num_qubits,
        "query_count": 1,
        "circuit_text": str(circuit.draw(output="text")).translate(
            str.maketrans(
                {
                    **{glyph: "+" for glyph in "┌┐└┘├┤┴╥╩╫"},
                    "─": "-",
                    "═": "=",
                    "║": "|",
                    "░": "|",
                    "■": "*",
                }
            )
        ),
        "gates": [
            {
                "gate": instruction.operation.name,
                "qubits": [circuit.find_bit(qubit).index for qubit in instruction.qubits],
            }
            for instruction in circuit.data
        ],
        "probabilities": _probabilities(state),
    }
