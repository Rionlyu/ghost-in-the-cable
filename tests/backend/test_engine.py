"""Independent literal physics fixtures: do not import an implementation truth table."""

import importlib

import pytest
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector

LITERALS = {
    "I": {"z": "0", "x": "0", "bell": "00"},
    "X": {"z": "1", "x": "0", "bell": "10"},
    "Z": {"z": "0", "x": "1", "bell": "01"},
    "Y": {"z": "1", "x": "1", "bell": "11"},
}


@pytest.mark.parametrize("fault", LITERALS)
@pytest.mark.parametrize("tool", ["z", "x", "bell"])
def test_circuit_and_exact_distribution_match_literal_spec(tool, fault):
    engine = importlib.import_module("server.engine")
    circuit = engine.build_circuit(tool, fault)
    assert isinstance(circuit, QuantumCircuit)
    assert circuit.num_qubits == (2 if tool == "bell" else 1)
    measurements = [step for step in circuit.data if step.operation.name == "measure"]
    assert len(measurements) == circuit.num_qubits
    assert [circuit.find_bit(step.clbits[0]).index for step in measurements] == list(
        range(circuit.num_qubits)
    )
    state = Statevector(circuit.remove_final_measurements(inplace=False))
    expected = LITERALS[fault][tool]
    assert state.probabilities_dict().get(expected, 0) == pytest.approx(1)
    distribution = engine.exact_probabilities(tool, fault)
    assert set(distribution) == {
        format(n, f"0{circuit.num_qubits}b") for n in range(2**circuit.num_qubits)
    }
    assert sum(distribution.values()) == pytest.approx(1)
    for bits, probability in distribution.items():
        assert probability == pytest.approx(float(bits == expected))


@pytest.mark.parametrize("fault", LITERALS)
@pytest.mark.parametrize("tool", ["z", "x", "bell"])
def test_sampled_probe_is_real_qiskit_with_reproducible_seed(tool, fault):
    engine = importlib.import_module("server.engine")
    reading = engine.run_probe(tool, fault, seed=23)
    assert reading["bits"] == LITERALS[fault][tool]
    assert reading["engine"] == "qiskit-statevector"
    assert reading["query_count"] == 1
    assert reading["qubits"] == (2 if tool == "bell" else 1)
    assert reading["tool"] == tool
    assert reading["probabilities"] == engine.exact_probabilities(tool, fault)
    assert reading["circuit_text"].isascii()
    source_drawing = str(engine.build_circuit(tool, fault).draw(output="text"))
    # Only box-drawing glyphs are transliterated; labels, gates and wiring
    # positions must still be those from the real Qiskit circuit.
    keep_labels = lambda text: "".join(char for char in text if char.isalnum() or char in "_:")
    assert keep_labels(reading["circuit_text"]) == keep_labels(source_drawing)
    assert len(reading["circuit_text"].splitlines()) == len(source_drawing.splitlines())
    assert reading["gates"][-1] == {"gate": "measure", "qubits": [1 if tool == "bell" else 0]}
    assert sum(step["gate"] in ("id", "x", "y", "z") for step in reading["gates"]) == 1


def test_sampling_tracks_circuit_not_fault_metadata(monkeypatch):
    engine = importlib.import_module("server.engine")
    original = engine.build_circuit
    monkeypatch.setattr(engine, "build_circuit", lambda tool, fault: original(tool, "X"))
    assert engine.run_probe("z", "I", seed=9)["bits"] == "1"
    assert engine.exact_probabilities("z", "I") == {"0": 0.0, "1": 1.0}


@pytest.mark.parametrize("fault", LITERALS)
@pytest.mark.parametrize("tool", ["z", "x", "bell"])
def test_predecoder_reduced_density_marginals(tool, fault):
    engine = importlib.import_module("server.engine")
    result = engine.run_probe(tool, fault, seed=0)
    if tool in ("x", "bell"):
        assert result["probe_marginal"] == {"0": 0.5, "1": 0.5}
    else:
        bit = LITERALS[fault]["z"]
        assert result["probe_marginal"] == {"0": float(bit == "0"), "1": float(bit == "1")}
    assert result["reference_marginal"] == ({"0": 0.5, "1": 0.5} if tool == "bell" else None)


def test_marginals_are_computed_from_state_not_constant_labels(monkeypatch):
    engine = importlib.import_module("server.engine")
    device = QuantumCircuit(2)
    device.x(0)
    monkeypatch.setattr(engine, "_device_circuit", lambda tool, fault: device.copy())
    result = engine.run_probe("bell", "Y", seed=0)
    assert result["probe_marginal"] == {"0": 0.0, "1": 1.0}
    assert result["reference_marginal"] == {"0": 1.0, "1": 0.0}
