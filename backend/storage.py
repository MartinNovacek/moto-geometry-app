from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict


ROOT = Path(__file__).resolve().parents[1]
LOCAL_STORAGE_PATH = ROOT / "data" / "motogeo-storage.json"
STATE_ID = "default"


def default_storage() -> Dict[str, Any]:
    return {
        "customSetup": None,
        "setupHistory": [],
        "updatedAt": None,
    }


def read_storage() -> Dict[str, Any]:
    if os.environ.get("DATABASE_URL"):
        return read_postgres_storage()
    return read_local_storage()


def write_storage(payload: Dict[str, Any]) -> Dict[str, Any]:
    normalized = normalize_storage(payload)
    if os.environ.get("DATABASE_URL"):
        return write_postgres_storage(normalized)
    return write_local_storage(normalized)


def normalize_storage(payload: Dict[str, Any]) -> Dict[str, Any]:
    storage = default_storage()
    if isinstance(payload, dict):
        storage["customSetup"] = payload.get("customSetup")
        history = payload.get("setupHistory")
        storage["setupHistory"] = history if isinstance(history, list) else []
    return storage


def read_local_storage() -> Dict[str, Any]:
    if not LOCAL_STORAGE_PATH.exists():
        return default_storage()
    try:
        return normalize_storage(json.loads(LOCAL_STORAGE_PATH.read_text(encoding="utf-8")))
    except (OSError, json.JSONDecodeError):
        return default_storage()


def write_local_storage(payload: Dict[str, Any]) -> Dict[str, Any]:
    LOCAL_STORAGE_PATH.parent.mkdir(parents=True, exist_ok=True)
    storage = normalize_storage(payload)
    LOCAL_STORAGE_PATH.write_text(json.dumps(storage, ensure_ascii=False, indent=2), encoding="utf-8")
    return storage


def get_connection():
    import psycopg

    return psycopg.connect(os.environ["DATABASE_URL"])


def ensure_table(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS motogeo_state (
              id text PRIMARY KEY,
              payload jsonb NOT NULL,
              updated_at timestamptz NOT NULL DEFAULT now()
            )
            """
        )


def read_postgres_storage() -> Dict[str, Any]:
    with get_connection() as conn:
        ensure_table(conn)
        with conn.cursor() as cur:
            cur.execute("SELECT payload, updated_at FROM motogeo_state WHERE id = %s", (STATE_ID,))
            row = cur.fetchone()
            if not row:
                return default_storage()
            payload, updated_at = row
            storage = normalize_storage(payload)
            storage["updatedAt"] = updated_at.isoformat()
            return storage


def write_postgres_storage(payload: Dict[str, Any]) -> Dict[str, Any]:
    storage = normalize_storage(payload)
    with get_connection() as conn:
        ensure_table(conn)
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO motogeo_state (id, payload, updated_at)
                VALUES (%s, %s, now())
                ON CONFLICT (id)
                DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()
                RETURNING updated_at
                """,
                (STATE_ID, json.dumps(storage)),
            )
            updated_at = cur.fetchone()[0]
    storage["updatedAt"] = updated_at.isoformat()
    return storage
