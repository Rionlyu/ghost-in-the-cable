"""Public theory evidence: exact ideal probabilities, never claimed hardware results."""

from server import engine


def evidence() -> dict:
    return {
        "kind": "exact-statevector",
        "conditions": (
            "Four equiprobable deterministic I/X/Z/Y faults and one device use. "
            "Unassisted means a single probe qubit with no retained entangled reference; "
            "any final POVM has success at most d/N = 2/4 = 0.5. "
            "An ideal Bell pair and joint decoder achieve 1.0. This compares quantum "
            "query strategies, not classical simulation speed. Two-suspect tickets "
            "can be solved perfectly with the appropriate free tool."
        ),
        "unassisted_bound": 0.5,
        "entangled_ideal": 1.0,
        "mappings": [
            {
                "fault": fault,
                **{tool: engine.exact_probabilities(tool, fault) for tool in ("z", "x", "bell")},
            }
            for fault in ("I", "X", "Z", "Y")
        ],
        "sources": [
            {
                "title": "IBM Quantum: Statevector probabilities and sampling",
                "url": "https://quantum.cloud.ibm.com/docs/en/api/qiskit/qiskit.quantum_info.Statevector",
            },
            {
                "title": "IBM Quantum Learning: superdense coding and Bell decoding",
                "url": "https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information/entanglement-in-action/superdense-coding",
            },
        ],
        "limitations": [
            "Exact ideal circuit-derived probabilities, not empirical trials or hardware measurements.",
            "Deterministic toy Pauli faults do not model arbitrary stochastic noise or coherent unknown channels.",
            "The 50% bound requires four equiprobable faults, one query and no entangled reference; it is not a general quantum-advantage claim.",
            "Perfect Bell decoding assumes ideal preparation, gates and readout; reference tokens are a game constraint, not a physical cost model.",
        ],
    }
