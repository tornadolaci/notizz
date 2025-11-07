# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Notizz** - A modern note and TODO list manager Progressive Web App (PWA) with iOS-inspired design.

- **Tech Stack**: Svelte 5 (Runes) + Vite + TypeScript + IndexedDB (Dexie.js)
- **UI Language**: Hungarian
- **Code Language**: English (code, comments, types)
- **Repository**: https://github.com/tornadolaci/notizz

## Development Commands

### Essential Commands
```bash
npm run dev              # Start development server (localhost:5173)
npm run build            # Build for production + type checking
npm run preview          # Preview production build
npm run type-check       # TypeScript type checking only
npm run lint             # ESLint code linting
npm run format           # Prettier code formatting
npm run test:unit        # Run Vitest unit tests
npm run test:e2e         # Run Playwright E2E tests (includes dev server)
```

### Testing Notes
- E2E tests run on 3 projects: Desktop Chrome, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 13)
- E2E tests automatically start dev server on port 5173
- For E2E debug mode: `npx playwright test --debug`
- For E2E UI mode: `npx playwright test --ui`

## Architecture Overview

### Database Layer (IndexedDB with Dexie.js)
- **Schema**: [src/lib/db/schema.ts](src/lib/db/schema.ts) - Defines NotizzDB class with versioned migrations
- **Tables**: `notes`, `todos`, `settings` (all use string UUID as primary key)
- **Version 2 Migration**: Added `order` field for drag & drop sorting
- **Key Pattern**: Singleton database instance exported as `db`

### State Management (Svelte 5 Runes + Stores)
- **Stores**: [src/lib/stores/](src/lib/stores/) - Mix of Svelte 4 style stores and Svelte 5 runes
- **Pattern**: Writable store with derived stores + action methods
- **Optimistic Updates**: UI updates immediately, falls back to reload on error
- **Example**: `notesStore.add()` updates state first, then syncs to DB

### Service Layer
- **Location**: [src/lib/services/](src/lib/services/)
- **Purpose**: Business logic and DB operations (CRUD operations)
- **Pattern**: Services interact with Dexie DB, stores call services
- **Storage Service**: Handles export/import JSON functionality

### Component Structure
```
src/lib/components/
├── common/           # Reusable UI primitives (Button, Modal, FAB, etc.)
├── layout/           # Page structure (Header with sticky glassmorphism)
├── notes/            # Note-specific components (NoteCard, NoteEditor, ColorPicker)
├── todos/            # TODO-specific components (TodoCard, TodoEditor, TodoItem)
└── shared/           # Domain-agnostic shared components (DateDisplay, EmptyState)
```

### Type System
- **Location**: [src/lib/types/](src/lib/types/)
- **Convention**: Interfaces prefixed with `I` (e.g., `INote`, `ITodo`, `ISettings`)
- **Validation**: Zod schemas in [src/lib/schemas/](src/lib/schemas/) for runtime validation
- **Strict Mode**: TypeScript strict mode enabled

### Routing
- **Router**: Tinro (lightweight SPA router)
- **Routes**: [src/routes/](src/routes/) - File-based routing (settings/, share-target/)

## Design System

**Critical**: All UI must follow [design-system.md](design-system.md) specifications.

### Key Design Principles
- **iOS-inspired**: Glassmorphism effects, pasztell colors, smooth animations
- **Mobile-first**: Responsive grid (1 col → 2 col → 3 col)
- **Accessibility**: WCAG AAA contrast, keyboard navigation, ARIA labels, min 16px font
- **Design Tokens**: Use CSS custom properties only (no hardcoded colors/spacing)

### CSS Architecture
- **Variables**: Defined in `:root`, support light/dark themes via `[data-theme="dark"]`
- **8px spacing scale**: `--space-1` (4px) through `--space-10` (64px)
- **Naming**: BEM convention for classes
- **Colors**: 8 predefined pasztell colors (lavender, peach, mint, sky, rose, lemon, sage, coral)

### Important CSS Rules
- **Grid System**: `.note-grid` handles responsive layout - DO NOT set explicit widths on grid children
- **Viewport Breakpoints**: 375px (iPhone 13 mini optimization), 640px (tablet), 1024px (desktop)
- **Max Width**: 1000px on desktop
- **Glassmorphism**: `backdrop-filter: blur(20px)` with semi-transparent backgrounds
- **Sticky Header**: Header uses fixed positioning with glass effect

### Component Patterns
- **Cards**: 20px border-radius, iOS-style shadows, hover/touch feedback
- **Buttons**: Ripple effects, gradient backgrounds, 12px border-radius
- **Modals**: Blur backdrop, slide-in animation with bounce
- **Progress Bars**: Gradient fill for TODO completion tracking
- **Urgent Badge**: Red border + shadow for urgent items

## Code Conventions

### Svelte 5 Runes
- Use `$state`, `$derived`, `$effect` for reactivity
- Props typing: Use TypeScript generics in component script
- Store subscriptions: Automatic with `$` prefix

### TypeScript
- Explicit return types on all functions
- No `any` types (strict mode enforced)
- Zod validation for all user input and DB data

### Data Operations
- Always wrap DB operations in `try-catch`
- Use optimistic UI updates where possible
- Log errors with `console.error()` (dev only)

### Accessibility Requirements
- Semantic HTML elements (e.g., `<button>` not `<div onclick>`)
- ARIA labels on all interactive elements
- Keyboard navigation: Tab, Enter, Escape support
- Focus trap in modals
- Touch targets minimum 44x44px

### PWA Configuration
- **Service Worker**: Auto-generated by vite-plugin-pwa with Workbox
- **Cache Strategy**: CacheFirst for static assets, fonts
- **Manifest**: [vite.config.ts](vite.config.ts) contains PWA manifest config
- **Share Target**: Supports Web Share Target API for sharing content to app

## Git Workflow

- **Commit Convention**: Conventional Commits (feat:, fix:, chore:, docs:, style:, refactor:, test:)
- **Branch Protection**: Main branch should only contain tested code
- **Quality Gates**: Run `npm run test:unit && npm run lint` before committing

## Critical Rules

1. **Never modify design tokens** - Use only colors/spacing defined in design-system.md
2. **Always validate user input** - Use Zod schemas before saving to DB
3. **Responsive breakpoints** - Test at 375px, 768px, 1024px+ viewports
4. **Dark mode support** - All new components must work in both light/dark themes
5. **Offline-first** - All features must work without network connection
6. **No console.log in production** - Only use for development debugging

## Key Files Reference

- [design-system.md](design-system.md) - Complete UI/UX specification (must read for UI work)
- [package.json](package.json) - Dependencies and scripts
- [vite.config.ts](vite.config.ts) - Build config, PWA manifest, aliases (`$lib` → `/src/lib`)
- [playwright.config.ts](playwright.config.ts) - E2E test configuration
- [src/lib/db/schema.ts](src/lib/db/schema.ts) - Database schema with migration history
- [src/main.ts](src/main.ts) - Application entry point

## Performance Targets

- **Bundle Size**: ~488 KB gzipped (precache: 17 entries)
- **Lighthouse Scores**: Performance 95+, Accessibility 95+, Best Practices 95+, SEO 100
- **FCP**: < 1.5s
- **LCP**: < 2.5s
- **TTI**: < 3.0s

## Common Patterns

### Creating a New Component
1. Place in appropriate subdirectory: common/, layout/, notes/, todos/, or shared/
2. Follow design-system.md for styling (use CSS variables)
3. Add TypeScript props interface
4. Include ARIA labels and keyboard handlers
5. Test in both light and dark themes
6. Verify responsive behavior at all breakpoints

### Adding a New Store
1. Create writable base store with typed state interface
2. Export derived stores for computed values
3. Export action methods (async for DB operations)
4. Use optimistic updates with error rollback
5. Call appropriate service layer methods

### Database Schema Changes
1. Increment version in NotizzDB constructor
2. Define new stores() configuration
3. Add .upgrade() migration function if needed
4. Update TypeScript interfaces in [src/lib/types/](src/lib/types/)
5. Update Zod schemas in [src/lib/schemas/](src/lib/schemas/)

### Drag & Drop Implementation
**Location**: [src/lib/utils/gestures.ts](src/lib/utils/gestures.ts) - `draggableItem()` action

**Key Features**:
- **Long-press activation**: 300ms touch hold or Alt+Click on desktop
- **Smooth animations**: Scale 1.03, opacity 0.95, smooth transitions
- **Throttling**: 150ms between placeholder reorders to prevent vibration
- **Dead zone**: 30% overlap threshold before reordering triggers
- **Optimistic updates**: UI updates immediately, then syncs to DB

**Critical Implementation Details**:
1. **Position tracking**: Use `getBoundingClientRect()` once at drag start, cache rect
2. **Transition handling**: Disable during drag (`transition: none`), re-enable for drop animation
3. **Reference management**: Save `draggedElement` and `placeholder` refs before clearing in `handleDragEnd()`
4. **Reorder callback**: Must update ALL items in store, not just reordered ones (use `map()` + `sort()`)
5. **Type safety**: Always check `note.id` / `todo.id` for undefined before using `indexOf()`

**Common Pitfalls**:
- ❌ Never replace entire store value with only reordered items (causes freezing)
- ❌ Don't use `element.style.top` when you meant `draggedElement.style.top`
- ❌ Avoid tight reorder loops without throttling (causes vibration)
- ✅ Always preserve all items when updating order field
- ✅ Use closure-safe references in `setTimeout` callbacks
