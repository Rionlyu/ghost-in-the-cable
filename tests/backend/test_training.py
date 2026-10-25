"""Known training cables execute real circuits without touching customer sessions."""

import asyncio

import httpx
import pytest
from qiskit.quantum_info import Statevector

from server import engine
from server.app import create_app

TRAINING_PATH = "/api/training/probe"
TRAINING_KEYS = {
    "kind",
    "known_fault",
    "reading",
    "circuit_text",
    "gates",
    "probabilities",
    "probe_marginal",
    "reference_marginal",
}
READING_KEYS = {"tool", "bits", "engine", "qubits", "query_count"}
# Independent wire-format fixtures, never imported from the implementation.
LITERALS = {
    "I": {"z": "0", "x": "0", "bell": "00"},
    "X": {"z": "1", "x": "0", "bell": "10"},
    "Z": {"z": "0", "x": "1", "bell": "01"},
    "Y": {"z": "1", "x": "1", "bell": "11"},
}


class APIClient:
    """Use the real ASGI app without Starlette's deprecated httpx test adapter."""

    def __init__(self, application):
        self.application = application

    def request(self, method, path, **kwargs):
        async def send():
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=self.application), base_url="http://testserver"
            ) as connection:
                return await connection.request(method, path, **kwargs)

        return asyncio.run(send())

    def post(self, path, **kwargs):
        return self.request("POST", path, **kwargs)

    def get(self, path, **kwargs):
        return self.request("GET", path, **kwargs)


@pytest.fixture
def client():
    return APIClient(create_app())


@pytest.mark.parametrize("fault", LITERALS)
@pytest.mark.parametrize("tool", ["z", "x", "bell"])
def test_training_matches_literal_circuit_with_one_real_qiskit_shot(
    client, monkeypatch, tool, fault
):
    calls = []
    samples = []
    results = []
    original_probe = engine.run_probe
    original_sample = Statevector.sample_memory

    def record_probe(*args, **kwargs):
        calls.append((args, kwargs))
        result = original_probe(*args, **kwargs)
        results.append(result)
        return result

    def record_sample(state, shots, *args, **kwargs):
        samples.append(shots)
        return original_sample(state, shots, *args, **kwargs)

    monkeypatch.setattr(engine, "run_probe", record_probe)
    monkeypatch.setattr(Statevector, "sample_memory", record_sample)
    response = client.post(TRAINING_PATH, json={"tool": tool, "fault": fault})
    assert response.status_code == 200, response.text
    body = response.json()
    assert set(body) == TRAINING_KEYS
    assert body["kind"] == "training"
    assert body["known_fault"] == fault
    assert set(body["reading"]) == READING_KEYS
    assert body["reading"] == {
        "tool": tool,
        "bits": LITERALS[fault][tool],
        "engine": "qiskit-statevector",
        "qubits": 2 if tool == "bell" else 1,
        "query_count": 1,
    }
    assert calls == [((tool, fault), {})]  # No web-selected seed or shot count.
    assert samples == [1]
    result = results[0]
    for field in TRAINING_KEYS - {"kind", "known_fault", "reading"}:
        assert body[field] == result[field]
    assert body["circuit_text"] and body["circuit_text"].isascii()
    outcomes = ("00", "01", "10", "11") if tool == "bell" else ("0", "1")
    assert body["probabilities"] == {
        bits: float(bits == LITERALS[fault][tool]) for bits in outcomes
    }
    device_gates = [gate for gate in body["gates"] if gate["gate"] in {"id", "x", "y", "z"}]
    assert device_gates == [{"gate": "id" if fault == "I" else fault.lower(), "qubits": [0]}]
    assert all(set(gate) == {"gate", "qubits"} for gate in body["gates"])
    if tool == "bell":
        assert body["probe_marginal"] == body["reference_marginal"] == {"0": 0.5, "1": 0.5}
        # Final decoded outputs are deterministic, unlike both pre-decoder marginals.
        assert body["probabilities"][LITERALS[fault][tool]] == 1.0
    else:
        assert body["reference_marginal"] is None
        z_bit = LITERALS[fault]["z"]
        assert body["probe_marginal"] == (
            {"0": 0.5, "1": 0.5}
            if tool == "x"
            else {"0": float(z_bit == "0"), "1": float(z_bit == "1")}
        )


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"tool": "z"},
        {"fault": "I"},
        *({"tool": value, "fault": "I"} for value in ("Z", "other", None, True, 1, ["z"], {})),
        *({"tool": "z", "fault": value} for value in ("i", "XX", None, False, 0, ["I"], {})),
        *(
            {"tool": "z", "fault": "I", key: value}
            for key, value in (
                ("shift_id", "private-shift"),
                ("id", "private-shift"),
                ("ticket_id", "porchlight"),
                ("target", "private-shift"),
                ("target_id", "private-shift"),
                ("route", "story"),
                ("expected_revision", 0),
                ("seed", 7),
                ("shots", 100),
                ("circuit", "h q[0];"),
                ("known_fault", "X"),
                ("query_count", 0),
                ("reading", {"bits": "1"}),
            )
        ),
    ],
)
def test_training_rejects_invalid_or_extra_json_before_simulation(client, monkeypatch, payload):
    calls = []
    original = engine.run_probe

    def record_probe(*args, **kwargs):
        calls.append((args, kwargs))
        return original(*args, **kwargs)

    monkeypatch.setattr(engine, "run_probe", record_probe)
    response = client.post(TRAINING_PATH, json=payload)
    assert response.status_code == 422, response.text
    assert set(response.json()) == {"detail"}
    assert calls == []


@pytest.mark.parametrize("raw", ["", "null", "[]", "true", "1", '"z"', "{bad-json", '{"tool":'])
def test_training_rejects_nonobject_or_malformed_json(client, monkeypatch, raw):
    calls = []
    original = engine.run_probe

    def record_probe(*args, **kwargs):
        calls.append((args, kwargs))
        return original(*args, **kwargs)

    monkeypatch.setattr(engine, "run_probe", record_probe)
    response = client.post(TRAINING_PATH, content=raw, headers={"Content-Type": "application/json"})
    assert response.status_code == 422
    assert set(response.json()) == {"detail"}
    assert calls == []


def test_training_allowlists_nested_engine_metadata(client, monkeypatch):
    original = engine.run_probe

    def with_private_metadata(*args, **kwargs):
        result = original(*args, **kwargs)
        result.update(
            kind="customer",
            known_fault="private-marker",
            fault="private-marker",
            session_id="private-marker",
            reading={"fault": "private-marker"},
        )
        for gate in result["gates"]:
            gate["private_state"] = "private-marker"
        return result

    monkeypatch.setattr(engine, "run_probe", with_private_metadata)
    response = client.post(TRAINING_PATH, json={"tool": "bell", "fault": "Z"})
    assert response.status_code == 200, response.text
    body = response.json()
    assert set(body) == TRAINING_KEYS
    assert body["kind"] == "training"
    assert body["known_fault"] == "Z"
    assert body["reading"]["bits"] == "01"
    assert set(body["reading"]) == READING_KEYS
    assert all(set(gate) == {"gate", "qubits"} for gate in body["gates"])
    assert "private-marker" not in response.text


@pytest.mark.parametrize(
    "failure", ["raise", "missing-bits", "invalid-engine", "missing-circuit", "invalid-gate"]
)
def test_failed_training_is_honest_safe_and_retryable(client, monkeypatch, failure):
    original = engine.run_probe
    calls = []

    def fail(*args, **kwargs):
        calls.append((args, kwargs))
        if failure == "raise":
            raise RuntimeError("private fault and circuit: private-marker")
        result = original(*args, **kwargs)
        if failure == "missing-bits":
            del result["bits"]
        elif failure == "invalid-engine":
            result["engine"] = "private-marker"
        elif failure == "missing-circuit":
            del result["circuit_text"]
        else:
            result["gates"][0]["qubits"] = "private-marker"
        return result

    monkeypatch.setattr(engine, "run_probe", fail)
    response = client.post(TRAINING_PATH, json={"tool": "bell", "fault": "Y"})
    assert response.status_code == 503, response.text
    assert response.json() == {"detail": "Quantum engine unavailable; retry the training probe."}
    assert "private-marker" not in response.text
    assert "Traceback" not in response.text
    assert calls == [(("bell", "Y"), {})]
    monkeypatch.setattr(engine, "run_probe", original)
    recovered = client.post(TRAINING_PATH, json={"tool": "bell", "fault": "Y"})
    assert recovered.status_code == 200
    assert recovered.json()["reading"]["bits"] == "11"


def test_training_never_accesses_a_customer_store(monkeypatch):
    class ForbiddenStore:
        def __getattribute__(self, name):
            pytest.fail(f"Training tried to access customer store attribute {name}")

    connection = APIClient(create_app(store=ForbiddenStore()))
    for fault, tools in LITERALS.items():
        for tool, bits in tools.items():
            response = connection.post(TRAINING_PATH, json={"tool": tool, "fault": fault})
            assert response.status_code == 200, response.text
            assert response.json()["reading"]["bits"] == bits
    invalid = connection.post(TRAINING_PATH, json={"tool": "z", "fault": "I", "shift_id": "id"})
    assert invalid.status_code == 422

    def fail(*args, **kwargs):
        raise RuntimeError("private-marker")

    monkeypatch.setattr(engine, "run_probe", fail)
    assert connection.post(TRAINING_PATH, json={"tool": "z", "fault": "I"}).status_code == 503


@pytest.mark.parametrize("route", ["story", "bits", "phase", "entanglement"])
@pytest.mark.parametrize("phase", ["choose_tool", "diagnose", "resolved", "complete"])
def test_training_preserves_all_public_and_private_customer_state(monkeypatch, route, phase):
    from copy import deepcopy

    from server.game import SessionStore

    now = [0.0]
    store = SessionStore(clock=lambda: now[0])
    connection = APIClient(create_app(store=store))
    current = connection.post("/api/shifts", json={"route": route}).json()
    path = f"/api/shifts/{current['id']}"
    while current["phase"] != phase:
        if current["phase"] == "choose_tool":
            response = connection.post(
                path + "/probe",
                json={
                    "tool": "bell" if current["bell_tokens"] else "z",
                    "expected_revision": current["revision"],
                },
            )
        elif current["phase"] == "diagnose":
            response = connection.post(
                path + "/diagnose", json={"fault": "I", "expected_revision": current["revision"]}
            )
        else:
            response = connection.post(
                path + "/next", json={"expected_revision": current["revision"]}
            )
        assert response.status_code == 200, response.text
        current = response.json()
    other = connection.post("/api/shifts", json={}).json()
    before = deepcopy(store._sessions)
    now[0] = 10.0  # Even an accidental customer read would change private last_seen.
    for fault, tools in LITERALS.items():
        for tool in tools:
            response = connection.post(TRAINING_PATH, json={"tool": tool, "fault": fault})
            assert response.status_code == 200, response.text
            assert store._sessions == before
    invalid = connection.post(
        TRAINING_PATH, json={"tool": "bell", "fault": "Y", "shift_id": current["id"]}
    )
    assert invalid.status_code == 422
    assert store._sessions == before

    def fail(*args, **kwargs):
        raise RuntimeError("private-marker")

    monkeypatch.setattr(engine, "run_probe", fail)
    assert connection.post(TRAINING_PATH, json={"tool": "bell", "fault": "Y"}).status_code == 503
    assert store._sessions == before
    assert connection.get(path).json() == current
    assert connection.get(f"/api/shifts/{other['id']}").json() == other
    if phase in {"choose_tool", "diagnose"}:
        assert current["debrief"] is None
    if phase == "choose_tool":
        assert current["revision"] == 0
        assert current["reading"] is None
        assert current["history"] == []


def test_repeating_training_executes_a_fresh_real_shot_each_time(client, monkeypatch):
    calls = []
    samples = []
    original_probe = engine.run_probe
    original_sample = Statevector.sample_memory

    def record_probe(*args, **kwargs):
        calls.append((args, kwargs))
        return original_probe(*args, **kwargs)

    def record_sample(state, shots, *args, **kwargs):
        samples.append(shots)
        return original_sample(state, shots, *args, **kwargs)

    monkeypatch.setattr(engine, "run_probe", record_probe)
    monkeypatch.setattr(Statevector, "sample_memory", record_sample)
    for _ in range(3):
        response = client.post(TRAINING_PATH, json={"tool": "bell", "fault": "X"})
        assert response.status_code == 200
        assert response.json()["reading"]["bits"] == "10"
    assert calls == [(("bell", "X"), {})] * 3
    assert samples == [1, 1, 1]


def test_training_reading_tracks_executed_circuit_not_fault_labels(client, monkeypatch):
    original = engine.build_circuit
    monkeypatch.setattr(engine, "build_circuit", lambda tool, fault: original(tool, "X"))
    response = client.post(TRAINING_PATH, json={"tool": "z", "fault": "I"})
    assert response.status_code == 200
    body = response.json()
    assert body["known_fault"] == "I"
    assert body["reading"]["bits"] == "1"
    assert body["probabilities"] == {"0": 0.0, "1": 1.0}
    assert {"gate": "x", "qubits": [0]} in body["gates"]


@pytest.mark.parametrize("outcome", ["success", "invalid", "unavailable", "get", "put"])
def test_training_preserves_security_headers_for_every_http_outcome(client, monkeypatch, outcome):
    payload = {"tool": "z", "fault": "I"}
    method = "POST"
    status = {"success": 200, "invalid": 422, "unavailable": 503, "get": 404, "put": 405}[outcome]
    if outcome == "invalid":
        payload["seed"] = 1
    elif outcome == "unavailable":

        def fail(*args, **kwargs):
            raise RuntimeError("private-marker")

        monkeypatch.setattr(engine, "run_probe", fail)
    elif outcome in {"get", "put"}:
        method = outcome.upper()
    response = client.request(method, TRAINING_PATH, json=payload)
    assert response.status_code == status, response.text
    assert response.headers["content-type"].startswith("application/json")
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["referrer-policy"] == "no-referrer"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["permissions-policy"] == "camera=(), microphone=(), geolocation=()"
    assert "default-src 'self'" in response.headers["content-security-policy"]
    assert "frame-ancestors 'none'" in response.headers["content-security-policy"]
    assert "object-src 'none'" in response.headers["content-security-policy"]
    assert "access-control-allow-origin" not in response.headers
    assert "private-marker" not in response.text
