# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Documentation Site
- **Development server**: `pnpm docs:dev` - Starts VitePress dev server with hot reload
- **Build documentation**: `pnpm docs:build` - Builds static documentation site
- **Preview build**: `pnpm docs:preview` - Serves built documentation for testing

### Dependencies
- **Install**: `pnpm install` - Installs all dependencies

## Project Architecture

This is a documentation site for the GoFish Graphics library built with VitePress. The project combines interactive documentation with live code examples.

### Core Components

#### Documentation System
- **VitePress**: Static site generator with Vue 3 support
- **Custom markdown plugins**: 
  - `starfish` containers for embedding live code examples
  - `starfish-live` containers for Sandpack-powered interactive editors
- **Example system**: Centralized example code management via `docs/.vitepress/data/examples.data.js`

#### Interactive Code Execution
- **GoFishVue.vue** (`components/GoFishVue.vue:1`): Vue component that executes GoFish code in a sandboxed environment using `new Function()`. Provides access to lodash, datasets, and the full GoFish API.
- **StarfishLive.tsx** (`components/StarfishLive.tsx:1`): Sandpack-based live code editor component for interactive examples
- **Markdown integration**: Custom markdown-it plugin (`docs/.vitepress/markdown-it-starfish.ts:22`) processes `::: starfish` containers

#### Data Management
- **Dataset modules**: Located in `components/data/` - TypeScript modules exporting chart datasets (titanic, penguins, streamgraph data, etc.)
- **Examples registry**: `docs/.vitepress/data/examples.data.js:1` contains all chart examples with reusable code snippets

### Key Architecture Patterns

#### Live Code Rendering
The documentation uses two approaches for interactive examples:
1. **Server-side execution**: `GoFishVue` component executes code during page load
2. **Client-side sandbox**: `StarfishLive` provides editable code playgrounds via Sandpack

#### Example Code Reuse
Examples are defined once in `examples.data.js` and can be imported into documentation pages using:
```markdown
::: starfish example:bar-chart
:::
```

#### Coordinate System Integration
The GoFish library supports multiple coordinate systems (cartesian, polar, wavy) through the `coord` parameter in Frame components.

## File Structure

### Documentation (`docs/`)
- `examples/` - Individual example pages with live demos
- `guides/` - Tutorial and guide content
- `api/` - API reference documentation
- `.vitepress/config.mts` - VitePress configuration
- `.vitepress/theme/` - Custom theme components

### Components (`components/`)
- Vue components for rendering live examples
- `data/` - Chart datasets used in examples
- Gallery components for homepage

### Dependencies
- **Core**: `gofish-graphics` - The graphics library being documented
- **Documentation**: `vitepress`, `vitepress-plugin-sandpack`
- **Interactive features**: `sandpack-vue3`, `monaco-editor`
- **Data processing**: `lodash`, `fast-kde`, `spectral.js`