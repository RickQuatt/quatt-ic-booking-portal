# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Quatt Support Dashboard - a React TypeScript application for internal support operations. The app provides interfaces for managing CICs (Quatt's IoT devices), installations, installers, and commissioning data. It's hosted on Cloudflare Pages and uses Firebase authentication.

## Key Commands

### Development

- `npm run dev` - Start development server with Vite (no auth middleware)
- `npm run dev:with-auth` - Start development server with Cloudflare Pages Functions middleware for auth
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

- `npm run api:generate-client` - Generate API client from OpenAPI spec (requires Quatt-cloud repo path). By default the path is set correctly.
- `npm run api:clean-models` - Remove unused API models based on .openapi-generator-ignore
- `npm run api:generate-and-clean` - Run both API generation and cleanup in sequence. This should be the default used when updating the API client.

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
- **MQTT Debugger** (`/cics/:cicId/MQTTDebug`) - Real-time MQTT message monitoring with SSE streaming

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

- **Server-Side Authentication**: Cloudflare Pages Functions middleware protects ALL routes (including static assets)
- **Session-Based Auth**: Firebase Admin SDK validates session cookies server-side
- **Asset Protection**: Static files (`/assets/*`) blocked until user authenticates
- **Firebase OAuth**: Google sign-in handled by Firebase Auth client-side
- **JWT tokens**: Automatically included in API requests
- **Setup Required**: See `CLOUDFLARE_AUTH_SETUP.md` for environment variable configuration

**Important**: The middleware requires Firebase service account credentials to be configured in Cloudflare environment variables. Without these, the site will not load.

### Environment Configuration

- Development: Uses local environment variables for API base path
- Staging/Production: Configured for Cloudflare Pages deployment
- Local API testing: Create `.env.development.local` with `VITE_API_BASE_PATH="http://localhost:3500/api/v1"`

### Build & Deployment

- Cloudflare Pages handles automatic deployments
- Uses `cf-pages-build.sh` for build process
- TypeScript strict mode enabled with specific exceptions for generated code
- Pre-commit hooks enforce linting and formatting via Husky + lint-staged

## Implementation Patterns & Best Practices

### Real-time Features & SSE Integration

#### SSE Connection Management

- **Base URL Construction**: Use `import.meta.env.VITE_API_BASE_PATH` for API endpoint URLs
- **Authentication**: Use fetch with ReadableStream instead of EventSource to include `Authorization: Bearer {token}` headers
- **Stream Reading**: Use `response.body.getReader()` with `TextDecoder` to parse SSE data manually
- **Error Handling**: Implement auto-reconnection with exponential backoff (3-second delay)
- **Custom Hooks**: Create dedicated hooks like `useMqttDebugStream` for SSE state management
- **Connection Cleanup**: Always cleanup stream readers in `useEffect` return functions with `reader.cancel()`

#### Message Management

- **Performance**: Implement message limits (e.g., `MAX_MESSAGES = 1000`) with array slicing
- **Auto-scroll**: Detect `scrollTop === 0` to toggle auto-scroll behavior on/off
- **UI State**: Use single expanded message state to prevent UI overflow
- **Visual Indicators**: Use emoji icons for clear direction indication (🔄 to_cloud, ⬇️ from_cloud)

### Component Architecture

#### Debug Interface Pattern

- **Route Structure**: Follow `/cics/:cicId/[feature]` pattern for CIC-specific tools
- **Page Wrapper**: Use existing wrapper pattern (like `CICDebugPageWrapper`) for new routes
- **Component Organization**: Create `components/` and `hooks/` subdirectories for feature modules
- **Integration**: Add navigation links in existing sections (e.g., Advanced details)

#### UI Component Patterns

- **Copy Functionality**: Implement `navigator.clipboard.writeText()` with success notifications
- **Mobile Design**: Use CSS Grid with `@media (max-width: 768px)` breakpoints
- **Loading States**: Reuse existing `Loader`, `ErrorText`, and `Button` components
- **Status Indicators**: Use color-coded visual feedback for connection states

#### CSS & Styling

- **Module Naming**: Follow `.module.css` convention matching component names
- **Typography**: Use `"Menlo", "Monaco", "Consolas", monospace` for code/data display
- **Color System**: Consistent color coding (green=connected, red=error, yellow=connecting)
- **Responsive Design**: Mobile-first approach with collapsible sections

### Performance Considerations

- **Virtual Scrolling**: Consider for lists with >1000 items
- **Message Throttling**: Implement if real-time message rate becomes excessive
- **Memory Management**: Cleanup timeouts and connections to prevent memory leaks
- **State Updates**: Batch state updates for high-frequency real-time data
- **JSON Parsing**: Use `useMemo` for expensive operations like JSON formatting to prevent re-computation on every render
- **JSON Display**: Use `@uiw/react-json-view` for interactive JSON visualization with syntax highlighting and collapsible nodes

=======

## Jira Configuration

### Creating Jira Tickets

When creating Jira tickets, use these default values to avoid unnecessary queries:

- **Cloud ID**: `e00d2e3c-9946-4be6-b81a-0bb231fc50c7`
- **Default Project**: `QPD` (Quatt Product Development)
- **Default Parent for Bugs**: `QPD-152` (Production Incidents/Maintenance - App/Backend)
- **Available Issue Types to use**: Bug, Task,
- **Jira Team**: quatt-team
- **always return the jira url when creating a ticket**: https://quatt-team.atlassian.net/browse/{issueId}

Example bug creation command:

```
Project: QPD
Issue Type: Bug
Parent: QPD-152
Summary: [description]
```

When implementing a feature, always start by creating a new git branch from `develop` with the the naming convention QPD-{issueId}-{short-description}.
Example: `QPD-1234-fix-mqtt-debugger`

When creating a pull request, always have `develop` as the target branch and include the issueId in the title of the PR.
