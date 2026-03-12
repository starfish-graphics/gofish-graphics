"""
Python derive server — executes Python derive functions during test rendering.

Endpoints:
  POST /register       — Load a story module and register its derive functions
  POST /derive/<id>    — Execute a registered derive function on JSON data
  POST /reset          — Clear all registered functions
  GET  /health         — Health check

The capture-python-dom.ts script starts this server, registers story modules,
then the test harness calls /derive/<id> during chart rendering.
"""

import importlib
import json
import sys
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

# Add project root to path so we can import gofish
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "packages/gofish-python"))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "tests"))

# Registry: lambdaId → Python function
_registry: dict = {}


class DeriveHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self._json_response(200, {"status": "ok", "registered": len(_registry)})
        else:
            self._json_response(404, {"error": "not found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else b""

        if parsed.path == "/register":
            self._handle_register(body)
        elif parsed.path.startswith("/derive/"):
            lambda_id = parsed.path[len("/derive/"):]
            self._handle_derive(lambda_id, body)
        elif parsed.path == "/reset":
            _registry.clear()
            self._json_response(200, {"status": "cleared"})
        else:
            self._json_response(404, {"error": "not found"})

    def _handle_register(self, body: bytes):
        """Register derive functions from a story module."""
        try:
            data = json.loads(body)
            functions = data.get("functions", {})
            # functions is a dict of lambdaId → module:function_path info
            # But actually, the capture script will register functions directly
            # by calling the Python story and extracting DeriveOperator instances.
            # So this endpoint receives pre-extracted lambda_id → fn mappings.
            #
            # For now, the capture script handles registration by importing
            # story modules and calling register_story_derives().
            _registry.update(functions)
            self._json_response(200, {
                "status": "registered",
                "count": len(functions),
                "total": len(_registry),
            })
        except Exception as e:
            self._json_response(500, {"error": str(e)})

    def _handle_derive(self, lambda_id: str, body: bytes):
        """Execute a registered derive function on JSON data."""
        if lambda_id not in _registry:
            self._json_response(404, {
                "error": f"Unknown lambda_id: {lambda_id}",
                "registered": list(_registry.keys()),
            })
            return

        try:
            data = json.loads(body)
            fn = _registry[lambda_id]
            result = fn(data)

            # Ensure result is JSON-serializable
            if hasattr(result, "to_dicts"):
                # Polars DataFrame
                result = result.to_dicts()
            elif hasattr(result, "to_dict"):
                # Pandas DataFrame
                result = result.to_dict("records")

            self._json_response(200, result)
        except Exception as e:
            self._json_response(500, {"error": str(e), "lambda_id": lambda_id})

    def _json_response(self, status: int, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        """Suppress default logging unless DEBUG is set."""
        if os.environ.get("DEBUG"):
            super().log_message(format, *args)


def register_story_derives(story_module_name: str):
    """
    Import a story module and register all DeriveOperator functions.

    Story modules define story_*() functions that return (ChartBuilder, options).
    We extract DeriveOperator instances from the builder's operators list.
    """
    from gofish.ast import DeriveOperator

    mod = importlib.import_module(story_module_name)

    for attr_name in dir(mod):
        if not attr_name.startswith("story_"):
            continue
        story_fn = getattr(mod, attr_name)
        if not callable(story_fn):
            continue

        result = story_fn()
        if not isinstance(result, tuple) or len(result) < 1:
            continue

        builder = result[0]
        if not hasattr(builder, "operators"):
            continue

        for op in builder.operators:
            if isinstance(op, DeriveOperator):
                _registry[op.lambda_id] = op.fn


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3002
    server = HTTPServer(("localhost", port), DeriveHandler)
    print(f"Derive server listening on http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()


if __name__ == "__main__":
    main()
