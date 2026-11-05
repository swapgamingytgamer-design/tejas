"""TEJAS backend.

Purpose:
  1. Stores contact-form messages in local SQLite storage.
  2. Serves the static frontend so the whole site runs on http://localhost:8000.

The frontend never depends on this backend: it is a static site deployable to
Cloudflare Pages as-is. This API is optional local infrastructure.

Run:
  pip install -r backend/requirements.txt
  uvicorn backend.main:app --port 8000
"""

from __future__ import annotations

import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, field_validator

BASE_DIR = Path(__file__).resolve().parent.parent  # project root
DATA_DIR = Path(__file__).resolve().parent / "data"
DB_PATH = DATA_DIR / "tejas.db"

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class ContactMessage(BaseModel):
    """A message sent through the site's contact form."""

    name: Annotated[str, Field(min_length=1, max_length=120)]
    email: Annotated[str, Field(max_length=200)]
    message: Annotated[str, Field(min_length=1, max_length=5000)]
    company: str = ""  # honeypot: real users never fill this

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if not EMAIL_RE.match(value):
            raise ValueError("A valid email address is required.")
        return value


def init_db() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                message TEXT NOT NULL,
                received_at TEXT NOT NULL
            )
            """
        )


app = FastAPI(
    title="TEJAS API",
    description="Backend services for the TEJAS ecosystem (contact intake only, for now).",
    version="0.1.0",
)

# The API is local today, but allow same-origin deployments anywhere.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    """Simple readiness probe."""
    return {"status": "ok", "service": "tejas", "version": app.version}


@app.post("/api/contact", status_code=201)
def receive_contact(msg: ContactMessage) -> dict:
    """Persist a contact message. Bot-filled honeypots are accepted silently."""
    # Honeypot filled => almost certainly a bot. Accept and discard (201, no stall).
    if msg.company:
        return {"received": True}

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO messages (name, email, message, received_at) VALUES (?, ?, ?, ?)",
            (
                msg.name.strip(),
                msg.email.strip(),
                msg.message.strip(),
                datetime.now(timezone.utc).isoformat(timespec="seconds"),
            ),
        )
    return {"received": True}


# ----- Static frontend -----
@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    return FileResponse(BASE_DIR / "index.html")


from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import JSONResponse


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc: StarletteHTTPException):
    """Serve the custom 404 page locally; Cloudflare Pages does this via 404.html."""
    if request.url.path.startswith("/api/"):
        return JSONResponse({"detail": exc.detail if isinstance(exc.detail, str) else "Request failed."},
                            status_code=exc.status_code)
    if exc.status_code == 404:
        return FileResponse(BASE_DIR / "404.html", status_code=404)
    return JSONResponse({"detail": str(exc.detail)}, status_code=exc.status_code)


# Everything else (css, js, assets, 404.html, robots.txt, sitemap.xml, _headers)
app.mount("/", StaticFiles(directory=BASE_DIR, html=True), name="site")


init_db()
