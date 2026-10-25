"""Independent regressions: captured requests must not mutate a later ticket."""

import asyncio

import httpx
import pytest


class Client:
    def __init__(self):
        from server.app import create_app

        self.app = create_app()

    def request(self, method, path, **kwargs):
        async def send():
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=self.app), base_url="http://testserver"
            ) as client:
                return await client.request(method, path, **kwargs)

        return asyncio.run(send())

    def get(self, path):
        return self.request("GET", path)

    def post(self, path, body):
        return self.request("POST", path, json=body)


def intended(state, **fields):
    # The old contract lacks revisions, enabling a red reproduction before the fix.
    # Each replay test captures this dictionary ONCE and reuses it unchanged.
    return {**fields, **({"expected_revision": state["revision"]} if "revision" in state else {})}


def good(response):
    assert response.status_code == 200, response.text
    return response.json()


def test_captured_probe_cannot_spend_a_later_tickets_query():
    client = Client()
    initial = good(client.post("/api/shifts", {}))
    path = f"/api/shifts/{initial['id']}"
    captured_probe = intended(initial, tool="bell")
    measured = good(client.post(path + "/probe", captured_probe))
    fault = {"00": "I", "10": "X", "01": "Z", "11": "Y"}[measured["reading"]["bits"]]
    resolved = good(client.post(path + "/diagnose", intended(measured, fault=fault)))
    following = good(client.post(path + "/next", intended(resolved)))
    replay = client.post(path + "/probe", captured_probe)
    assert replay.status_code == 409, (
        "A captured previous-ticket probe was accepted on the next ticket"
    )
    assert client.get(path).json() == following
    assert following["reading"] is None
    assert following["bell_tokens"] == 2
    assert (
        good(client.post(path + "/probe", intended(following, tool="x")))["reading"]["tool"] == "x"
    )


def test_captured_diagnosis_cannot_resolve_a_later_unseen_reading(monkeypatch):
    from server import game

    faults = iter(["I", "Z"])
    monkeypatch.setattr(game.secrets, "choice", lambda choices: next(faults))
    client = Client()
    initial = good(client.post("/api/shifts", {}))
    path = f"/api/shifts/{initial['id']}"
    measured = good(client.post(path + "/probe", intended(initial, tool="z")))
    captured_diagnosis = intended(measured, fault="I")
    resolved = good(client.post(path + "/diagnose", captured_diagnosis))
    following = good(client.post(path + "/next", intended(resolved)))
    new_reading = good(client.post(path + "/probe", intended(following, tool="x")))
    assert new_reading["reading"]["bits"] == "1"
    replay = client.post(path + "/diagnose", captured_diagnosis)
    assert replay.status_code == 409, (
        "Old diagnosis resolved a different ticket and changed its score"
    )
    assert client.get(path).json() == new_reading
    final = good(client.post(path + "/diagnose", intended(new_reading, fault="Z")))
    assert final["correct"] == 2


def test_captured_advance_cannot_skip_a_later_resolved_ticket(monkeypatch):
    from server import game

    monkeypatch.setattr(game.secrets, "choice", lambda choices: "I")
    client = Client()
    state = good(client.post("/api/shifts", {}))
    path = f"/api/shifts/{state['id']}"
    state = good(client.post(path + "/probe", intended(state, tool="z")))
    state = good(client.post(path + "/diagnose", intended(state, fault="I")))
    captured_advance = intended(state)
    state = good(client.post(path + "/next", captured_advance))
    state = good(client.post(path + "/probe", intended(state, tool="x")))
    state = good(client.post(path + "/diagnose", intended(state, fault="I")))
    replay = client.post(path + "/next", captured_advance)
    assert replay.status_code == 409, "Old next request advanced an unrelated later ticket"
    assert client.get(path).json() == state
    assert state["ticket_index"] == 1


@pytest.mark.parametrize(
    "suffix,body", [("/probe", {"tool": "z"}), ("/diagnose", {"fault": "I"}), ("/next", {})]
)
def test_missing_revision_cannot_use_legacy_mutation_contract(suffix, body):
    client = Client()
    state = good(client.post("/api/shifts", {}))
    path = f"/api/shifts/{state['id']}"
    response = client.post(path + suffix, body)
    assert response.status_code == 422
    assert client.get(path).json() == state


def test_revision_is_monotonic_and_failure_and_get_do_not_advance_it():
    client = Client()
    state = good(client.post("/api/shifts", {}))
    assert state.get("revision") == 0
    path = f"/api/shifts/{state['id']}"
    measured = good(client.post(path + "/probe", intended(state, tool="z")))
    assert measured["revision"] == 1
    assert client.get(path).json() == measured
    assert client.post(path + "/diagnose", intended(measured, fault="Z")).status_code == 422
    assert client.post(path + "/next", intended(measured)).status_code == 409
    assert client.get(path).json() == measured


@pytest.mark.parametrize("revision", [None, True, False, -1, 0.5, "0", [], {}])
def test_revision_is_a_required_strict_nonnegative_integer(revision):
    client = Client()
    state = good(client.post("/api/shifts", {}))
    path = f"/api/shifts/{state['id']}"
    response = client.post(path + "/probe", {"tool": "z", "expected_revision": revision})
    assert response.status_code == 422
    assert client.get(path).json() == state
