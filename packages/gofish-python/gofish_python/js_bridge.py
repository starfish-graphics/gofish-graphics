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
    import pythonmonkey as pm
    BRIDGE_TYPE = "pythonmonkey"
except ImportError:
    try:
        from javascript import require, globalThis
        BRIDGE_TYPE = "jspybridge"
    except ImportError:
        raise ImportError(
            "No JavaScript bridge found. Please install one of:\n"
            "  - pythonmonkey: uv pip install pythonmonkey (recommended)\n"
            "  - jsbridge: uv pip install jsbridge (has known build issues)\n"
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
                "Please ensure gofish-graphics is installed or provide path.\n"
                "Build it with: cd packages/gofish-graphics && pnpm build\n"
                "Or set GOFISH_JS_PATH environment variable to the dist directory."
            )
        
        # Load GoFish module (deferred - will load on first access if needed)
        self._gofish_dist = gofish_dist
        try:
            self._load_gofish(gofish_dist)
        except Exception as e:
            # Don't fail initialization - allow lazy loading later
            # This is a workaround for ES module loading issues
            self._gofish_module = None
            self._load_error = str(e)
    
    def _find_gofish_dist(self) -> Optional[Path]:
        """Find the GoFish JavaScript distribution directory."""
        # Get the package directory (parent of gofish_python module)
        # __file__ is: .../packages/gofish-python/gofish_python/js_bridge.py
        # parent.parent is: .../packages/gofish-python
        pkg_dir = Path(__file__).parent.parent
        
        # Check common locations (working up from package directory)
        candidates = [
            # In monorepo: packages/gofish-python -> packages/gofish-graphics/dist
            pkg_dir.parent / "gofish-graphics" / "dist",
            # Alternative: packages/gofish-python -> ../gofish-graphics/dist
            pkg_dir.parent.parent / "packages" / "gofish-graphics" / "dist",
            # If installed as sibling package (packages/gofish-python -> ../gofish-graphics/dist)
            pkg_dir.parent.parent / "gofish-graphics" / "dist",
            # Relative to current file (for testing)
            Path(__file__).parent.parent / "gofish-graphics" / "dist",
        ]
        
        # Debug: print candidates (useful for troubleshooting)
        # print("Searching for GoFish bundle...")
        # for candidate in candidates:
        #     exists = candidate.exists()
        #     has_index = (candidate / "index.js").exists() if exists else False
        #     print(f"  {candidate}: exists={exists}, has_index.js={has_index}")
        
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
                # PythonMonkey: ES modules can't be directly eval'd
                # The bundle uses ES module syntax with external dependencies (solid-js)
                # This requires proper ES module loading which isn't fully supported yet
                
                index_js_path = dist_path / "index.js"
                
                if not index_js_path.exists():
                    raise FileNotFoundError(f"GoFish index.js not found at {index_js_path}")
                
                # For now, we can't load ES modules with external dependencies directly
                # This is a known limitation - the bundle imports from 'solid-js' which isn't available
                # 
                # Options for the future:
                # 1. Build GoFish as a UMD bundle with dependencies bundled
                # 2. Load solid-js separately and then load the GoFish bundle
                # 3. Use a different JavaScript runtime that supports ES modules better
                # 4. Use a bundler to create a CommonJS version
                
                # Set module to None for now - we'll handle it gracefully
                self._gofish_module = None
                self._load_error = (
                    "ES module loading not yet fully supported. The GoFish bundle uses ES module "
                    "syntax with external dependencies (solid-js) which requires proper module loading. "
                    "For now, the Python API structure is available, but JavaScript execution "
                    "requires a build configuration change or runtime that supports ES modules."
                )
                # Don't raise - allow the API to work without JS execution for now
                return
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
            if hasattr(self, '_gofish_dist') and self._gofish_dist:
                # Try to load again (though it will likely still fail)
                self._load_gofish(self._gofish_dist)
                if self._gofish_module is None:
                    # Module loading failed - return None with error info
                    error_msg = getattr(self, '_load_error', "Unknown error")
                    raise RuntimeError(
                        f"GoFish JavaScript module not available: {error_msg}"
                    )
            else:
                self._init_js_runtime()
        return self._gofish_module
    
    def eval(self, code: str) -> Any:
        """Evaluate JavaScript code in the runtime."""
        if BRIDGE_TYPE == "pythonmonkey":
            return pm.eval(code)
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
