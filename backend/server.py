from __future__ import annotations

import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from geometry import calculate_geometry
from storage import read_storage, write_storage


ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "dist" if (ROOT / "dist" / "index.html").exists() else ROOT / "frontend"


class MotoGeoHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND), **kwargs)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/geometry":
            self.send_error(404)
            return

        length = int(self.headers.get("content-length", "0"))
        payload = self.rfile.read(length)
        try:
            data = json.loads(payload.decode("utf-8") or "{}")
            result = calculate_geometry(data)
            self.send_json(result)
        except Exception as exc:
            self.send_json({"error": str(exc)}, status=400)

    def do_PUT(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/storage":
            self.send_error(404)
            return
        if not self.authorized():
            self.send_json({"error": "sync_auth_required"}, status=401)
            return

        length = int(self.headers.get("content-length", "0"))
        payload = self.rfile.read(length)
        try:
            data = json.loads(payload.decode("utf-8") or "{}")
            self.send_json(write_storage(data))
        except Exception as exc:
            self.send_json({"error": str(exc)}, status=400)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/geometry":
            self.send_json(calculate_geometry({}))
            return
        if parsed.path == "/api/storage":
            if not self.authorized():
                self.send_json({"error": "sync_auth_required"}, status=401)
                return
            try:
                self.send_json(read_storage())
            except Exception as exc:
                self.send_json({"error": str(exc)}, status=500)
            return
        if parsed.path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def authorized(self):
        token = os.environ.get("MOTOGEO_SYNC_TOKEN")
        if not token:
            return True
        auth = self.headers.get("authorization", "")
        bearer = f"Bearer {token}"
        return auth == bearer or self.headers.get("x-motogeo-token") == token

    def send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_cors_headers()
        self.send_header("content-type", "application/json; charset=utf-8")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_cors_headers(self):
        self.send_header("access-control-allow-origin", "*")
        self.send_header("access-control-allow-methods", "GET, POST, PUT, OPTIONS")
        self.send_header("access-control-allow-headers", "content-type, authorization, x-motogeo-token")


def main():
    port = int(os.environ.get("PORT", "5174"))
    server = ThreadingHTTPServer(("0.0.0.0", port), MotoGeoHandler)
    print(f"MotoGeo Python+React server: http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
