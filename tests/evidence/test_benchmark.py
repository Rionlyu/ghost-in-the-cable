import importlib

import pytest


@pytest.mark.parametrize(
    "tool,fault,expected",
    [
        ("z", "I", {"0": 1.0}),
        ("z", "X", {"1": 1.0}),
        ("z", "Z", {"0": 1.0}),
        ("z", "Y", {"1": 1.0}),
        ("x", "I", {"0": 1.0}),
        ("x", "X", {"0": 1.0}),
        ("x", "Z", {"1": 1.0}),
        ("x", "Y", {"1": 1.0}),
        ("bell", "I", {"00": 1.0}),
        ("bell", "X", {"10": 1.0}),
        ("bell", "Z", {"01": 1.0}),
        ("bell", "Y", {"11": 1.0}),
        ("correlated", "I", {"00": 0.5, "11": 0.5}),
        ("correlated", "X", {"01": 0.5, "10": 0.5}),
        ("correlated", "Z", {"00": 0.5, "11": 0.5}),
        ("correlated", "Y", {"01": 0.5, "10": 0.5}),
    ],
)
def test_independent_circuit_distribution_matches_literal_physics(tool, fault, expected):
    module = importlib.import_module("benchmarks")
    distribution = getattr(module, "distribution", None)
    assert callable(distribution), "The independent circuit distribution is not implemented"
    actual = distribution(tool, fault)
    assert actual == pytest.approx(expected)


def test_seeded_experiment_runs_balanced_fault_trials_and_records_provenance():
    module = importlib.import_module("benchmarks")
    run = getattr(module, "run_experiment", None)
    assert callable(run), "The reproducible experiment runner is not implemented"
    report = run(shots=64, seed=7, noise_levels=[0.0])
    assert report["hardware_used"] is False
    assert report["seed"] == 7
    assert report["shots_per_fault"] == 64
    assert report["qiskit_version"]
    assert len(report["results"]) == 4
    for row in report["results"]:
        expected = 1.0 if row["tool"] == "bell" else 0.5
        assert row["accuracy"] == expected
        assert row["expected_accuracy"] == pytest.approx(expected)
        assert row["total"] == 256
        assert all(sum(counts.values()) == 64 for counts in row["counts_by_fault"].values())
    repeated = run(shots=64, seed=7, noise_levels=[0.0])
    assert repeated["results"] == report["results"]


def test_full_depolarization_erases_bell_information_and_partial_noise_is_sampled():
    module = importlib.import_module("benchmarks")
    report = module.run_experiment(shots=512, seed=123, noise_levels=[0.0, 0.5, 1.0])
    bells = [row for row in report["results"] if row["tool"] == "bell"]
    assert [row["expected_accuracy"] for row in bells] == pytest.approx([1.0, 0.625, 0.25])
    assert 0.58 < bells[1]["accuracy"] < 0.67
    assert 0.20 < bells[2]["accuracy"] < 0.30
    assert "depolarizing" in report["conditions"]["noise_model"]


@pytest.mark.parametrize(
    "kwargs",
    [
        {"shots": 0, "seed": 1, "noise_levels": [0]},
        {"shots": True, "seed": 1, "noise_levels": [0]},
        {"shots": 10, "seed": -1, "noise_levels": [0]},
        {"shots": 10, "seed": 1, "noise_levels": [1.5]},
        {"shots": 10, "seed": 1, "noise_levels": [float("nan")]},
        {"shots": 10, "seed": 1, "noise_levels": []},
    ],
)
def test_experiment_rejects_invalid_budgets_and_noise(kwargs):
    with pytest.raises(ValueError):
        importlib.import_module("benchmarks").run_experiment(**kwargs)


@pytest.mark.parametrize("tool,fault", [("magic", "I"), ("bell", "bad")])
def test_reference_rejects_unknown_tools_and_faults(tool, fault):
    with pytest.raises(ValueError):
        importlib.import_module("benchmarks").distribution(tool, fault)


def test_cli_writes_actual_json_and_labeled_svg(tmp_path):
    import json
    import subprocess
    import sys

    output = tmp_path / "measured.json"
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "benchmarks",
            "--shots",
            "32",
            "--seed",
            "20261024",
            "--output",
            str(output),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    report = json.loads(output.read_text())
    assert len(report["results"]) == 24
    assert report["shots_per_fault"] == 32
    assert all(row["total"] == 128 for row in report["results"])
    svg = output.with_suffix(".svg").read_text()
    assert "<svg" in svg
    assert "Classical simulation" in svg
    assert "depolarizing" in svg
