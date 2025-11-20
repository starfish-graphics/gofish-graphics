#!/usr/bin/env python3
"""Build JavaScript assets for gofish-python package.

This script builds the required JavaScript bundles before packaging:
1. Builds gofish-graphics (if needed)
2. Installs JS dependencies
3. Builds client bundle (gofish-client.js and gofish-client.iife.js)

Run this before building/installing the Python package:
    python build_assets.py
"""

import subprocess
import sys
from pathlib import Path


def run_command(cmd, cwd, description):
    """Run a command and handle errors."""
    print(f"\n{'='*60}")
    print(f"Building: {description}")
    print(f"Command: {' '.join(cmd)}")
    print(f"Directory: {cwd}")
    print(f"{'='*60}\n")
    
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            check=True,
            capture_output=False,  # Show output in real-time
            text=True,
        )
        print(f"✓ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ {description} failed with exit code {e.returncode}")
        sys.exit(1)
    except FileNotFoundError as e:
        print(f"✗ Command not found: {cmd[0]}")
        print(f"  Please install Node.js and npm: https://nodejs.org/")
        sys.exit(1)


def main():
    """Build all JavaScript assets."""
    # Get paths
    script_dir = Path(__file__).parent.resolve()
    gofish_graphics_dir = script_dir.parent.parent / "gofish-graphics"
    js_dir = script_dir / "gofish" / "js"
    dist_dir = js_dir / "dist"
    
    print("="*60)
    print("GoFish Python - Building JavaScript Assets")
    print("="*60)
    
    # Step 1: Build gofish-graphics (if dist/index.js doesn't exist)
    gofish_dist = gofish_graphics_dir / "dist" / "index.js"
    if not gofish_dist.exists():
        print(f"\nBuilding gofish-graphics (required dependency)...")
        run_command(
            ["npm", "run", "build"],
            cwd=str(gofish_graphics_dir),
            description="gofish-graphics",
        )
    else:
        print(f"\n✓ gofish-graphics already built (found {gofish_dist})")
    
    # Step 2: Install JS dependencies
    run_command(
        ["npm", "install"],
        cwd=str(js_dir),
        description="JavaScript dependencies",
    )
    
    # Step 3: Build client bundle
    run_command(
        ["npm", "run", "build:client"],
        cwd=str(js_dir),
        description="Client bundle (gofish-client.js)",
    )
    
    # Step 4: Verify bundles exist
    esm_bundle = dist_dir / "gofish-client.js"
    iife_bundle = dist_dir / "gofish-client.iife.js"
    
    if not esm_bundle.exists() and not iife_bundle.exists():
        print(f"\n✗ ERROR: No bundles found after build!")
        print(f"  Expected: {esm_bundle} or {iife_bundle}")
        sys.exit(1)
    
    print(f"\n{'='*60}")
    print("✓ All assets built successfully!")
    print(f"{'='*60}")
    if esm_bundle.exists():
        print(f"  ESM bundle: {esm_bundle} ({esm_bundle.stat().st_size:,} bytes)")
    if iife_bundle.exists():
        print(f"  IIFE bundle: {iife_bundle} ({iife_bundle.stat().st_size:,} bytes)")
    print(f"\nYou can now build/install the Python package.")


if __name__ == "__main__":
    main()

