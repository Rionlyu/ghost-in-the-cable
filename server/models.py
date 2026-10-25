"""Allowlisted wire models. Private session state never passes through these models."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Fault = Literal["I", "X", "Z", "Y"]
Tool = Literal["z", "x", "bell"]
Route = Literal["story", "bits", "phase", "entanglement"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class CreateShiftRequest(StrictModel):
    route: Route = "story"


class MutationRequest(StrictModel):
    expected_revision: int = Field(ge=0)


class NextRequest(MutationRequest):
    pass


class ProbeRequest(MutationRequest):
    tool: Tool


class TrainingProbeRequest(StrictModel):
    tool: Tool
    fault: Fault


class Reading(StrictModel):
    tool: Tool
    bits: str
    engine: Literal["qiskit-statevector"]
    qubits: Literal[1, 2]
    query_count: Literal[1]


class Ticket(StrictModel):
    id: str
    title: str
    customer: str
    description: str
    suspects: list[Fault]
    reward: int
    penalty: int
    hint: str
    chapter: str


class DiagnoseRequest(MutationRequest):
    fault: Fault


class Gate(StrictModel):
    gate: str
    qubits: list[int]


class TrainingProbeResponse(StrictModel):
    kind: Literal["training"] = "training"
    known_fault: Fault
    reading: Reading
    circuit_text: str
    gates: list[Gate]
    probabilities: dict[str, float]
    probe_marginal: dict[str, float]
    reference_marginal: dict[str, float] | None


class Debrief(StrictModel):
    fault: Fault
    guessed_fault: Fault
    correct: bool
    explanation: str
    lesson: str
    circuit_text: str
    gates: list[Gate]
    probabilities: dict[str, float]
    reward_delta: int
    probe_marginal: dict[str, float]
    reference_marginal: dict[str, float] | None


class History(StrictModel):
    ticket_id: str
    title: str
    tool: Tool
    bits: str
    fault: Fault
    guess: Fault
    correct: bool
    delta: int


class Shift(StrictModel):
    id: str
    route: str = "story"
    revision: int = Field(default=0, ge=0)
    phase: Literal["choose_tool", "diagnose", "resolved", "complete"] = "choose_tool"
    ticket_index: int = 0
    ticket_count: int = 8
    correct: int = 0
    credits: int = 0
    bell_tokens: int = 3
    ticket: Ticket | None
    reading: Reading | None = None
    debrief: Debrief | None = None
    history: list[History] = Field(default_factory=list)


class ResolvedTicket(StrictModel):
    ticket: Ticket
    reading: Reading
    debrief: Debrief


class Report(StrictModel):
    schema_version: Literal[1] = 1
    title: str = "Ghost in the Cable"
    engine: Literal["qiskit-statevector"] = "qiskit-statevector"
    qiskit_version: str
    shift: Shift
    resolved_tickets: list[ResolvedTicket]
    limitations: list[str]
