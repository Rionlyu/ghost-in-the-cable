"""Public known-fault experiments on stateless training cables, not game sessions."""

from fastapi import HTTPException

from server import engine
from server.models import Fault, Gate, Reading, Tool, TrainingProbeResponse


def run_training_probe(tool: Tool, fault: Fault) -> TrainingProbeResponse:
    """Execute the real simulator once and expose only the training wire fields."""
    try:
        result = engine.run_probe(tool, fault)
        return TrainingProbeResponse(
            kind="training",
            known_fault=fault,
            reading=Reading(**{field: result[field] for field in Reading.model_fields}),
            gates=[
                Gate(**{field: gate[field] for field in Gate.model_fields})
                for gate in result["gates"]
            ],
            **{
                field: result[field]
                for field in (
                    "circuit_text",
                    "probabilities",
                    "probe_marginal",
                    "reference_marginal",
                )
            },
        )
    except Exception:  # noqa: BLE001 - never disclose simulator internals or fabricate readings
        raise HTTPException(503, "Quantum engine unavailable; retry the training probe.") from None
