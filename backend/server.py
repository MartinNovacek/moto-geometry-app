from __future__ import annotations

import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from geometry import calculate_geometry


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

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/geometry":
            self.send_json(calculate_geometry({}))
            return
        if parsed.path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("content-type", "application/json; charset=utf-8")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    port = int(os.environ.get("PORT", "5174"))
    server = ThreadingHTTPServer(("0.0.0.0", port), MotoGeoHandler)
    print(f"MotoGeo Python+React server: http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
