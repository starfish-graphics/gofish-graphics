"""Setup script for gofish-python package."""

from setuptools import setup, find_packages

setup(
    name="gofish-python",
    version="0.0.1",
    description="Python wrapper for GoFish graphics library",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    author="GoFish Team",
    license="MIT",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        "pyarrow>=10.0.0",
        "pandas>=1.5.0",
    ],
    extras_require={
        "jupyter": ["ipython>=8.0.0"],
        "all": ["ipython>=8.0.0"],
    },
    include_package_data=True,
    package_data={
        "gofish": ["js/dist/*.js", "js/package.json"],
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
        "Topic :: Scientific/Engineering :: Visualization",
    ],
)


