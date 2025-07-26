# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GoFish Graphics is a TypeScript/SolidJS library for creating charts and visualizations. It uses a declarative API based on an Abstract Syntax Tree (AST) approach where visual elements are composed through functional transformations.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server (runs on port 3000)
pnpm dev

# Build the library
pnpm build

# Preview the build
pnpm serve
```

## Architecture

### Core Concepts

The library is built around several key architectural patterns:

1. **AST-based Rendering**: Visual elements are represented as nodes in an abstract syntax tree (`src/ast/_node.ts`)
2. **Functional Composition**: Charts are built by composing shapes, transforms, and operators
3. **Three-Pass Rendering**: 
   - Domain inference (what data ranges exist)
   - Layout calculation (how to fit elements)
   - Placement/rendering (final positioning and SVG generation)

### Key Directories

- `src/ast/` - Core AST implementation and rendering engine
- `src/ast/shapes/` - Basic visual elements (rect, ellipse, petal, ref)
- `src/ast/graphicalOperators/` - Composition operators (stack, layer, connect, wrap, etc.)
- `src/ast/coordinateTransforms/` - Coordinate system transformations (polar, linear, bipolar, etc.)
- `src/ast/marks/` - Higher-level chart APIs
- `src/tests/` - Example charts and test cases (not unit tests, but visual examples)
- `src/data/` - Sample datasets used in examples
- `src/templates/` - Reusable chart templates

### Main Entry Points

- `src/lib.ts` - Main library exports (includes v1, v2, and v3 APIs)
- `src/ast/gofish.tsx` - Core rendering engine and context management
- `src/App.tsx` - Development playground showing various chart examples

### API Versions

The library exports three API versions:
- **v1**: Original lowercase functions (`rect`, `stack`, `polar`, etc.)
- **v2**: Capitalized versions (`Rect`, `Stack`, `Polar`, etc.) 
- **v3**: Chart-based API (`Chart`, `_Chart`)

### Context System

The library uses several global contexts during rendering:
- `scopeContext` - Manages variable scoping
- `scaleContext` - Handles color scales and axis scales
- `keyContext` - Tracks named elements for axis labels

### Coordinate Transforms

Key coordinate systems available:
- `linear` - Standard Cartesian coordinates
- `polar` - Polar coordinate system
- `bipolar` - Two-pole coordinate system
- `arcLengthPolar` - Arc-length based polar coordinates
- `wavy` - Wavy/curved coordinate transformations

### Build Configuration

- Uses Vite for bundling with SolidJS plugin
- TypeScript with strict mode enabled
- Builds ES modules only (no CommonJS)
- Entry point: `src/lib.ts`
- External dependency: `solid-js` (peer dependency)
- Build output: `dist/` directory

## Development Notes

- The `src/tests/` directory contains visual examples, not automated tests
- Development server shows a playground of various chart types
- The library uses pnpm for package management
- SolidJS is used for reactive rendering and JSX
- D3-array is used for domain calculations and scales
- Lodash provides utility functions (groupBy, sumBy, orderBy)