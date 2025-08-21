# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Quatt Support Dashboard - a React TypeScript application for internal support operations. The app provides interfaces for managing CICs (Quatt's IoT devices), installations, installers, and commissioning data. It's hosted on Cloudflare Pages and uses Firebase authentication.

## Key Commands

### Development
- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production
- `npm run build:staging` - Build for staging environment
- `npm run build:development` - Build for development environment
- `npm run preview` - Preview production build locally

### Code Quality & Testing
- `npm run lint` - Run ESLint on TypeScript files
- `npm run prettier:format` - Format code with Prettier
- `npm run prettier:check` - Check code formatting
- `npm run check-types` - Run TypeScript type checking without emitting files
- `npm run tsc:watch` - Watch mode for TypeScript compilation

### API Client Management
- `npm run api:generate-client` - Generate API client from OpenAPI spec (requires Quatt-cloud repo path)
- `npm run api:clean-models` - Remove unused API models based on .openapi-generator-ignore
- `npm run api:generate-and-clean` - Run both API generation and cleanup in sequence

Example: `./generate-api-client.sh ../Quatt-cloud`

### Utility Scripts
- `npm run export-files` - Export codebase to flat file structure
- `npm run show-file-sizes` - Show file sizes in the project
- `npm run review-diff` - Review code differences

## Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Authentication**: Firebase Auth with Google sign-in
- **Styling**: CSS modules for component styling
- **API Client**: Auto-generated TypeScript client from OpenAPI spec
- **Charts**: Chart.js with react-chartjs-2
- **Forms**: React Hook Form with Yup validation

### Application Structure

#### Main Pages & Features
- **Dashboard** (`/dashboard`) - CIC health metrics and aggregated data
- **CIC Management** (`/cics`, `/cics/:cicId`) - List and detailed view of CICs with commissioning data
- **Installation Management** (`/installations`, `/installations/:uuid`) - Installation tracking and details
- **Installer Management** (`/installers`) - Installer account management
- **Debug Interface** (`/cics/:cicId/debug`) - Hidden MQTT command interface for CICs

#### Core Architecture Patterns
- **API Client Pattern**: Centralized API client with Firebase token injection via context
- **Query-Based Data Fetching**: TanStack React Query for all server state with error boundaries
- **Component Composition**: Reusable UI components in `ui-components/` directory
- **CSS Modules**: Scoped component styling with `.module.css` files
- **Route-Based Code Splitting**: Individual page components with dedicated data fetching

#### Key Directories
- `src/api-client/` - Auto-generated OpenAPI client and models (managed by scripts)
- `src/ui-components/` - Reusable UI component library
- `src/cic-*/` - CIC-related page components and logic
- `src/installation-*/` - Installation management components
- `src/utils/` - Shared utilities and custom hooks

### API Client Management

The API client is auto-generated from the main Quatt-cloud OpenAPI specification. Due to security concerns (public repository), only necessary models are included via the `.openapi-generator-ignore` file. When adding new API endpoints:

1. Update the ignore file to include required models
2. Run `npm run api:generate-and-clean` 
3. Verify all imports resolve correctly in generated files

### Authentication & Security

- Firebase Authentication with Google OAuth
- JWT tokens automatically included in API requests
- Route-level authentication checks in App.tsx
- Public repository requires careful API model management

### Environment Configuration

- Development: Uses local environment variables for API base path
- Staging/Production: Configured for Cloudflare Pages deployment
- Local API testing: Create `.env.development.local` with `VITE_API_BASE_PATH="http://localhost:3500/api/v1"`

### Build & Deployment

- Cloudflare Pages handles automatic deployments
- Uses `cf-pages-build.sh` for build process
- TypeScript strict mode enabled with specific exceptions for generated code
- Pre-commit hooks enforce linting and formatting via Husky + lint-staged