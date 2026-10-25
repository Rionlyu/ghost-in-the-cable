"""Server-owned local game state; no client-chosen faults, seeds or rerolls."""

import secrets
from collections.abc import Callable
from dataclasses import dataclass, field
from threading import RLock
from time import monotonic

import qiskit
from fastapi import HTTPException

from server import engine
from server.content import ROUTE_TICKET_IDS, TICKETS
from server.models import (
    Debrief,
    Fault,
    History,
    Reading,
    Report,
    ResolvedTicket,
    Route,
    Shift,
    Ticket,
    Tool,
)


@dataclass
class _Session:
    public: Shift
    tickets: tuple[Ticket, ...]
    fault: str
    last_seen: float
    probe_result: dict | None = None
    resolved_tickets: list[ResolvedTicket] = field(default_factory=list)


class SessionStore:
    """A process-local store. A restart loses every shift (not production storage)."""

    def __init__(
        self,
        *,
        max_sessions: int = 128,
        idle_ttl_seconds: float = 7200,
        clock: Callable[[], float] = monotonic,
    ):
        if max_sessions < 1 or idle_ttl_seconds <= 0:
            raise ValueError("Session capacity and idle TTL must be positive")
        self._max_sessions = max_sessions
        self._idle_ttl_seconds = idle_ttl_seconds
        self._clock = clock
        self._lock = RLock()
        self._sessions: dict[str, _Session] = {}

    def _prune(self, now: float) -> None:
        expired = [
            key
            for key, value in self._sessions.items()
            if now - value.last_seen >= self._idle_ttl_seconds
        ]
        for key in expired:
            del self._sessions[key]

    def _session(self, shift_id: str) -> _Session:
        now = self._clock()
        self._prune(now)
        try:
            session = self._sessions[shift_id]
        except KeyError:
            raise HTTPException(
                404, "Shift not found: expired, evicted, or local state lost. Start a new shift."
            ) from None
        session.last_seen = now
        return session

    def create(self, route: Route = "story") -> Shift:
        with self._lock:
            now = self._clock()
            self._prune(now)
            if len(self._sessions) >= self._max_sessions:
                oldest = min(self._sessions, key=lambda key: self._sessions[key].last_seen)
                del self._sessions[oldest]
            identifier = secrets.token_urlsafe(32)
            ticket_ids = ROUTE_TICKET_IDS[route]
            tickets_by_id = {ticket["id"]: ticket for ticket in TICKETS}
            tickets = tuple(Ticket(**tickets_by_id[ticket_id]) for ticket_id in ticket_ids)
            ticket = tickets[0].model_copy(deep=True)
            public = Shift(
                id=identifier,
                route=route,
                ticket=ticket,
                ticket_count=len(tickets),
                bell_tokens=3 if route in ("story", "entanglement") else 0,
            )
            session = _Session(
                public=public,
                tickets=tickets,
                fault=secrets.choice(ticket.suspects),
                last_seen=now,
            )
            self._sessions[identifier] = session
            return public.model_copy(deep=True)

    def get(self, shift_id: str) -> Shift:
        with self._lock:
            return self._session(shift_id).public.model_copy(deep=True)

    def probe(self, shift_id: str, tool: Tool, *, expected_revision: int) -> Shift:
        with self._lock:
            session = self._session(shift_id)
            public = session.public
            if expected_revision != public.revision:
                raise HTTPException(409, "This bench has changed. Refresh it before acting again.")
            if public.phase != "choose_tool":
                raise HTTPException(409, "This ticket already has a reading; diagnose it first.")
            if tool == "bell" and public.bell_tokens < 1:
                raise HTTPException(409, "No Bell reference tokens remain; choose a free tool.")
            try:
                result = engine.run_probe(tool, session.fault)
                reading = Reading(**{field: result[field] for field in Reading.model_fields})
            except Exception:  # noqa: BLE001 - simulator boundary must not disclose private state
                # Fail before mutating phase/budget. Never leak exception text or
                # fabricate a reading when the actual simulator failed.
                raise HTTPException(
                    503, "Quantum engine unavailable; ticket unchanged. Retry the probe."
                ) from None
            session.probe_result = result
            public.reading = reading
            public.bell_tokens -= int(tool == "bell")
            public.phase = "diagnose"
            public.revision += 1
            return public.model_copy(deep=True)

    def diagnose(self, shift_id: str, fault: Fault, *, expected_revision: int) -> Shift:
        with self._lock:
            session = self._session(shift_id)
            public = session.public
            if expected_revision != public.revision:
                raise HTTPException(409, "This bench has changed. Refresh it before acting again.")
            if public.phase != "diagnose":
                raise HTTPException(409, "Diagnosis requires an unresolved reading.")
            ticket, reading, result = public.ticket, public.reading, session.probe_result
            assert ticket is not None and reading is not None and result is not None
            if fault not in ticket.suspects:
                raise HTTPException(422, "Diagnosis must name one of this ticket's suspects.")
            correct = fault == session.fault
            delta = ticket.reward if correct else -ticket.penalty
            lesson = {
                "z": "A Z reading separates I/Z from X/Y, not the members within each pair.",
                "x": "An X reading separates I/X from Z/Y, not the members within each pair.",
                "bell": "Before decoding, each Bell subsystem is locally 50/50. Joint correlations distinguish all four Paulis in this ideal model.",
            }[reading.tool]
            debrief = Debrief(
                fault=session.fault,
                guessed_fault=fault,
                correct=correct,
                explanation=f"The cable applied {session.fault} to probe q0. The {reading.tool} circuit produced {reading.bits}; the ASCII circuit below is the actual simulated experiment.",
                lesson=lesson,
                reward_delta=delta,
                **{
                    key: result[key]
                    for key in (
                        "circuit_text",
                        "gates",
                        "probabilities",
                        "probe_marginal",
                        "reference_marginal",
                    )
                },
            )
            history = History(
                ticket_id=ticket.id,
                title=ticket.title,
                tool=reading.tool,
                bits=reading.bits,
                fault=session.fault,
                guess=fault,
                correct=correct,
                delta=delta,
            )
            public.debrief = debrief
            session.resolved_tickets.append(
                ResolvedTicket(ticket=ticket, reading=reading, debrief=debrief).model_copy(
                    deep=True
                )
            )
            public.history.append(history)
            public.correct += int(correct)
            public.credits += delta
            public.phase = "resolved"
            public.revision += 1
            return public.model_copy(deep=True)

    def advance(self, shift_id: str, *, expected_revision: int) -> Shift:
        with self._lock:
            session = self._session(shift_id)
            public = session.public
            if expected_revision != public.revision:
                raise HTTPException(409, "This bench has changed. Refresh it before acting again.")
            if public.phase != "resolved":
                raise HTTPException(409, "Resolve this ticket before advancing.")
            if public.ticket_index == len(session.tickets) - 1:
                public.phase = "complete"
                public.ticket = None
            else:
                ticket = session.tickets[public.ticket_index + 1].model_copy(deep=True)
                fault = secrets.choice(ticket.suspects)
                public.ticket_index += 1
                public.ticket = ticket
                session.fault = fault
                public.phase = "choose_tool"
            public.reading = None
            public.debrief = None
            session.probe_result = None
            public.revision += 1
            return public.model_copy(deep=True)

    def report(self, shift_id: str) -> Report:
        with self._lock:
            session = self._session(shift_id)
            if session.public.phase != "complete":
                raise HTTPException(409, "Finish this route before exporting a report.")
            return Report(
                qiskit_version=qiskit.__version__,
                shift=session.public.model_copy(deep=True),
                resolved_tickets=[
                    record.model_copy(deep=True) for record in session.resolved_tickets
                ],
                limitations=[
                    "Ideal local Statevector simulation, not a hardware run or a speedup benchmark.",
                    "Toy deterministic I/X/Z/Y faults; not arbitrary stochastic hardware noise.",
                    "Shifts are ephemeral process-local memory; restarting the server loses them.",
                ],
            )
