"""Run: uv run python -m benchmarks --output evidence/benchmark.json"""

import argparse
import json
from pathlib import Path

from benchmarks import run_experiment


def chart(report: dict) -> str:
    """Plot actual sampled results; curves are only guides between measured levels."""
    colors = {"bell": "#bfe3a4", "z": "#f5bb70", "x": "#c8b8e8", "correlated": "#9dcad8"}
    names = {
        "bell": "Bell reference (2 qubits)",
        "z": "Z probe (1 qubit)",
        "x": "X probe (1 qubit)",
        "correlated": "Classically correlated (2 qubits)",
    }
    body = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="620" viewBox="0 0 960 620" role="img" aria-labelledby="title desc">',
        '<title id="title">Ghost in the Cable: sampled fault identification under synthetic noise</title>',
        '<desc id="desc">Classical Qiskit simulation of one-use Pauli fault identification. Bell reference improves ideal identification, then degrades under synthetic depolarizing noise. This is not hardware data.</desc>',
        '<rect width="960" height="620" fill="#151b18"/>',
        '<g font-family="system-ui,sans-serif" fill="#eee6cf">',
        '<text x="70" y="48" font-size="26">How reliable is the reference?</text>',
        '<text x="70" y="78" font-size="14" fill="#b7c2ad">Classical simulation · synthetic local depolarizing noise · one device use</text>',
    ]
    for value in [0, 0.25, 0.5, 0.75, 1]:
        y = 450 - 320 * value
        body += [
            f'<path d="M80 {y}H890" stroke="#39463b"/>',
            f'<text x="65" y="{y + 5}" text-anchor="end" font-size="13">{int(value * 100)}%</text>',
        ]
    for value in [0, 0.25, 0.5, 0.75, 1]:
        x = 80 + 810 * value
        body.append(f'<text x="{x}" y="478" text-anchor="middle" font-size="13">{value:g}</text>')
    body.append(
        '<text x="485" y="507" text-anchor="middle" font-size="14">Depolarizing parameter p — E(ρ)=(1−p)ρ+pI/2 on the probe</text>'
    )
    for index, tool in enumerate(colors):
        rows = [row for row in report["results"] if row["tool"] == tool]
        points = " ".join(
            f"{80 + 810 * row['noise']},{450 - 320 * row['accuracy']}" for row in rows
        )
        body.append(
            f'<polyline points="{points}" fill="none" stroke="{colors[tool]}" stroke-width="2"/>'
        )
        for row in rows:
            body.append(
                f'<circle cx="{80 + 810 * row["noise"]}" cy="{450 - 320 * row["accuracy"]}" r="4" fill="{colors[tool]}"/>'
            )
        x = 80 + (index % 2) * 410
        y = 545 + (index // 2) * 26
        body.append(
            f'<rect x="{x}" y="{y - 10}" width="18" height="4" fill="{colors[tool]}"/><text x="{x + 28}" y="{y}" font-size="13">{names[tool]}</text>'
        )
    body.append(
        f'<text x="80" y="605" font-size="12" fill="#b7c2ad">{report["shots_per_fault"]:,} shots per fault per point · seed {report["seed"]} · Qiskit {report["qiskit_version"]} · no QPU used</text>'
    )
    body.append("</g></svg>")
    return "\n".join(body)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--shots", type=int, default=4096, help="Shots per fault, tool and noise level"
    )
    parser.add_argument("--seed", type=int, default=20261024)
    parser.add_argument("--output", type=Path, default=Path("evidence/benchmark.json"))
    args = parser.parse_args()
    try:
        report = run_experiment(
            shots=args.shots, seed=args.seed, noise_levels=[0, 0.05, 0.1, 0.25, 0.5, 1.0]
        )
    except ValueError as error:
        parser.error(str(error))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n")
    args.output.with_suffix(".svg").write_text(chart(report))
    print(f"Wrote {args.output} and {args.output.with_suffix('.svg')}")
    for row in report["results"]:
        if row["noise"] == 0:
            print(
                f"{row['tool']:12} ideal: {row['correct']}/{row['total']} = {row['accuracy']:.2%}"
            )
    print("Evidence is simulated, not hardware data. No quantum-computational speedup claimed.")


if __name__ == "__main__":
    main()
