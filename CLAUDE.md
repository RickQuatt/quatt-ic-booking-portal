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
- `npm test` - Run unit tests in watch mode
- `npm run test:unit` - Run unit tests once (CI mode)
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:all` - Run both unit and E2E tests

### Storybook

- `npm run storybook` - Start Storybook development server on port 6006
- `npm run build-storybook` - Build static Storybook site for deployment

Storybook is configured with:

- **@storybook/react-vite** - Fast Vite-based builds
- **@storybook/addon-a11y** - Accessibility testing
- **@storybook/addon-vitest** - Component testing integration
- **@storybook/addon-docs** - Auto-generated documentation

**Deployed Storybook**: Available at `/storybook/` on all deployments (requires authentication).
The build script automatically includes Storybook in the `dist/storybook/` directory.

### API Client Management

- `npm run openapi:gen:types` - Generate API client from OpenAPI spec (requires Quatt-cloud repo path). By default the path is set correctly.

## Architecture

### Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Authentication**: Firebase Auth with Google sign-in
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Animation**: Framer Motion
- **API Client**: openapi-fetch + openapi-react-query (type-safe)
- **Testing**: Vitest (unit) + Playwright (E2E) + Storybook
- **Charts**: Chart.js with react-chartjs-2
- **Forms**: React Hook Form with Yup/Zod validation

### Application Structure

#### Main Pages & Features

- **Dashboard** (`/dashboard`) - CIC health metrics and aggregated data
- **CIC Management** (`/cics`, `/cics/:cicId`) - List and detailed view of CICs with commissioning data
- **Installation Management** (`/installations`, `/installations/:uuid`) - Installation tracking and details
- **Installer Management** (`/installers`) - Installer account management
- **Debug Interface** (`/cics/:cicId/debug`) - Hidden MQTT command interface for CICs
- **MQTT Debugger** (`/cics/:cicId/MQTTDebug`) - Real-time MQTT message monitoring with SSE streaming

#### Core Architecture Patterns

- **API Client Pattern**: Type-safe openapi-fetch with Firebase token injection
- **Query-Based Data Fetching**: TanStack React Query for all server state
- **Component Composition**: shadcn/ui + Radix UI primitives with Tailwind styling
- **Colocated Testing**: Tests and stories alongside component files
- **Route-Based Code Splitting**: Individual page components with dedicated data fetching

#### Key Directories

- `src/components/` - Modern component library organized by domain
  - `ui/` - shadcn/ui base components
  - `layout/` - Layout components (AnimatedPage, PageHeader)
  - `installation/`, `device/`, `user/` - Domain-specific components
  - `shared/` - Shared components (Search, Filter, Pagination)
- `src/pages/` - Page components for routes (see Page Organization below)
- `src/openapi-client/` - Type-safe API client (openapi-fetch)
- `src/lib/` - Shared utilities (animations, formatters)
- `src/hooks/` - Custom React hooks
- `src/ui-components/` - Legacy components (being migrated)

#### Page Organization

**All new pages MUST follow this file structure:**

```
src/pages/
  [route-name]/
    page.tsx                    # Main page component (REQUIRED)
    components/                 # Page-specific components
      ComponentName.tsx
      AnotherComponent.tsx
    hooks/                      # Page-specific hooks (optional)
      usePageData.ts
```

**Naming Convention:**

- Main page component file MUST be named `page.tsx` (NOT `PageName.tsx` or `[Route]Page.tsx`)
- Page component export should still use descriptive names: `export function CICListPage() { ... }`
- Page-specific components go in a nested `components/` directory
- Page-specific hooks go in a nested `hooks/` directory

**Examples:**

```
src/pages/cics/page.tsx                    → exports CICListPage
src/pages/cics/components/CICDataTable.tsx
src/pages/cics/components/CICFilters.tsx
src/pages/installations/page.tsx           → exports InstallationListPage
src/pages/dashboard/page.tsx               → exports DashboardPage
```

**Rationale:**

- Consistent naming makes it easy to find page entry points
- Clear separation between pages (`src/pages/`) and reusable components (`src/components/`)
- Follows common Next.js/modern framework conventions
- Keeps page-specific code colocated with the page

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
- **Setup Required**: See `docs/CLOUDFLARE_AUTH_SETUP.md` for environment variable configuration

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

## Design System

### Brand Colors

Defined in `src/index.css` using Tailwind v4's `@theme` directive:

| CSS Variable              | Value     | Name           | Usage                                        |
| ------------------------- | --------- | -------------- | -------------------------------------------- |
| `--color-quatt-primary`   | `#d9ff5c` | Electric Neon  | `bg-quatt-primary`, `text-quatt-primary`     |
| `--color-quatt-secondary` | `#ff6933` | Pumpkin Orange | `bg-quatt-secondary`, `text-quatt-secondary` |
| `--color-quatt-dark`      | `#071413` | Forest Black   | `bg-quatt-dark`, `text-quatt-dark`           |

### Typography

| Class       | Size     | Use Case               |
| ----------- | -------- | ---------------------- |
| `text-xs`   | 0.75rem  | Small labels, metadata |
| `text-sm`   | 0.875rem | Body text, form inputs |
| `text-base` | 1rem     | Default body text      |
| `text-lg`   | 1.125rem | Emphasized text        |
| `text-xl`   | 1.25rem  | Subheadings            |
| `text-2xl`  | 1.5rem   | Section headings       |
| `text-3xl`  | 1.875rem | Page titles            |

### Spacing

| Class         | Size          | Use Case            |
| ------------- | ------------- | ------------------- |
| `p-2` / `m-2` | 0.5rem (8px)  | Tight spacing       |
| `p-4` / `m-4` | 1rem (16px)   | Default spacing     |
| `p-6` / `m-6` | 1.5rem (24px) | Comfortable spacing |
| `p-8` / `m-8` | 2rem (32px)   | Generous spacing    |

### Responsive Breakpoints

| Breakpoint    | Min Width | Prefix | Use Case                |
| ------------- | --------- | ------ | ----------------------- |
| Mobile        | < 640px   | (none) | Default mobile-first    |
| Tablet        | ≥ 640px   | `sm:`  | Small tablets           |
| Desktop       | ≥ 768px   | `md:`  | Tablets, small desktops |
| Large Desktop | ≥ 1024px  | `lg:`  | Standard desktops       |
| Extra Large   | ≥ 1280px  | `xl:`  | Large monitors          |

### Animation Variants

Defined in `src/lib/animations.ts`. Import and use with Framer Motion:

```tsx
import { fadeInVariants, cardHoverVariants } from '@/lib/animations';

<motion.div variants={fadeInVariants} initial="initial" animate="animate">
```

**Available variants:**

| Variant                    | Use Case                       |
| -------------------------- | ------------------------------ |
| `pageVariants`             | Page-level transitions         |
| `fadeInVariants`           | Simple fade effects            |
| `slideInRightVariants`     | Modals, drawers from right     |
| `slideInLeftVariants`      | Drawers from left              |
| `scaleUpVariants`          | Modal dialogs                  |
| `staggerContainerVariants` | Parent for staggered lists     |
| `staggerItemVariants`      | Children in staggered lists    |
| `cardHoverVariants`        | Interactive card hover effects |
| `buttonTapVariants`        | Button press feedback          |
| `spinnerVariants`          | Loading spinner rotation       |
| `notificationVariants`     | Toast/notification animations  |
| `collapseVariants`         | Accordion/collapsible sections |

## Component Development Standards

### Directory Structure

All new components MUST be organized by domain:

```
src/components/
  ui/           # shadcn/ui base components (Card, Button, Dialog, etc.)
  layout/       # Layout components (AnimatedPage, PageHeader, Sidebar)
  installation/ # Installation-specific components
  device/       # Device-specific components
  user/         # User-specific components
  shared/       # Shared/common components (Search, Filter, Pagination)
```

### Adding shadcn/ui Components

To add new shadcn/ui components, use the CLI:

```bash
npx shadcn@latest add <component-name>
# Examples:
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add toast
```

**Configuration file:** `components.json` tells the CLI:

- Where to install components (`@/components/ui`)
- Where utils lives (`@/lib/utils` - the `cn()` function)
- Tailwind config location (`tailwind.config.js`)
- CSS file location (`src/index.css`)
- Style preferences (default style, slate base color, CSS variables)

**Note:** `components.json` is only used at dev time by the shadcn CLI. It does not affect the runtime build.

After adding a component, restructure it to match the nested directory pattern (see File Organization below).

### File Organization

**All components** (including shadcn/ui primitives) live in nested directories with colocated files:

```
ComponentName/
  ComponentName.tsx              # Component implementation
  ComponentName.unit.test.tsx    # Unit tests
  ComponentName.stories.tsx      # Storybook stories
  index.ts                       # Export { ComponentName }
```

**Important**: Even shadcn/ui base components follow this structure. For example:

```
src/components/ui/Button/
  Button.tsx
  Button.unit.test.tsx
  Button.stories.tsx
  index.ts
```

This ensures:

- Consistent organization across all components
- Colocated tests and documentation for every component
- Easy navigation in IDEs (cmd+P shows full context)
- Clear ownership and modification history per component

**Import Path Compatibility**: Barrel exports in `index.ts` maintain backward compatibility:

```typescript
// Both work identically:
import { Button } from "@/components/ui/button";
import { Button } from "@/components/ui/Button";
```

### Component Implementation Template

**Required Stack:**

- **Styling**: Tailwind CSS utility classes ONLY (no CSS modules, no inline styles)
- **Primitives**: Radix UI via shadcn/ui components from `@/components/ui/*`
- **Animation**: Framer Motion with presets from `@/lib/animations`
- **Types**: Import from `@/openapi-client/types/api/v1`
- **No `any` types**: All props and data must be properly typed

**Template:**

````tsx
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fadeInVariants } from "@/lib/animations";
import type { components } from "@/openapi-client/types/api/v1";

type MyDataType = components["schemas"]["SchemaName"];

export interface ComponentNameProps {
  data: MyDataType;
  onClick?: (data: MyDataType) => void;
  className?: string;
}

/**
 * Brief description of what this component does
 *
 * @example
 * ```tsx
 * <ComponentName data={data} onClick={handleClick} />
 * ```
 */
export const ComponentName = ({
  data,
  onClick,
  className,
}: ComponentNameProps) => {
  return (
    <motion.div
      variants={fadeInVariants}
      initial="initial"
      animate="animate"
      className={className}
    >
      <Card>
        <CardHeader>
          <CardTitle>{data.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Use Tailwind utilities for ALL styling */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Label:</span>
            <span className="font-medium">{data.value}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
````

**Key Principles:**

- ✅ Use shadcn/ui components as building blocks
- ✅ Style exclusively with Tailwind utility classes
- ✅ Add Framer Motion for interactions/transitions
- ✅ Provide TypeScript interfaces for all props
- ✅ Include JSDoc with usage example
- ✅ Support optional `className` prop for composability
- ✅ Handle loading/error states appropriately
- ❌ No CSS modules, inline styles, or emotion/styled-components
- ❌ No `any` types - everything must be typed
- ❌ No rebuilding primitives that shadcn/ui provides

### Testing Infrastructure

**Testing Stack:**

| Tool            | Purpose                  | Config File         |
| --------------- | ------------------------ | ------------------- |
| Vitest          | Unit testing             | `vitest.config.ts`  |
| Testing Library | Component testing        | `src/test/setup.ts` |
| Storybook       | Visual/component testing | `.storybook/`       |
| MSW             | API mocking              | `src/mocks/`        |

**Coverage Requirements:**

- 70% threshold for lines, functions, branches, statements
- Exclusions: node_modules, test utilities, config files, stories, types, generated API client

**MSW API Mocking:**

```tsx
// src/mocks/handlers.ts
import { http, HttpResponse } from "msw";

const API_BASE = import.meta.env.VITE_API_BASE_PATH || "/api/v1";

export const handlers = [
  http.get(`${API_BASE}/admin/installations`, () => {
    return HttpResponse.json({
      result: [
        { id: "1", name: "Installation 1", status: "active" },
        { id: "2", name: "Installation 2", status: "inactive" },
      ],
    });
  }),
];
```

**Debugging Tools:**

- `npm run test:ui` - Vitest visual interface at `http://localhost:51204/__vitest__/`

### Unit Testing Template

**Requirements:**

- Minimum 70% coverage (lines, functions, branches, statements)
- Test user interactions (clicks, keyboard events)
- Test all prop variations and edge cases
- Use semantic queries (`getByRole`, `getByLabelText`)

**Template:**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ComponentName } from "./ComponentName";
import type { components } from "@/openapi-client/types/api/v1";

type MyDataType = components["schemas"]["SchemaName"];

describe("ComponentName", () => {
  const mockData: MyDataType = {
    name: "Test Name",
    value: "Test Value",
  };

  it("renders component data", () => {
    render(<ComponentName data={mockData} />);
    expect(screen.getByText("Test Name")).toBeInTheDocument();
    expect(screen.getByText("Test Value")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<ComponentName data={mockData} onClick={handleClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledWith(mockData);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("handles keyboard navigation (Enter key)", () => {
    const handleClick = vi.fn();
    render(<ComponentName data={mockData} onClick={handleClick} />);

    const element = screen.getByRole("button");
    fireEvent.keyDown(element, { key: "Enter" });
    expect(handleClick).toHaveBeenCalledWith(mockData);
  });

  it("handles missing optional fields gracefully", () => {
    const minimalData: MyDataType = {
      name: "Minimal",
      value: null,
    };
    render(<ComponentName data={minimalData} />);
    expect(screen.getByText("Minimal")).toBeInTheDocument();
  });

  it("applies custom className when provided", () => {
    const { container } = render(
      <ComponentName data={mockData} className="custom-class" />,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
```

### Storybook Stories Template

**Story Categories:**

- `UI/*` - shadcn/ui base components (Button, Card, Dialog, etc.)
- `Shared/*` - Shared/common components (DataTable, Loader, ErrorText, etc.)
- `Layout/*` - Layout components (Sidebar, AnimatedPage)
- `Installation/*` - Installation-related components
- `Device/*` - Device-related components
- `User/*` - User-related components

**Template:**

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ComponentName } from "./ComponentName";
import type { components } from "@/openapi-client/types/api/v1";

type MyDataType = components["schemas"]["SchemaName"];

const meta: Meta<typeof ComponentName> = {
  title: "Domain/ComponentName",
  component: ComponentName,
  tags: ["autodocs"],
  argTypes: {
    onClick: { action: "clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

const mockData: MyDataType = {
  name: "Example Name",
  value: "Example Value",
};

export const Default: Story = {
  args: {
    data: mockData,
  },
};

export const WithInteraction: Story = {
  args: {
    data: mockData,
    onClick: (data) => console.log("Clicked:", data),
  },
};

export const EmptyState: Story = {
  args: {
    data: { name: "", value: null },
  },
};

export const InGrid: Story = {
  args: {
    data: mockData,
  },
  decorators: [
    (Story) => (
      <div className="grid grid-cols-3 gap-4">
        <Story />
        <Story />
        <Story />
      </div>
    ),
  ],
};
```

### DRY Principles & Best Practices

**1. Reuse shadcn/ui Components:**

```tsx
// ✅ GOOD - Compose from primitives
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>{children}</CardContent>
</Card>

// ❌ BAD - Rebuilding primitives manually
<div className="rounded-lg border bg-card shadow-sm">
  <div className="p-6">
    <h3 className="text-2xl font-semibold">Title</h3>
  </div>
  <div className="p-6">{children}</div>
</div>
```

**2. Extract Repeated Patterns:**

```tsx
// ✅ GOOD - Shared utility or custom hook
const { formatDate } = useFormatters();
<span>{formatDate(data.createdAt)}</span>

// ❌ BAD - Repeated logic everywhere
<span>{new Date(data.createdAt).toLocaleDateString('en-US', {})}</span>
```

**3. Use Animation Presets:**

```tsx
// ✅ GOOD - Preset from @/lib/animations
import { cardHoverVariants } from '@/lib/animations';
<motion.div variants={cardHoverVariants} initial="rest" whileHover="hover">

// ❌ BAD - Inline animation definitions
<motion.div animate={{ scale: 1.02, transition: { duration: 0.2 } }}>
```

**4. Common Patterns:**

**Forms with React Hook Form:**

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

const form = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: { name: "", email: "" },
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>;
```

**Modal Dialogs:**

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
    </DialogHeader>
    <div className="py-4">Are you sure you want to proceed?</div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

### Accessibility Requirements

Every component MUST meet these accessibility standards:

- ✅ **Semantic HTML**: Use `<button>`, `<nav>`, `<main>`, `<article>`, etc.
- ✅ **ARIA Labels**: Provide labels for icons and non-text actions
- ✅ **Keyboard Navigation**: Support Enter, Space, Escape, Arrow keys
- ✅ **Focus Management**: Visible focus states, logical tab order
- ✅ **Screen Reader Support**: Meaningful labels and announcements
- ✅ **Color Contrast**: WCAG AA minimum (4.5:1 for normal text, 3:1 for large text)

**Example:**

```tsx
// Accessible button with icon
<button
  onClick={handleDelete}
  aria-label="Delete installation"
  className="p-2 hover:bg-gray-100 rounded focus:ring-2 focus:ring-quatt-primary"
>
  <TrashIcon className="h-4 w-4" />
</button>

// Keyboard-accessible interactive div
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  aria-label="View details"
>
  {content}
</div>
```

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

- **Tailwind Only**: Use Tailwind utility classes exclusively (no CSS modules or inline styles)
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

## Jira Configuration

### Working with Jira Tickets

This project uses the **acli (Atlassian Command Line Interface)** for Jira integration. Use the following skills for Jira operations:

#### Available Skills

| Skill               | Description                                                                              | Usage                     |
| ------------------- | ---------------------------------------------------------------------------------------- | ------------------------- |
| `/jira:ticket`      | Create or update QPD tickets for bugs, tasks, and features                               | `/jira:ticket`            |
| `/jira:release`     | Create or update QPD releases and associated CHG change management tickets               | `/jira:release`           |
| `/jira:begin-task`  | Start work on a Jira ticket (creates branch, plans, optionally executes with commit/PR) | `/jira:begin-task <ID>`   |
| `/jira:change`      | Create or update CHG (Software Change Management) tickets for deployments                | `/jira:change`            |

#### Default Values

When creating Jira tickets, use these default values:

- **Default Project**: `QPD` (Quatt Product Development)
- **Default Parent for Bugs**: `QPD-152` (Production Incidents/Maintenance - App/Backend)
- **Available Issue Types**: Bug, Task
- **Jira Team**: quatt-team
- **Jira URL Format**: `https://quatt-team.atlassian.net/browse/{issueId}`

#### Git Branch Convention

When implementing a feature or fixing a bug, always:

1. Create a new git branch from `develop` with naming convention: `QPD-{issueId}-{short-description}`
   - Example: `QPD-1234-fix-mqtt-debugger`
2. When creating a pull request:
   - Target branch: `develop`
   - Include the issueId in the PR title
   - Example PR title: `[QPD-1234] Fix MQTT debugger connection issues`

#### Example Workflows

**Create a bug ticket:**

```bash
/jira:ticket
# Follow the prompts to create a Bug under QPD-152
```

**Start working on an existing ticket:**

```bash
/jira:begin-task QPD-1234
# Automatically creates branch, plans implementation, and can execute with auto-commit/PR
```

**Create a release:**

```bash
/jira:release
# Creates release ticket and associated CHG change management ticket
```
