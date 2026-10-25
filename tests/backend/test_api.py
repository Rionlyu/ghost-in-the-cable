"""HTTP contract tests: public response keys are a disclosure boundary."""

import asyncio
import importlib

import httpx
import pytest


class APIClient:
    """Exercise ASGI over httpx without Starlette's deprecated httpx adapter."""

    def __init__(self, app):
        self.app = app

    def request(self, method, path, **kwargs):
        async def send():
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=self.app), base_url="http://testserver"
            ) as connection:
                return await connection.request(method, path, **kwargs)

        return asyncio.run(send())

    def __getattr__(self, method):
        return lambda path, **kwargs: self.request(method.upper(), path, **kwargs)


@pytest.fixture
def client():
    module = importlib.import_module("server.app")
    return APIClient(module.create_app())


def test_health_and_public_field_guide():
    module = importlib.import_module("server.app")
    client = APIClient(module.create_app())
    health = client.get("/api/health")
    assert health.status_code == 200
    import qiskit

    assert health.json() == {
        "status": "ok",
        "engine": "qiskit-statevector",
        "qiskit_version": qiskit.__version__,
    }
    meta = client.get("/api/meta")
    assert meta.status_code == 200
    body = meta.json()
    assert body["title"] == "Ghost in the Cable"
    assert [fault["id"] for fault in body["faults"]] == ["I", "X", "Z", "Y"]
    assert [tool["id"] for tool in body["tools"]] == ["z", "x", "bell"]
    assert [tool["cost_tokens"] for tool in body["tools"]] == [0, 0, 1]
    assert all(fault["name"] and fault["description"] for fault in body["faults"])
    assert all(tool["measurement_hint"] and tool["description"] for tool in body["tools"])


SHIFT_KEYS = {
    "id",
    "route",
    "revision",
    "phase",
    "ticket_index",
    "ticket_count",
    "correct",
    "credits",
    "bell_tokens",
    "ticket",
    "reading",
    "debrief",
    "history",
}
TICKET_KEYS = {
    "id",
    "title",
    "customer",
    "description",
    "suspects",
    "reward",
    "penalty",
    "hint",
    "chapter",
}
READING_KEYS = {"tool", "bits", "engine", "qubits", "query_count"}


@pytest.fixture
def shift(client):
    response = client.post("/api/shifts", json={})
    assert response.status_code == 200, response.text
    return response.json()


def test_new_shift_is_concealed_and_recovers_by_unguessable_id(client):
    response = client.post("/api/shifts", json={})
    assert response.status_code == 200
    body = response.json()
    assert set(body) == SHIFT_KEYS
    assert len(body["id"]) >= 32
    assert body["phase"] == "choose_tool"
    assert body["revision"] == 0
    assert body["ticket_index"] == 0
    assert body["ticket_count"] == 8
    assert body["credits"] == body["correct"] == 0
    assert body["bell_tokens"] == 3
    assert body["reading"] is body["debrief"] is None
    assert body["history"] == []
    assert set(body["ticket"]) == TICKET_KEYS
    assert body["ticket"]["suspects"] == ["I", "X"]
    assert client.get(f"/api/shifts/{body['id']}").json() == body
    reset = client.post("/api/shifts", json={}).json()
    assert reset["id"] != body["id"]
    assert reset["bell_tokens"] == 3
    assert client.get(f"/api/shifts/{body['id']}").json() == body
    missing = client.get("/api/shifts/not-a-session")
    assert missing.status_code == 404
    assert isinstance(missing.json()["detail"], str)
    assert "new shift" in missing.json()["detail"].lower()


@pytest.mark.parametrize("tool", ["z", "x", "bell"])
def test_probe_samples_once_conceals_fault_and_recovery_never_rerolls(
    client, shift, tool, monkeypatch
):
    from qiskit.quantum_info import Statevector

    sampled = []
    original = Statevector.sample_memory

    def record_sample(state, shots, *args, **kwargs):
        sampled.append(shots)
        return original(state, shots, *args, **kwargs)

    monkeypatch.setattr(Statevector, "sample_memory", record_sample)
    path = f"/api/shifts/{shift['id']}"
    response = client.post(path + "/probe", json={"tool": tool, "expected_revision": 0})
    assert response.status_code == 200
    body = response.json()
    assert set(body) == SHIFT_KEYS
    assert body["phase"] == "diagnose"
    assert set(body["reading"]) == READING_KEYS
    assert body["reading"]["tool"] == tool
    assert body["reading"]["engine"] == "qiskit-statevector"
    assert body["reading"]["query_count"] == 1
    assert body["reading"]["qubits"] == (2 if tool == "bell" else 1)
    assert len(body["reading"]["bits"]) == (2 if tool == "bell" else 1)
    assert body["bell_tokens"] == (2 if tool == "bell" else 3)
    assert body["debrief"] is None
    assert body["history"] == []
    assert client.get(path).json() == body
    assert client.get(path).json() == body
    assert (
        client.post(path + "/probe", json={"tool": "bell", "expected_revision": 0}).status_code
        == 409
    )
    assert client.get(path).json() == body
    assert sampled == [1]


@pytest.mark.parametrize("guess,correct", [("X", True), ("I", False)])
def test_diagnosis_resolves_once_reveals_actual_circuit_and_scores(
    client, monkeypatch, guess, correct
):
    from server import engine, game

    monkeypatch.setattr(game.secrets, "choice", lambda family: "X")
    initial = client.post("/api/shifts", json={}).json()
    path = f"/api/shifts/{initial['id']}"
    reading = client.post(path + "/probe", json={"tool": "bell", "expected_revision": 0}).json()[
        "reading"
    ]
    response = client.post(path + "/diagnose", json={"fault": guess, "expected_revision": 1})
    assert response.status_code == 200
    body = response.json()
    assert body["phase"] == "resolved"
    assert body["reading"] == reading
    assert body["bell_tokens"] == 2
    delta = initial["ticket"]["reward"] if correct else -initial["ticket"]["penalty"]
    assert body["correct"] == int(correct)
    assert body["credits"] == delta
    debrief = body["debrief"]
    assert set(debrief) == {
        "fault",
        "guessed_fault",
        "correct",
        "explanation",
        "lesson",
        "circuit_text",
        "gates",
        "probabilities",
        "reward_delta",
        "probe_marginal",
        "reference_marginal",
    }
    assert debrief["fault"] == "X"
    assert debrief["guessed_fault"] == guess
    assert debrief["correct"] is correct
    assert debrief["reward_delta"] == delta
    assert debrief["circuit_text"] == engine.run_probe("bell", "X", seed=0)["circuit_text"]
    assert debrief["probabilities"] == {"00": 0.0, "01": 0.0, "10": 1.0, "11": 0.0}
    assert debrief["probe_marginal"] == debrief["reference_marginal"] == {"0": 0.5, "1": 0.5}
    assert debrief["explanation"] and debrief["lesson"]
    assert all(set(gate) == {"gate", "qubits"} for gate in debrief["gates"])
    assert body["history"] == [
        {
            "ticket_id": initial["ticket"]["id"],
            "title": initial["ticket"]["title"],
            "tool": "bell",
            "bits": "10",
            "fault": "X",
            "guess": guess,
            "correct": correct,
            "delta": delta,
        }
    ]
    assert client.get(path).json() == body
    assert (
        client.post(path + "/diagnose", json={"fault": guess, "expected_revision": 1}).status_code
        == 409
    )
    assert (
        client.post(path + "/probe", json={"tool": "z", "expected_revision": 0}).status_code == 409
    )
    assert client.get(path).json() == body


FAMILIES = [
    ["I", "X"],
    ["I", "Z"],
    ["I", "X", "Z", "Y"],
    ["I", "X"],
    ["I", "X", "Z", "Y"],
    ["I", "Z"],
    ["I", "X", "Z", "Y"],
    ["I", "X"],
]


def test_eight_ticket_story_preserves_history_and_completes(client, monkeypatch):
    from server import game

    chosen_families = []

    def choose(family):
        chosen_families.append(list(family))
        return family[-1]

    monkeypatch.setattr(game.secrets, "choice", choose)
    body = client.post("/api/shifts", json={}).json()
    path = f"/api/shifts/{body['id']}"
    credits = 0
    identifiers = []
    customers = []
    for index, family in enumerate(FAMILIES):
        assert body["phase"] == "choose_tool"
        assert body["ticket_index"] == index
        assert body["reading"] is body["debrief"] is None
        assert len(body["history"]) == index
        ticket = body["ticket"]
        assert ticket["suspects"] == family
        assert ticket["description"] and ticket["hint"] and ticket["chapter"]
        identifiers.append(ticket["id"])
        customers.append(ticket["customer"])
        tool = "bell" if len(family) == 4 else ("x" if "Z" in family else "z")
        assert body["revision"] == 3 * index
        probe = client.post(
            path + "/probe", json={"tool": tool, "expected_revision": body["revision"]}
        )
        assert probe.status_code == 200
        assert len(probe.json()["history"]) == index
        assert probe.json()["revision"] == 3 * index + 1
        resolved = client.post(
            path + "/diagnose",
            json={"fault": family[-1], "expected_revision": probe.json()["revision"]},
        )
        assert resolved.status_code == 200
        credits += ticket["reward"]
        assert resolved.json()["credits"] == credits
        assert resolved.json()["revision"] == 3 * index + 2
        advanced = client.post(
            path + "/next", json={"expected_revision": resolved.json()["revision"]}
        )
        assert advanced.status_code == 200
        body = advanced.json()
    assert chosen_families == FAMILIES
    assert len(set(identifiers)) == len(set(customers)) == 8
    assert body["phase"] == "complete"
    assert body["ticket_index"] == 7
    assert body["ticket"] is body["reading"] is body["debrief"] is None
    assert body["correct"] == body["ticket_count"] == len(body["history"]) == 8
    assert body["bell_tokens"] == 0
    assert body["credits"] == sum(item["delta"] for item in body["history"])
    assert body["revision"] == 24
    assert client.post(path + "/next", json={"expected_revision": 24}).status_code == 409
    assert (
        client.post(path + "/probe", json={"tool": "z", "expected_revision": 24}).status_code == 409
    )
    assert client.get(path).json() == body


def test_guess_outside_ticket_suspects_is_rejected_without_revealing(client, shift):
    path = f"/api/shifts/{shift['id']}"
    before = client.post(path + "/probe", json={"tool": "z", "expected_revision": 0}).json()
    response = client.post(path + "/diagnose", json={"fault": "Y", "expected_revision": 1})
    assert response.status_code == 422
    assert isinstance(response.json()["detail"], str)
    assert client.get(path).json() == before


def test_report_is_gated_until_complete_and_exports_all_resolved_circuits(client):
    body = client.post("/api/shifts", json={}).json()
    path = f"/api/shifts/{body['id']}"
    resolved_tickets = []
    for index in range(8):
        denied = client.get(path + "/report")
        assert denied.status_code == 409
        assert isinstance(denied.json()["detail"], str)
        reading = client.post(
            path + "/probe", json={"tool": "z", "expected_revision": body["revision"]}
        )
        assert reading.status_code == 200
        assert client.get(path + "/report").status_code == 409
        resolved = client.post(
            path + "/diagnose", json={"fault": "I", "expected_revision": reading.json()["revision"]}
        ).json()
        resolved_tickets.append({key: resolved[key] for key in ("ticket", "reading", "debrief")})
        assert client.get(path + "/report").status_code == 409
        body = client.post(path + "/next", json={"expected_revision": resolved["revision"]}).json()
    response = client.get(path + "/report")
    assert response.status_code == 200
    report = response.json()
    import qiskit

    assert report["schema_version"] == 1
    assert report["title"] == "Ghost in the Cable"
    assert report["engine"] == "qiskit-statevector"
    assert report["qiskit_version"] == qiskit.__version__
    assert report["shift"] == body
    assert report["resolved_tickets"] == resolved_tickets
    assert len(report["resolved_tickets"]) == 8
    assert report["limitations"]
    assert client.get(path + "/report").json() == report


def test_evidence_contains_exact_circuit_derived_distributions(client):
    response = client.get("/api/evidence")
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "kind",
        "conditions",
        "unassisted_bound",
        "entangled_ideal",
        "mappings",
        "sources",
        "limitations",
    }
    assert body["kind"] == "exact-statevector"
    assert body["unassisted_bound"] == 0.5
    assert body["entangled_ideal"] == 1.0
    assert "equiprobable" in body["conditions"]
    assert "one" in body["conditions"]
    expected = {
        "I": ["0", "0", "00"],
        "X": ["1", "0", "10"],
        "Z": ["0", "1", "01"],
        "Y": ["1", "1", "11"],
    }
    assert [row["fault"] for row in body["mappings"]] == list(expected)
    for row in body["mappings"]:
        for tool, bit in zip(("z", "x", "bell"), expected[row["fault"]], strict=True):
            assert sum(row[tool].values()) == pytest.approx(1)
            assert row[tool][bit] == 1.0
            assert all(prob == 0.0 for outcome, prob in row[tool].items() if outcome != bit)
    for tool, optimum in (("z", 0.5), ("x", 0.5), ("bell", 1.0)):
        outcomes = set().union(*(row[tool] for row in body["mappings"]))
        success = (
            sum(max(row[tool].get(outcome, 0) for row in body["mappings"]) for outcome in outcomes)
            / 4
        )
        assert success == optimum
    assert body["limitations"]
    assert all(set(source) == {"title", "url"} for source in body["sources"])
    assert all(source["url"].startswith("https://") for source in body["sources"])


def test_evidence_uses_engine_distributions_instead_of_repeating_a_lookup_table(
    client, monkeypatch
):
    from server import engine

    calls = []
    original = engine.exact_probabilities

    def recording_distribution(tool, fault):
        calls.append((tool, fault))
        return original(tool, fault)

    monkeypatch.setattr(engine, "exact_probabilities", recording_distribution)
    assert client.get("/api/evidence").status_code == 200
    assert set(calls) == {
        (tool, fault) for tool in ("z", "x", "bell") for fault in ("I", "X", "Z", "Y")
    }
    assert len(calls) == 12


def test_local_sessions_expire_after_idle_ttl_and_unknown_ids_explain_recovery():
    from server.app import create_app
    from server.game import SessionStore

    now = [0.0]
    store = SessionStore(max_sessions=2, idle_ttl_seconds=10, clock=lambda: now[0])
    client = APIClient(create_app(store=store))
    shift = client.post("/api/shifts", json={}).json()
    path = f"/api/shifts/{shift['id']}"
    now[0] = 9
    assert client.get(path).status_code == 200
    now[0] = 18
    assert client.get(path).status_code == 200  # access refreshes idle expiry
    now[0] = 28
    expired = client.get(path)
    assert expired.status_code == 404
    assert "new shift" in expired.json()["detail"].lower()
    assert "expired" in expired.json()["detail"].lower()
    assert (
        client.post(path + "/probe", json={"tool": "bell", "expected_revision": 0}).status_code
        == 404
    )
    restarted = APIClient(create_app())
    assert restarted.get(path).status_code == 404


def test_session_capacity_evicts_least_recently_used_shift():
    from server.app import create_app
    from server.game import SessionStore

    now = [0.0]
    store = SessionStore(max_sessions=2, idle_ttl_seconds=100, clock=lambda: now[0])
    client = APIClient(create_app(store=store))
    first = client.post("/api/shifts", json={}).json()
    now[0] = 1
    second = client.post("/api/shifts", json={}).json()
    now[0] = 2
    assert client.get(f"/api/shifts/{first['id']}").status_code == 200
    now[0] = 3
    third = client.post("/api/shifts", json={}).json()
    assert client.get(f"/api/shifts/{second['id']}").status_code == 404
    assert client.get(f"/api/shifts/{first['id']}").status_code == 200
    assert client.get(f"/api/shifts/{third['id']}").status_code == 200


@pytest.mark.parametrize("options", [{"max_sessions": 0}, {"idle_ttl_seconds": 0}])
def test_session_store_requires_positive_bounds(options):
    from server.game import SessionStore

    with pytest.raises(ValueError):
        SessionStore(**options)


@pytest.mark.parametrize(
    "path", ["/api/health", "/api/meta", "/api/evidence", "/api/missing", "/api/shifts/missing"]
)
def test_api_responses_disable_caching_and_set_security_headers(client, path):
    response = client.get(path)
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["referrer-policy"] == "no-referrer"
    assert response.headers["x-frame-options"] == "DENY"
    assert "default-src 'self'" in response.headers["content-security-policy"]
    assert "object-src 'none'" in response.headers["content-security-policy"]
    assert "*" not in response.headers.get("access-control-allow-origin", "")


def test_no_remote_documentation_or_wildcard_cross_origin_access(client):
    assert client.get("/docs").status_code == 404
    assert client.get("/redoc").status_code == 404
    response = client.options(
        "/api/shifts",
        headers={
            "Origin": "https://not-the-shop.example",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert "access-control-allow-origin" not in response.headers
    assert response.headers["cache-control"] == "no-store"


def test_serves_built_frontend_and_extensionless_routes_without_swallowing_api(tmp_path):
    from server.app import create_app

    dist = tmp_path / "dist"
    (dist / "assets").mkdir(parents=True)
    (dist / "index.html").write_text("<!doctype html><title>Local ghost fixture</title>")
    (dist / "assets" / "app.js").write_text("console.log('local-fixture')")
    client = APIClient(create_app(dist_dir=dist))
    for route in ("/", "/field-guide", "/evidence/view"):
        response = client.get(route)
        assert response.status_code == 200
        assert response.text == "<!doctype html><title>Local ghost fixture</title>"
        assert response.headers["content-type"].startswith("text/html")
        assert "frame-ancestors 'none'" in response.headers["content-security-policy"]
    asset = client.get("/assets/app.js")
    assert asset.status_code == 200
    assert asset.text == "console.log('local-fixture')"
    assert "javascript" in asset.headers["content-type"]
    assert client.get("/api/health").json()["status"] == "ok"
    for route in ("/api", "/api/no-such-route", "/api/debug", "/api/fault", "/docs", "/redoc"):
        response = client.get(route)
        assert response.status_code == 404
        assert response.headers["content-type"].startswith("application/json")
    assert client.get("/assets/missing.js").status_code == 404
    assert client.post("/field-guide", json={}).status_code == 405


def test_static_paths_cannot_escape_build_directory_even_through_symlinks(tmp_path):
    from server.app import create_app

    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "index.html").write_text("fixture")
    private = tmp_path / "secret.txt"
    private.write_text("must-not-be-served")
    (dist / "escape.txt").symlink_to(private)
    client = APIClient(create_app(dist_dir=dist))
    for path in ("/%2e%2e/secret.txt", "/escape.txt", "/server/app.py"):
        response = client.get(path)
        assert response.status_code == 404
        assert "must-not-be-served" not in response.text


def test_missing_frontend_build_returns_json_error(tmp_path):
    from server.app import create_app

    client = APIClient(create_app(dist_dir=tmp_path / "not-built"))
    response = client.get("/")
    assert response.status_code == 404
    assert "build" in response.json()["detail"].lower()


def test_spa_index_symlink_cannot_escape_build_directory(tmp_path):
    from server.app import create_app

    dist = tmp_path / "dist"
    dist.mkdir()
    private = tmp_path / "private.html"
    private.write_text("private-index")
    (dist / "index.html").symlink_to(private)
    client = APIClient(create_app(dist_dir=dist))
    response = client.get("/field-guide")
    assert response.status_code == 404
    assert "private-index" not in response.text


def test_engine_failure_is_honest_json_and_does_not_spend_probe_or_token(
    client, shift, monkeypatch
):
    from server import engine

    original = engine.run_probe

    def fail(*args, **kwargs):
        raise RuntimeError("private fault and circuit must not be sent to the browser")

    monkeypatch.setattr(engine, "run_probe", fail)
    path = f"/api/shifts/{shift['id']}"
    response = client.post(path + "/probe", json={"tool": "bell", "expected_revision": 0})
    assert response.status_code == 503
    assert response.headers["cache-control"] == "no-store"
    assert set(response.json()) == {"detail"}
    assert "unavailable" in response.json()["detail"].lower()
    assert "private fault" not in response.text
    assert client.get(path).json() == shift
    monkeypatch.setattr(engine, "run_probe", original)
    recovered = client.post(path + "/probe", json={"tool": "bell", "expected_revision": 0})
    assert recovered.status_code == 200
    assert recovered.json()["bell_tokens"] == 2


@pytest.mark.parametrize(
    "endpoint,payload",
    [
        ("", {"fault": "X"}),
        ("", {"seed": 7}),
        ("", {"bell_tokens": 99}),
        ("/probe", {}),
        ("/probe", {"tool": "Z"}),
        ("/probe", {"tool": "unknown"}),
        ("/probe", {"tool": None}),
        ("/probe", {"tool": True}),
        ("/probe", {"tool": ["z"]}),
        ("/probe", {"tool": "z", "seed": 8}),
        ("/probe", {"tool": "z", "fault": "I"}),
        ("/probe", {"tool": "z", "query_count": 0}),
        ("/diagnose", {}),
        ("/diagnose", {"fault": "x"}),
        ("/diagnose", {"fault": "XX"}),
        ("/diagnose", {"fault": 0}),
        ("/diagnose", {"fault": False}),
        ("/diagnose", {"fault": "I", "correct": True}),
        ("/next", {"ticket_index": 7}),
        ("/next", {"fault": "I"}),
    ],
)
def test_untrusted_json_rejects_invalid_types_literals_missing_fields_and_extras(
    client, shift, endpoint, payload
):
    path = f"/api/shifts/{shift['id']}"
    if endpoint == "/diagnose":
        assert (
            client.post(path + "/probe", json={"tool": "z", "expected_revision": 0}).status_code
            == 200
        )
    before = client.get(path).json()
    target = "/api/shifts" if endpoint == "" else path + endpoint
    payload = {**payload, "expected_revision": before["revision"]} if endpoint else payload
    response = client.post(target, json=payload)
    assert response.status_code == 422
    assert response.headers["cache-control"] == "no-store"
    assert "detail" in response.json()
    assert client.get(path).json() == before


@pytest.mark.parametrize("raw", ["", "null", "[]", "true", "1", '"z"', "{bad-json", '{"tool":'])
def test_nonobject_or_malformed_json_is_not_accepted(client, shift, raw):
    path = f"/api/shifts/{shift['id']}"
    response = client.post(
        path + "/probe", content=raw, headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 422
    assert client.get(path).json() == shift


@pytest.mark.parametrize(
    "method,suffix,payload",
    [
        ("GET", "", None),
        ("GET", "/report", None),
        ("POST", "/probe", {"tool": "bell", "expected_revision": 0}),
        ("POST", "/diagnose", {"fault": "I", "expected_revision": 0}),
        ("POST", "/next", {"expected_revision": 0}),
    ],
)
def test_unknown_session_scope_is_404(client, method, suffix, payload):
    kwargs = {"json": payload} if method == "POST" else {}
    response = client.request(method, "/api/shifts/unknown-bearer-id" + suffix, **kwargs)
    assert response.status_code == 404
    assert isinstance(response.json()["detail"], str)


def test_illegal_phase_transitions_never_change_state(client, shift):
    path = f"/api/shifts/{shift['id']}"
    for suffix, payload in (
        ("/diagnose", {"fault": "I", "expected_revision": 0}),
        ("/next", {"expected_revision": 0}),
    ):
        assert client.post(path + suffix, json=payload).status_code == 409
        assert client.get(path).json() == shift
    probing = client.post(path + "/probe", json={"tool": "z", "expected_revision": 0}).json()
    assert (
        client.post(path + "/next", json={"expected_revision": probing["revision"]}).status_code
        == 409
    )
    assert client.get(path).json() == probing
    resolved = client.post(path + "/diagnose", json={"fault": "I", "expected_revision": 1}).json()
    for suffix, payload in (
        ("/probe", {"tool": "z", "expected_revision": 2}),
        ("/diagnose", {"fault": "I", "expected_revision": 2}),
    ):
        assert client.post(path + suffix, json=payload).status_code == 409
        assert client.get(path).json() == resolved


def test_shifts_are_isolated_and_debug_queries_cannot_disclose_hidden_state(client, shift):
    path = f"/api/shifts/{shift['id']}"
    other = client.post("/api/shifts", json={}).json()
    assert client.get(path + "?debug=true&fault=X&seed=7").json() == shift
    for suffix in ("/fault", "/debug", "/seed", "/circuit"):
        assert client.get(path + suffix).status_code == 404
    assert (
        client.post(path + "/probe", json={"tool": "bell", "expected_revision": 0}).status_code
        == 200
    )
    assert client.get(f"/api/shifts/{other['id']}").json() == other


def test_exhausted_bell_budget_does_not_spend_query_and_free_tools_still_work(client, shift):
    path = f"/api/shifts/{shift['id']}"
    current = shift
    for remaining in (2, 1, 0):
        probing = client.post(
            path + "/probe", json={"tool": "bell", "expected_revision": current["revision"]}
        )
        assert probing.status_code == 200
        assert probing.json()["bell_tokens"] == remaining
        resolved = client.post(
            path + "/diagnose", json={"fault": "I", "expected_revision": probing.json()["revision"]}
        )
        assert resolved.status_code == 200
        advanced = client.post(
            path + "/next", json={"expected_revision": resolved.json()["revision"]}
        )
        assert advanced.status_code == 200
        current = advanced.json()
    before = client.get(path).json()
    denied = client.post(
        path + "/probe", json={"tool": "bell", "expected_revision": before["revision"]}
    )
    assert denied.status_code == 409
    assert "tokens" in denied.json()["detail"].lower()
    assert client.get(path).json() == before
    free = client.post(path + "/probe", json={"tool": "z", "expected_revision": before["revision"]})
    assert free.status_code == 200
    assert free.json()["bell_tokens"] == 0


def concurrent_posts(client, path, payload, count=12):
    from concurrent.futures import ThreadPoolExecutor
    from threading import Barrier

    barrier = Barrier(count)

    def send():
        barrier.wait(timeout=10)
        return client.post(path, json=payload)

    with ThreadPoolExecutor(max_workers=count) as pool:
        futures = [pool.submit(send) for _ in range(count)]
        return [future.result(timeout=20) for future in futures]


def test_concurrent_duplicate_probes_accept_one_qiskit_query_and_one_token(
    client, shift, monkeypatch
):
    from threading import Lock
    from time import sleep

    from qiskit.quantum_info import Statevector

    sampled = []
    lock = Lock()
    original = Statevector.sample_memory

    def record_sample(state, shots, *args, **kwargs):
        with lock:
            sampled.append(shots)
        sleep(0.03)  # widen the in-flight simulation window, without replacing physics
        return original(state, shots, *args, **kwargs)

    monkeypatch.setattr(Statevector, "sample_memory", record_sample)
    path = f"/api/shifts/{shift['id']}"
    responses = concurrent_posts(client, path + "/probe", {"tool": "bell", "expected_revision": 0})
    assert sorted(response.status_code for response in responses) == [200] + [409] * 11
    assert sampled == [1]
    accepted = next(response.json() for response in responses if response.status_code == 200)
    assert accepted["bell_tokens"] == 2
    assert accepted["phase"] == "diagnose"
    assert client.get(path).json() == accepted


def test_concurrent_duplicate_diagnoses_award_once_and_append_one_history_entry(
    client, shift, monkeypatch
):
    from time import sleep

    from server import game

    path = f"/api/shifts/{shift['id']}"
    reading = client.post(path + "/probe", json={"tool": "bell", "expected_revision": 0}).json()[
        "reading"
    ]
    guess = {"00": "I", "10": "X"}[reading["bits"]]
    original = game.Debrief

    def slower_debrief(*args, **kwargs):
        sleep(0.03)
        return original(*args, **kwargs)

    monkeypatch.setattr(game, "Debrief", slower_debrief)
    responses = concurrent_posts(
        client, path + "/diagnose", {"fault": guess, "expected_revision": 1}
    )
    assert sorted(response.status_code for response in responses) == [200] + [409] * 11
    accepted = next(response.json() for response in responses if response.status_code == 200)
    assert accepted["credits"] == shift["ticket"]["reward"]
    assert accepted["correct"] == 1
    assert len(accepted["history"]) == 1
    assert client.get(path).json() == accepted


def test_concurrent_duplicate_next_requests_cannot_skip_a_ticket(client, shift):
    path = f"/api/shifts/{shift['id']}"
    assert (
        client.post(path + "/probe", json={"tool": "z", "expected_revision": 0}).status_code == 200
    )
    assert (
        client.post(path + "/diagnose", json={"fault": "I", "expected_revision": 1}).status_code
        == 200
    )
    responses = concurrent_posts(client, path + "/next", {"expected_revision": 2})
    assert sorted(response.status_code for response in responses) == [200] + [409] * 11
    recovered = client.get(path).json()
    assert recovered["ticket_index"] == 1
    assert recovered["phase"] == "choose_tool"
    assert len(recovered["history"]) == 1


@pytest.mark.parametrize(
    "action,extra", [("probe", {"tool": "z"}), ("diagnose", {"fault": "I"}), ("next", {})]
)
@pytest.mark.parametrize("invalid", [None, True, False, -1, 0.0, 1.5, "0", [], {}])
def test_expected_revision_requires_strict_nonnegative_integer(
    client, shift, action, extra, invalid
):
    path = f"/api/shifts/{shift['id']}"
    response = client.post(path + "/" + action, json={**extra, "expected_revision": invalid})
    assert response.status_code == 422
    assert client.get(path).json() == shift


@pytest.mark.parametrize(
    "action,extra", [("probe", {"tool": "z"}), ("diagnose", {"fault": "I"}), ("next", {})]
)
def test_expected_revision_is_required_without_legacy_bypass(client, shift, action, extra):
    path = f"/api/shifts/{shift['id']}"
    response = client.post(path + "/" + action, json=extra)
    assert response.status_code == 422
    assert client.get(path).json() == shift


def test_revision_advances_once_on_success_and_never_on_get_or_failure(client, shift):
    path = f"/api/shifts/{shift['id']}"
    assert shift["revision"] == 0
    assert client.get(path).json() == shift
    assert client.post(path + "/next", json={"expected_revision": 0}).status_code == 409
    assert client.get(path).json() == shift
    probing = client.post(path + "/probe", json={"tool": "z", "expected_revision": 0}).json()
    assert probing["revision"] == 1
    assert client.get(path).json() == probing
    assert (
        client.post(path + "/diagnose", json={"fault": "Y", "expected_revision": 1}).status_code
        == 422
    )
    assert client.get(path).json() == probing
    resolved = client.post(path + "/diagnose", json={"fault": "I", "expected_revision": 1}).json()
    assert resolved["revision"] == 2
    advanced = client.post(path + "/next", json={"expected_revision": 2}).json()
    assert advanced["revision"] == 3
    assert client.get(path).json() == advanced


@pytest.mark.parametrize("action", ["probe", "diagnose", "next"])
def test_captured_previous_ticket_action_cannot_replay_after_phase_cycle(client, shift, action):
    """Replay the original payload unchanged after the same phase recurs."""
    path = f"/api/shifts/{shift['id']}"
    captured = {
        "probe": {"tool": "bell", "expected_revision": 0},
        "diagnose": {"fault": "I", "expected_revision": 1},
        "next": {"expected_revision": 2},
    }
    for operation in ("probe", "diagnose", "next"):
        response = client.post(path + "/" + operation, json=captured[operation])
        assert response.status_code == 200, response.text
    assert client.get(path).json()["ticket_index"] == 1
    if action in ("diagnose", "next"):
        assert (
            client.post(path + "/probe", json={"tool": "z", "expected_revision": 3}).status_code
            == 200
        )
    if action == "next":
        assert (
            client.post(path + "/diagnose", json={"fault": "I", "expected_revision": 4}).status_code
            == 200
        )
    before = client.get(path).json()
    replayed = client.post(path + "/" + action, json=captured[action])
    assert replayed.status_code == 409, replayed.text
    assert client.get(path).json() == before


def test_unexpected_internal_errors_remain_json_without_fault_or_traceback(client, monkeypatch):
    from server import engine

    def fail(*args, **kwargs):
        raise RuntimeError("private fault X and private circuit")

    monkeypatch.setattr(engine, "exact_probabilities", fail)
    response = client.get("/api/evidence")
    assert response.status_code == 500
    assert set(response.json()) == {"detail"}
    assert "private fault" not in response.text
    assert "Traceback" not in response.text
    assert response.headers["cache-control"] == "no-store"
