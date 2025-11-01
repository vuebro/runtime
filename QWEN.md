# VueBro Runtime

## Project Overview

VueBro Runtime is a Vue.js-based runtime environment that serves as the execution layer for VueBro applications. This project provides the core infrastructure to render and manage Vue applications with advanced features like dynamic component loading, SEO optimization, and intersection observer tracking.

The project is part of the larger VueBro ecosystem (https://github.com/vuebro) and is versioned as `@vuebro/runtime v1.1.83`. It's designed to work with Vue 3, Vue Router, UnoCSS, and other modern web development tools.

## Key Dependencies

- Vue 3 (v3.5.22+)
- Vue Router (v4.6.3+)
- UnoCSS runtime for styling
- VueUse for composable utilities
- Iconify for icon management
- @vuebro/shared and @vuebro/loader-sfc for ecosystem integration

## Architecture

The runtime follows a monolithic architecture with several key components:

1. **Main Application**: The `main.ts` entry point initializes the Vue app, router, and UnoCSS runtime
2. **State Management**: Uses reactive stores in the `stores/monolit.ts` file to manage application state
3. **Dynamic Loading**: Components are dynamically loaded using the `@vuebro/loader-sfc` package
4. **SEO Support**: Built-in SEO meta management using `@unhead/vue`
5. **Intersection Tracking**: Uses Intersection Observer API to track component visibility

## Building and Running

### Prerequisites
- Node.js (latest version)
- pnpm (or npm/yarn)

### Commands
- `npm run build` - Builds the project using Vite and TypeScript
- `npm run lint` - Lints the codebase using ESLint

### Build Configuration
The project uses Vite for bundling with a custom configuration in `vite.config.ts`:
- Externalizes Vue, Vue Router, and loader dependencies
- Creates manual chunks for shared libraries and UnoCSS
- Uses `vite-plugin-static-copy` to copy external dependencies to the dist folder
- Generates a manifest file that includes external dependencies

## Development Conventions

- Uses TypeScript for type safety
- Pug template syntax
- UnoCSS for utility-first CSS
- Component-based architecture
- Dynamic imports for code splitting
- Auto-generated manifest for asset tracking

## Key Files

- `src/main.ts` - Application entry point
- `src/App.vue` - Root application component
- `src/stores/monolit.ts` - Centralized state management
- `src/views/` - Page components
- `vite.config.ts` - Build configuration
- `uno.config.ts` - UnoCSS configuration
- `tsconfig.json` - TypeScript configuration

## Special Features

1. **Dynamic Component Loading**: Components are loaded dynamically based on JSON configuration files
2. **Scroll Behavior**: Intelligent scroll management that updates routes based on visibility
3. **SEO Optimization**: Automatic meta tag generation for SEO
4. **Icon Support**: Built-in Iconify integration for SVG icons
5. **Font Loading**: Dynamic web font loading capabilities
6. **Intersection Tracking**: Component visibility tracking using Intersection Observer

## File Structure

```
src/
├── stores/          # State management stores
├── views/           # Page view components
├── App.vue          # Root application component
├── env.d.ts         # TypeScript environment declarations
├── main.ts          # Application entry point
└── style.css        # Global styles
```

## Integration

This runtime is designed to work with the broader VueBro ecosystem:
- Receives data from `index.json` and `fonts.json` files
- Uses `@vuebro/shared` for common utilities
- Dynamic components loaded from `./pages/` directory
- Uses `@vuebro/configs` for shared Vite, TypeScript, and UnoCSS configurations