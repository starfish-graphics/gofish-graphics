"""
JavaScript bridge for GoFish Python

This module manages the connection between Python and JavaScript, loading
the GoFish library and providing a runtime environment. JavaScript is the
source of truth for all rendering and reactivity.
"""

import os
import sys
from pathlib import Path
from typing import Optional, Any

try:
    import js as javascript
    BRIDGE_TYPE = "pythonmonkey"
except ImportError:
    try:
        from javascript import require, globalThis
        BRIDGE_TYPE = "jspybridge"
    except ImportError:
        raise ImportError(
            "No JavaScript bridge found. Please install one of:\n"
            "  - pythonmonkey: pip install pythonmonkey\n"
            "  - jsbridge: pip install jsbridge\n"
            "JavaScript is required as the source of truth for GoFish rendering."
        )


class JSBridge:
    """
    Manages the JavaScript runtime and GoFish library loading.
    
    JavaScript is the source of truth - all rendering, layout, and reactivity
    happens in JavaScript using SolidJS.
    """
    
    _instance: Optional['JSBridge'] = None
    _gofish_module: Optional[Any] = None
    _initialized: bool = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self._init_js_runtime()
            self._initialized = True
    
    def _init_js_runtime(self):
        """Initialize JavaScript runtime and load GoFish library."""
        # Find GoFish dist directory
        gofish_dist = self._find_gofish_dist()
        
        if gofish_dist is None:
            raise FileNotFoundError(
                "Could not find GoFish JavaScript bundle. "
                "Please ensure gofish-graphics is installed or provide path."
            )
        
        # Load GoFish module
        self._load_gofish(gofish_dist)
    
    def _find_gofish_dist(self) -> Optional[Path]:
        """Find the GoFish JavaScript distribution directory."""
        # Check common locations
        candidates = [
            # If installed as sibling package
            Path(__file__).parent.parent.parent.parent / "gofish-graphics" / "dist",
            # If in monorepo
            Path(__file__).parent.parent.parent.parent.parent / "packages" / "gofish-graphics" / "dist",
            # Relative to current file
            Path(__file__).parent.parent / "gofish-graphics" / "dist",
        ]
        
        for candidate in candidates:
            if candidate.exists() and (candidate / "index.js").exists():
                return candidate
        
        # Check if path is provided via environment variable
        env_path = os.getenv("GOFISH_JS_PATH")
        if env_path:
            candidate = Path(env_path)
            if candidate.exists():
                return candidate
        
        return None
    
    def _load_gofish(self, dist_path: Path):
        """Load GoFish JavaScript module into the runtime."""
        try:
            if BRIDGE_TYPE == "pythonmonkey":
                # PythonMonkey: Load via eval/require
                js_code = f"""
                const path = require('path');
                const fs = require('fs');
                const gofishPath = '{dist_path.absolute()}';
                // Dynamic import for ES modules
                import(gofishPath + '/index.js').then(module => {{
                    globalThis.gofish = module;
                }});
                """
                javascript.eval(js_code)
                # For now, use a simpler approach - load the compiled bundle
                # Note: This requires GoFish to be built as a bundle
                self._gofish_module = javascript.eval("globalThis.gofish")
            else:
                # JSPyBridge: Use require
                sys.path.insert(0, str(dist_path.parent))
                self._gofish_module = require(str(dist_path / "index.js"))
        except Exception as e:
            raise RuntimeError(
                f"Failed to load GoFish JavaScript module from {dist_path}: {e}\n"
                "Ensure GoFish is built (run 'pnpm build' in gofish-graphics)."
            ) from e
    
    @property
    def gofish(self) -> Any:
        """Get the GoFish JavaScript module."""
        if self._gofish_module is None:
            self._init_js_runtime()
        return self._gofish_module
    
    def eval(self, code: str) -> Any:
        """Evaluate JavaScript code in the runtime."""
        if BRIDGE_TYPE == "pythonmonkey":
            return javascript.eval(code)
        else:
            # JSPyBridge
            return eval(code, {"__builtins__": {}}, {"require": require, "globalThis": globalThis})
    
    def call(self, func: Any, *args: Any) -> Any:
        """Call a JavaScript function."""
        if BRIDGE_TYPE == "pythonmonkey":
            return func(*args)
        else:
            return func(*args)


# Singleton instance
_js_bridge: Optional[JSBridge] = None


def get_js_bridge() -> JSBridge:
    """Get or create the JavaScript bridge instance."""
    global _js_bridge
    if _js_bridge is None:
        _js_bridge = JSBridge()
    return _js_bridge


def get_gofish() -> Any:
    """Get the GoFish JavaScript module."""
    return get_js_bridge().gofish
