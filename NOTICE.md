# Credits and reuse

Ghost in the Cable was developed by Beniamin Kmieć for Qiskit Fall Fest Warsaw 2026. The project code, fictional customers, original SVG/CSS forest and workshop, interface and procedural sound were created with AI assistance through Hermes Agent, including parallel coding and research agents. No third-party game artwork, recordings, fonts or music are bundled.

## Scientific foundations

Pauli channel discrimination, Bell-state measurement and superdense coding are established ideas. This project claims an original educational repair-shop presentation, not a new quantum algorithm or proof. See [the scientific model](docs/SCIENCE.md) and [prior-art notes](docs/PRIOR-ART.md) for primary references and related educational work.

## Dependencies

Dependencies are installed from the committed lockfiles, not vendored into this repository. Their licenses remain applicable to their respective packages, independently of the MIT license on this project's original work.

Principal runtime dependencies, checked from installed package metadata:

- Qiskit: Apache-2.0.
- FastAPI: MIT.
- Uvicorn: BSD-3-Clause.
- NumPy: its installed distribution records BSD-3-Clause, 0BSD, MIT, Zlib and CC0-1.0 components; consult its bundled notices for details.

The frontend uses TypeScript and Vite, with Playwright for browser testing. Use the upstream notices included with each installed package for the full transitive dependency/license inventory.

Reference games were studied for interaction principles only. Their source, levels and assets were not copied. IBM and Qiskit names identify the underlying technology, not sponsorship or endorsement of this entry.

## Honest disclosure

This repository contains local circuit simulation, not physical QPU results. Recorded benchmark artifacts, exact probabilities and synthetic noise are labeled separately. Automated checks are not human playtests. No video, event acceptance, learning efficacy or public hosted game is implied by publication of the source.
