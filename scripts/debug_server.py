#!/usr/bin/env python3
"""
Debug Log Server

Receives logs via HTTP POST and writes them to {project}/.claude/debug.log

Usage:
    python3 debug_server.py /path/to/project
    python3 debug_server.py  # Uses current directory
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
import sys
from datetime import datetime

LOG_DIR = sys.argv[1] if len(sys.argv) > 1 else "."
LOG_FILE = os.path.join(LOG_DIR, ".claude", "debug.log")
PORT = int(os.environ.get("DEBUG_PORT", "8787"))

os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)


class DebugHandler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # Suppress default logging

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ok", "log_file": LOG_FILE}).encode())

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}

            entry = {
                "ts": datetime.now().isoformat(),
                **data
            }

            with open(LOG_FILE, "a") as f:
                f.write(json.dumps(entry) + "\n")

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(b'{"ok":true}')

            msg = entry.get("msg", json.dumps(entry)[:80])
            print(f"[LOG] {msg}")

        except Exception as e:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())


def main():
    print(f"Debug Log Server")
    print(f"  Endpoint: http://localhost:{PORT}/log")
    print(f"  Log file: {LOG_FILE}")
    print(f"  Press Ctrl+C to stop\n")

    server = HTTPServer(("", PORT), DebugHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")


if __name__ == "__main__":
    main()
