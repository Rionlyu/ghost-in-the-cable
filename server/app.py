"""Loopback/local demo API. Run: uv run uvicorn server.app:app --host 127.0.0.1 --port 8000."""

from pathlib import Path

import qiskit
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse

from server.content import FAULTS, TOOLS
from server.evidence import evidence
from server.game import SessionStore
from server.models import (
    CreateShiftRequest,
    DiagnoseRequest,
    NextRequest,
    ProbeRequest,
    Report,
    Shift,
    TrainingProbeRequest,
    TrainingProbeResponse,
)
from server.training import run_training_probe


def create_app(*, store: SessionStore | None = None, dist_dir: Path | None = None) -> FastAPI:
    application = FastAPI(
        title="Ghost in the Cable", docs_url=None, redoc_url=None, openapi_url=None
    )
    sessions = store if store is not None else SessionStore()
    build_root = (
        dist_dir if dist_dir is not None else Path(__file__).resolve().parents[1] / "web" / "dist"
    ).resolve()

    @application.middleware("http")
    async def local_security_headers(request, call_next):
        try:
            response = await call_next(request)
        except Exception:  # noqa: BLE001 - final HTTP secrecy boundary; never emit private state
            response = JSONResponse(
                status_code=500,
                content={"detail": "Internal server error. Reload the shift before retrying."},
            )
        if request.url.path == "/api" or request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self'; style-src 'self'; "
            "img-src 'self' data:; connect-src 'self'; font-src 'self'; "
            "media-src 'self' blob:; object-src 'none'; base-uri 'self'; "
            "frame-ancestors 'none'; form-action 'self'"
        )
        return response

    @application.post("/api/training/probe", response_model=TrainingProbeResponse)
    def probe_training(body: TrainingProbeRequest):
        return run_training_probe(body.tool, body.fault)

    @application.post("/api/shifts", response_model=Shift)
    def create_shift(body: CreateShiftRequest):
        return sessions.create(body.route)

    @application.get("/api/shifts/{shift_id}", response_model=Shift)
    def get_shift(shift_id: str):
        return sessions.get(shift_id)

    @application.post("/api/shifts/{shift_id}/probe", response_model=Shift)
    def probe_shift(shift_id: str, body: ProbeRequest):
        return sessions.probe(shift_id, body.tool, expected_revision=body.expected_revision)

    @application.post("/api/shifts/{shift_id}/diagnose", response_model=Shift)
    def diagnose_shift(shift_id: str, body: DiagnoseRequest):
        return sessions.diagnose(shift_id, body.fault, expected_revision=body.expected_revision)

    @application.post("/api/shifts/{shift_id}/next", response_model=Shift)
    def next_ticket(shift_id: str, body: NextRequest):
        return sessions.advance(shift_id, expected_revision=body.expected_revision)

    @application.get("/api/shifts/{shift_id}/report", response_model=Report)
    def export_report(shift_id: str):
        return sessions.report(shift_id)

    @application.get("/api/health")
    def health():
        return {
            "status": "ok",
            "engine": "qiskit-statevector",
            "qiskit_version": qiskit.__version__,
        }

    @application.get("/api/meta")
    def meta():
        return {"title": "Ghost in the Cable", "faults": FAULTS, "tools": TOOLS}

    @application.get("/api/evidence")
    def get_evidence():
        return evidence()

    @application.get("/{path:path}", include_in_schema=False)
    def frontend(path: str):
        # GET-only SPA fallback never turns an API error into an HTML success.
        if path == "api" or path.startswith("api/") or path in ("docs", "redoc", "openapi.json"):
            raise HTTPException(404, "Not found")
        target = (build_root / path).resolve()
        if not target.is_relative_to(build_root) or any(
            part.startswith(".") for part in Path(path).parts
        ):
            raise HTTPException(404, "Not found")
        if target.is_file():
            return FileResponse(target)
        if Path(path).suffix or path.startswith("assets/"):
            raise HTTPException(404, "Asset not found")
        index = (build_root / "index.html").resolve()
        if not index.is_relative_to(build_root) or not index.is_file():
            raise HTTPException(404, "Frontend build missing; build web/dist first.")
        return FileResponse(index, media_type="text/html", headers={"Cache-Control": "no-cache"})

    return application


app = create_app()
