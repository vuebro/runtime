# VueBro Runtime Project

## Project Overview

VueBro Runtime is a Vue.js-based runtime environment that serves as the execution layer for VueBro applications. It's designed to handle dynamic page loading, routing, SEO optimization, and UI rendering. The project is built with Vue 3 and uses various modern tools and libraries including Vite for bundling, UnoCSS for styling, and Vue Router for navigation.

The project appears to be part of a larger VueBro ecosystem, with dependencies on related packages such as:
- `@vuebro/loader-sfc` for loading Vue single-file components
- `@vuebro/shared` for shared data structures and utilities
- `@vuebro/configs` for configuration presets

## Architecture

The runtime is designed to:
1. Load page data from JSON files (index.json, fonts.json, page-specific JSON-LD files)
2. Dynamically load Vue SFCs for each page
3. Handle routing and navigation between pages
4. Apply SEO optimizations using @unhead/vue
5. Handle icon loading using @iconify/vue
6. Apply UnoCSS runtime styling

The main entry point is `src/main.ts` which initializes the Vue app, sets up routing, and loads UnoCSS runtime. The app component (`src/App.vue`) manages SEO meta tags and dynamically renders routes using vue-router.

## Building and Running

### Development Commands

- `npm run build` - Builds the project using VueTSC for type checking and Vite for bundling
- `npm run lint` - Lints the code using ESLint

### Dependencies

Key dependencies include:
- Vue 3 (v3.5.22)
- Vue Router (v4.6.3)
- UnoCSS runtime (v66.5.4)
- @unhead/vue for SEO management
- @vueuse/core for Vue composition utilities
- @iconify/vue for icon management
- consola for logging

### Output

The build process creates a distributable version in the `dist` folder, with external dependencies (Vue, Vue Router, @vuebro/loader-sfc) copied as static assets with version information in their filenames.

## Development Conventions

### File Structure
```
runtime/
├── index.html          # HTML entry point
├── package.json        # Project configuration and dependencies
├── vite.config.ts      # Vite build configuration
├── uno.config.ts       # UnoCSS configuration
├── tsconfig.json       # TypeScript configuration
├── src/
│   ├── main.ts         # Application entry point
│   ├── App.vue         # Root application component
│   ├── style.css       # Global styles
│   ├── env.d.ts        # TypeScript environment declarations
│   ├── stores/         # Application state management
│   │   └── monolit.ts  # Main router and state store
│   └── views/          # Route components
│       ├── PageView.vue
│       ├── RootView.vue
│       └── NotFoundView.vue
```

### Code Style
- TypeScript is used throughout the project
- Pug templating language is used in Vue components
- UnoCSS utility-first CSS framework with runtime capabilities
- Composition API for Vue components
- Modular architecture with shared libraries from the VueBro ecosystem

### Key Concepts
- **Dynamic Page Loading**: Pages are loaded from external JSON and Vue files
- **SEO Management**: Automatic SEO meta tag generation based on page data
- **Runtime Styling**: UnoCSS is applied at runtime for dynamic styling
- **Intersection Observing**: Used for scroll behavior and page interaction tracking
- **Icon Loading**: Dynamic SVG icon loading with data URLs

## External Dependencies

The build process treats Vue, Vue Router, and @vuebro/loader-sfc as external dependencies, copying them to the dist/assets folder with versioned filenames and updating the Vite manifest to reference them properly.

## Notable Features

- **SPA with Dynamic Imports**: Pages are dynamically loaded based on JSON manifest
- **Automatic SEO**: Meta tags, Open Graph tags, and JSON-LD structured data
- **Smooth Scrolling**: Automatic scroll behavior with intersection observers
- **Icon Management**: Dynamic SVG icon loading and display
- **Responsive Styling**: UnoCSS runtime for dynamic styling
- **Type Safety**: Full TypeScript support with type definitions