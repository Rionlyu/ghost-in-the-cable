"""Focused chapters use server-owned sequences, budgets and revision guards."""

import asyncio

import httpx
import pytest

from server.app import create_app


class Client:
    def __init__(self, **options):
        self.app = create_app(**options)

    def request(self, method, path, **kwargs):
        async def send():
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=self.app), base_url="http://testserver"
            ) as connection:
                return await connection.request(method, path, **kwargs)

        return asyncio.run(send())

    def get(self, path):
        return self.request("GET", path)

    def post(self, path, body):
        return self.request("POST", path, json=body)


def good(response):
    assert response.status_code == 200, response.text
    return response.json()


@pytest.fixture
def client():
    return Client()


ROUTE_IDS = {
    "story": (
        "porchlight",
        "whisperphone",
        "mirror-organ",
        "skeleton-sign",
        "fog-machine",
        "moon-radio",
        "midnight-projector",
        "dawn-bell",
    ),
    "bits": ("porchlight", "skeleton-sign", "dawn-bell"),
    "phase": ("whisperphone", "moon-radio"),
    "entanglement": ("mirror-organ", "fog-machine", "midnight-projector"),
}
INITIAL_TOKENS = {"story": 3, "bits": 0, "phase": 0, "entanglement": 3}


@pytest.mark.parametrize("route", ["bits", "phase", "entanglement"])
def test_focused_creation_selects_its_real_first_ticket_and_budget(client, route):
    state = good(client.post("/api/shifts", {"route": route}))
    assert state["route"] == route
    assert state["ticket"]["id"] == ROUTE_IDS[route][0]
    assert state["ticket_count"] == len(ROUTE_IDS[route])
    assert state["bell_tokens"] == INITIAL_TOKENS[route]
    assert state["phase"] == "choose_tool"
    assert state["revision"] == state["ticket_index"] == state["credits"] == state["correct"] == 0
    assert state["reading"] is state["debrief"] is None
    assert state["history"] == []
    assert client.get(f"/api/shifts/{state['id']}").json() == state


@pytest.mark.parametrize("body", [{}, {"route": "story"}])
def test_creation_defaults_to_public_story_route(client, body):
    state = good(client.post("/api/shifts", body))
    assert state["route"] == "story"
    assert state["ticket"]["id"] == "porchlight"
    assert state["ticket_count"] == 8
    assert state["bell_tokens"] == 3
    assert state["revision"] == state["ticket_index"] == 0
    assert client.get(f"/api/shifts/{state['id']}").json() == state


@pytest.mark.parametrize("route", ["story", "bits", "phase", "entanglement"])
def test_every_route_progresses_real_tickets_and_completes_at_its_own_length(
    client, route, monkeypatch
):
    from qiskit.quantum_info import Statevector

    sampled = []
    original = Statevector.sample_memory

    def record_sample(state, shots, *args, **kwargs):
        sampled.append(shots)
        return original(state, shots, *args, **kwargs)

    monkeypatch.setattr(Statevector, "sample_memory", record_sample)
    state = good(client.post("/api/shifts", {"route": route}))
    path = f"/api/shifts/{state['id']}"
    credits = 0
    tokens = INITIAL_TOKENS[route]
    families = {
        "porchlight": ["I", "X"],
        "skeleton-sign": ["I", "X"],
        "dawn-bell": ["I", "X"],
        "whisperphone": ["I", "Z"],
        "moon-radio": ["I", "Z"],
        "mirror-organ": ["I", "X", "Z", "Y"],
        "fog-machine": ["I", "X", "Z", "Y"],
        "midnight-projector": ["I", "X", "Z", "Y"],
    }
    decoders = {
        "z": {"0": "I", "1": "X"},
        "x": {"0": "I", "1": "Z"},
        "bell": {"00": "I", "10": "X", "01": "Z", "11": "Y"},
    }
    for index, ticket_id in enumerate(ROUTE_IDS[route]):
        assert state["route"] == route
        assert state["ticket_count"] == len(ROUTE_IDS[route])
        assert state["ticket_index"] == index
        assert state["ticket"]["id"] == ticket_id
        assert state["ticket"]["suspects"] == families[ticket_id]
        assert state["revision"] == 3 * index
        assert state["phase"] == "choose_tool"
        assert state["reading"] is state["debrief"] is None
        assert [entry["ticket_id"] for entry in state["history"]] == list(ROUTE_IDS[route][:index])
        family = state["ticket"]["suspects"]
        tool = "bell" if len(family) == 4 else ("x" if "Z" in family else "z")
        measured = good(
            client.post(path + "/probe", {"tool": tool, "expected_revision": state["revision"]})
        )
        tokens -= int(tool == "bell")
        assert measured["route"] == route
        assert measured["revision"] == 3 * index + 1
        assert measured["bell_tokens"] == tokens
        assert measured["phase"] == "diagnose"
        assert measured["debrief"] is None
        assert len(measured["history"]) == index
        assert set(measured["reading"]) == {"tool", "bits", "engine", "qubits", "query_count"}
        assert measured["reading"]["engine"] == "qiskit-statevector"
        assert measured["reading"]["query_count"] == 1
        assert client.get(path).json() == measured
        assert sampled == [1] * (index + 1)
        guess = decoders[tool][measured["reading"]["bits"]]
        resolved = good(
            client.post(
                path + "/diagnose", {"fault": guess, "expected_revision": measured["revision"]}
            )
        )
        credits += state["ticket"]["reward"]
        assert resolved["route"] == route
        assert resolved["revision"] == 3 * index + 2
        assert resolved["correct"] == index + 1
        assert resolved["credits"] == credits
        assert resolved["debrief"]["fault"] == guess
        assert resolved["debrief"]["correct"] is True
        assert resolved["debrief"]["probabilities"][measured["reading"]["bits"]] == 1.0
        assert resolved["debrief"]["circuit_text"]
        assert resolved["debrief"]["gates"]
        if tool == "bell":
            assert resolved["debrief"]["probe_marginal"] == {"0": 0.5, "1": 0.5}
            assert resolved["debrief"]["reference_marginal"] == {"0": 0.5, "1": 0.5}
        state = good(client.post(path + "/next", {"expected_revision": resolved["revision"]}))
        assert state["revision"] == 3 * (index + 1)
    count = len(ROUTE_IDS[route])
    assert state["route"] == route
    assert state["phase"] == "complete"
    assert state["ticket_index"] == count - 1
    assert state["ticket_count"] == state["correct"] == len(state["history"]) == count
    assert state["ticket"] is state["reading"] is state["debrief"] is None
    assert state["bell_tokens"] == 0
    assert state["credits"] == sum(entry["delta"] for entry in state["history"]) == credits
    assert state["revision"] == 3 * count
    assert sampled == [1] * count
    for action, fields in (("probe", {"tool": "z"}), ("diagnose", {"fault": "I"}), ("next", {})):
        denied = client.post(
            path + "/" + action, {**fields, "expected_revision": state["revision"]}
        )
        assert denied.status_code == 409
        assert client.get(path).json() == state
    assert sampled == [1] * count


@pytest.mark.parametrize("route", ["story", "bits", "phase", "entanglement"])
@pytest.mark.parametrize("changed", ["route_sequence", "ticket_catalogue"])
def test_session_freezes_its_route_sequence_and_ticket_definitions_at_creation(
    client, route, changed, monkeypatch
):
    from copy import deepcopy

    from server import game

    expected = {ticket["id"]: deepcopy(ticket) for ticket in game.TICKETS}
    state = good(client.post("/api/shifts", {"route": route}))
    path = f"/api/shifts/{state['id']}"
    if changed == "route_sequence":
        monkeypatch.setitem(game.ROUTE_TICKET_IDS, route, tuple(reversed(ROUTE_IDS[route])))
    else:
        for ticket in game.TICKETS:
            monkeypatch.setitem(ticket, "title", "Changed after this shift opened")
            monkeypatch.setitem(ticket, "reward", 1)
            monkeypatch.setitem(ticket, "suspects", ["I"])
    for ticket_id in ROUTE_IDS[route]:
        assert state["route"] == route
        assert state["ticket_count"] == len(ROUTE_IDS[route])
        assert state["ticket"] == expected[ticket_id]
        measured = good(
            client.post(path + "/probe", {"tool": "z", "expected_revision": state["revision"]})
        )
        resolved = good(
            client.post(
                path + "/diagnose", {"fault": "I", "expected_revision": measured["revision"]}
            )
        )
        state = good(client.post(path + "/next", {"expected_revision": resolved["revision"]}))
    assert state["phase"] == "complete"
    assert [entry["ticket_id"] for entry in state["history"]] == list(ROUTE_IDS[route])
    assert state["revision"] == 3 * len(ROUTE_IDS[route])


@pytest.mark.parametrize("route", ["story", "bits", "phase", "entanglement"])
def test_report_is_gated_by_route_completion_and_exports_every_actual_circuit(client, route):
    state = good(client.post("/api/shifts", {"route": route}))
    path = f"/api/shifts/{state['id']}"
    records = []

    def report_denied_without_changes(current):
        denied = client.get(path + "/report")
        assert denied.status_code == 409
        assert set(denied.json()) == {"detail"}
        assert "eight" not in denied.json()["detail"].lower()
        assert "report" in denied.json()["detail"].lower()
        assert client.get(path).json() == current

    for index in range(len(ROUTE_IDS[route])):
        report_denied_without_changes(state)
        measured = good(
            client.post(path + "/probe", {"tool": "z", "expected_revision": state["revision"]})
        )
        report_denied_without_changes(measured)
        resolved = good(
            client.post(
                path + "/diagnose", {"fault": "I", "expected_revision": measured["revision"]}
            )
        )
        report_denied_without_changes(resolved)
        records.append({key: resolved[key] for key in ("ticket", "reading", "debrief")})
        assert len(resolved["history"]) == index + 1
        state = good(client.post(path + "/next", {"expected_revision": resolved["revision"]}))
    report = good(client.get(path + "/report"))
    assert set(report) == {
        "schema_version",
        "title",
        "engine",
        "qiskit_version",
        "shift",
        "resolved_tickets",
        "limitations",
    }
    assert report["schema_version"] == 1
    assert report["engine"] == "qiskit-statevector"
    assert report["shift"] == state
    assert report["shift"]["route"] == route
    assert report["resolved_tickets"] == records
    assert len(records) == state["ticket_count"] == len(ROUTE_IDS[route])
    assert [record["ticket"]["id"] for record in records] == list(ROUTE_IDS[route])
    assert state["correct"] == sum(record["debrief"]["correct"] for record in records)
    assert state["credits"] == sum(record["debrief"]["reward_delta"] for record in records)
    assert state["revision"] == 3 * len(records)
    assert client.get(path + "/report").json() == report
    assert client.get(path).json() == state


@pytest.mark.parametrize(
    "route",
    [
        None,
        True,
        False,
        0,
        1.0,
        [],
        {},
        ["bits"],
        {"id": "bits"},
        "",
        "Story",
        "bit",
        "phase ",
        "all",
    ],
)
def test_create_rejects_non_enum_routes_without_touching_an_existing_shift(client, route):
    before = good(client.post("/api/shifts", {}))
    response = client.post("/api/shifts", {"route": route})
    assert response.status_code == 422
    assert response.headers["cache-control"] == "no-store"
    assert client.get(f"/api/shifts/{before['id']}").json() == before


@pytest.mark.parametrize("route", ["story", "bits", "phase", "entanglement"])
@pytest.mark.parametrize(
    "extra",
    [
        {"ticket_ids": ["dawn-bell"]},
        {"tickets": ["dawn-bell"]},
        {"ticket": "dawn-bell"},
        {"fault": "X"},
        {"faults": ["X"]},
        {"seed": 7},
        {"bell_tokens": 99},
        {"expected_revision": 0},
        {"revision": 0},
        {"ticket_index": 2},
    ],
)
def test_create_forbids_arbitrary_tickets_faults_seeds_and_state(client, route, extra):
    response = client.post("/api/shifts", {"route": route, **extra})
    assert response.status_code == 422
    assert response.headers["cache-control"] == "no-store"
    assert "detail" in response.json()


MISSING = object()


@pytest.mark.parametrize("route", ["story", "bits", "phase", "entanglement"])
@pytest.mark.parametrize(
    "action,fields", [("probe", {"tool": "z"}), ("diagnose", {"fault": "I"}), ("next", {})]
)
@pytest.mark.parametrize("revision", [MISSING, None, True, False, -1, 0.0, 1.5, "0", [], {}])
def test_all_routes_keep_required_strict_expected_revisions(
    client, route, action, fields, revision
):
    before = good(client.post("/api/shifts", {"route": route}))
    path = f"/api/shifts/{before['id']}"
    payload = fields if revision is MISSING else {**fields, "expected_revision": revision}
    response = client.post(path + "/" + action, payload)
    assert response.status_code == 422
    assert client.get(path).json() == before


@pytest.mark.parametrize("route", ["story", "bits", "phase", "entanglement"])
def test_route_cannot_be_changed_through_queries_or_mutations(client, route):
    state = good(client.post("/api/shifts", {"route": route}))
    path = f"/api/shifts/{state['id']}"
    other = "phase" if route != "phase" else "bits"
    assert client.get(path + f"?route={other}&ticket_ids=dawn-bell&fault=X&seed=7").json() == state
    for method in ("PATCH", "PUT"):
        assert client.request(method, path, json={"route": other}).status_code == 405
        assert client.get(path).json() == state
    for action, fields in (("probe", {"tool": "z"}), ("diagnose", {"fault": "I"}), ("next", {})):
        payload = {**fields, "expected_revision": state["revision"]}
        response = client.post(path + "/" + action, {**payload, "route": other})
        assert response.status_code == 422
        assert client.get(path).json() == state
        state = good(client.post(path + "/" + action, payload))
        assert state["route"] == route


@pytest.mark.parametrize("route", ["story", "bits", "phase", "entanglement"])
def test_selecting_another_route_starts_an_independent_shift_without_rerolling(client, route):
    state = good(client.post("/api/shifts", {"route": route}))
    path = f"/api/shifts/{state['id']}"
    measured = good(client.post(path + "/probe", {"tool": "z", "expected_revision": 0}))
    other = "entanglement" if route != "entanglement" else "bits"
    fresh = good(client.post("/api/shifts", {"route": other}))
    assert fresh["id"] != measured["id"]
    assert fresh["route"] == other
    assert fresh["revision"] == 0
    assert fresh["bell_tokens"] == INITIAL_TOKENS[other]
    assert fresh["history"] == []
    assert fresh["reading"] is fresh["debrief"] is None
    assert client.get(path).json() == measured
    assert client.get(f"/api/shifts/{fresh['id']}").json() == fresh


@pytest.mark.parametrize("route,tool", [("bits", "x"), ("phase", "z")])
def test_zero_token_routes_reject_bell_before_simulation_but_allow_ambiguous_free_tools(
    client, route, tool, monkeypatch
):
    from server import engine

    calls = []
    original = engine.run_probe

    def record_probe(*args, **kwargs):
        calls.append(args)
        return original(*args, **kwargs)

    monkeypatch.setattr(engine, "run_probe", record_probe)
    state = good(client.post("/api/shifts", {"route": route}))
    path = f"/api/shifts/{state['id']}"
    denied = client.post(path + "/probe", {"tool": "bell", "expected_revision": 0})
    assert denied.status_code == 409
    assert "tokens" in denied.json()["detail"].lower()
    assert calls == []
    assert client.get(path).json() == state
    measured = good(client.post(path + "/probe", {"tool": tool, "expected_revision": 0}))
    assert measured["reading"]["tool"] == tool
    assert measured["reading"]["bits"] == "0"
    assert measured["bell_tokens"] == 0
    assert measured["revision"] == 1
    assert measured["debrief"] is None
    assert len(calls) == 1


def concurrent_posts(client, path, payload, count=4):
    from concurrent.futures import ThreadPoolExecutor
    from threading import Barrier

    barrier = Barrier(count)

    def send():
        barrier.wait(timeout=10)
        return client.post(path, payload)

    with ThreadPoolExecutor(max_workers=count) as pool:
        futures = [pool.submit(send) for _ in range(count)]
        return [future.result(timeout=20) for future in futures]


@pytest.mark.parametrize("route", ["story", "bits", "phase", "entanglement"])
def test_full_route_replays_and_concurrent_duplicates_never_repeat_quantum_or_game_effects(
    client, route, monkeypatch
):
    from threading import Lock
    from time import sleep

    from qiskit.quantum_info import Statevector

    from server import engine, game

    calls, sampled, chosen = [], [], []
    lock = Lock()
    original_probe = engine.run_probe
    original_sample = Statevector.sample_memory
    original_choice = game.secrets.choice

    def record_probe(*args, **kwargs):
        with lock:
            calls.append(args)
        sleep(0.003)
        return original_probe(*args, **kwargs)

    def record_sample(state, shots, *args, **kwargs):
        with lock:
            sampled.append(shots)
        return original_sample(state, shots, *args, **kwargs)

    def record_choice(family):
        with lock:
            chosen.append(tuple(family))
        return original_choice(family)

    monkeypatch.setattr(engine, "run_probe", record_probe)
    monkeypatch.setattr(Statevector, "sample_memory", record_sample)
    monkeypatch.setattr(game.secrets, "choice", record_choice)
    state = good(client.post("/api/shifts", {"route": route}))
    path = f"/api/shifts/{state['id']}"
    captured = {}
    credits = 0
    tokens = INITIAL_TOKENS[route]
    count = len(ROUTE_IDS[route])
    for index, ticket_id in enumerate(ROUTE_IDS[route]):
        assert state["ticket"]["id"] == ticket_id
        family = state["ticket"]["suspects"]
        tool = "bell" if len(family) == 4 else ("x" if "Z" in family else "z")
        for action, fields in (
            ("probe", {"tool": tool}),
            ("diagnose", {"fault": "I"}),
            ("next", {}),
        ):
            if index:
                before_calls = len(calls), list(sampled), len(chosen)
                for old_action, old_payload in captured.items():
                    denied = client.post(path + "/" + old_action, old_payload)
                    assert denied.status_code == 409, denied.text
                    assert "changed" in denied.json()["detail"].lower()
                    assert client.get(path).json() == state
                assert (len(calls), sampled, len(chosen)) == before_calls
            before_revision = state["revision"]
            payload = {**fields, "expected_revision": before_revision}
            if index == 0:
                captured[action] = payload.copy()
            responses = concurrent_posts(client, path + "/" + action, payload)
            assert sorted(response.status_code for response in responses) == [200, 409, 409, 409]
            for response in responses:
                if response.status_code == 409:
                    assert "changed" in response.json()["detail"].lower()
            state = next(response.json() for response in responses if response.status_code == 200)
            assert state["revision"] == before_revision + 1
            assert state["route"] == route
            assert state["ticket_count"] == count
            assert client.get(path).json() == state
            if action == "probe":
                tokens -= int(tool == "bell")
                assert state["debrief"] is None
                assert len(calls) == len(sampled) == index + 1
            elif action == "diagnose":
                credits += state["debrief"]["reward_delta"]
                assert state["credits"] == credits
                assert len(state["history"]) == index + 1
            else:
                assert len(chosen) == min(index + 2, count)
            assert state["bell_tokens"] == tokens
    assert state["phase"] == "complete"
    assert state["revision"] == 3 * count
    assert sampled == [1] * count
    assert len(calls) == len(chosen) == count
    assert [entry["ticket_id"] for entry in state["history"]] == list(ROUTE_IDS[route])
    assert state["correct"] == sum(entry["correct"] for entry in state["history"])
    report = good(client.get(path + "/report"))
    assert report["shift"] == state
    assert len(report["resolved_tickets"]) == count
    for old_action, old_payload in captured.items():
        assert client.post(path + "/" + old_action, old_payload).status_code == 409
        assert client.get(path).json() == state
    assert client.get(path + "/report").json() == report
    assert len(calls) == len(chosen) == count
    assert sampled == [1] * count
