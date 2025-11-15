"""
Setup configuration for GoFish Python.
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read README
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text() if readme_file.exists() else ""

setup(
    name="gofish-graphics",
    version="0.1.0",
    description="Python wrapper for GoFish Graphics - JavaScript is the source of truth for rendering",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="GoFish Team",
    license="MIT",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        # Note: Users need to install ONE of:
        # - pythonmonkey (pip install pythonmonkey)
        # - jsbridge (pip install jsbridge)
        # We list both as optional dependencies
    ],
    extras_require={
        "pythonmonkey": ["pythonmonkey"],
        "jspybridge": ["jsbridge"],
        "dev": [
            "pytest",
            "pytest-cov",
            "black",
            "mypy",
        ],
        "jupyter": [
            "ipython",
            "jupyter",
        ],
        "data": [
            "numpy",
            "pandas",
        ],
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Scientific/Engineering :: Visualization",
    ],
    keywords="visualization charts graphics gofish",
)
