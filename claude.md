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

### Manual Card Sorting Implementation
**Location**: [src/routes/+page.svelte](src/routes/+page.svelte) - `handleMoveUp()` and `handleMoveDown()` functions

**Key Features**:
- **Navigation buttons**: Up/down arrow buttons in card footer (left: down, right: up)
- **Touch-optimized**: 44x44px buttons (40x40px on mobile @375px)
- **Smooth animations**: 300ms cubic-bezier transitions with scale effects
- **Glassmorphism design**: Blur effects with theme-aware backgrounds
- **Order-based sorting**: Uses numeric `order` field instead of timestamps
- **Swap logic**: Exchanges order values between adjacent items
- **Cross-type sorting**: Notes and todos can be reordered relative to each other

**Implementation Details**:
1. **Order field**: Added to `INote` and `ITodo` interfaces, auto-generated from timestamp on create
2. **Swap mechanism**: When moving up/down, current and adjacent item's order values are swapped
3. **Optimistic updates**: Both items updated in DB, UI reacts to store changes
4. **Position detection**: Uses combined `items` array sorted by order field
5. **Boundary checks**: First item can't move up, last item can't move down
6. **Theme support**: Light mode (white bg), dark mode (dark grey bg for visibility)

**Button Visibility**:
- Desktop: Hidden by default, visible on card hover (`opacity: 0` → `opacity: 1`)
- Mobile/Touch: Always visible (`@media (hover: none)`)
- Hover effects: Scale 1.05, brighter background, info color
- Active state: Scale 0.95 for tactile feedback

**Critical Rules**:
- ✅ Always update BOTH items' order values (swap logic)
- ✅ Check item type before calling correct store update method
- ✅ Use `order` field for sorting, not `updatedAt` or `createdAt`
- ✅ Preserve all other item properties during order updates
- ❌ Never update only one item's order (causes incorrect positioning)
- ❌ Don't use sequential increment/decrement (use swap for stability)

### UI Design Updates - Cards & Spacing

**Card Spacing**:
- Default gap between cards: `--gap-cards: 20px`
- Mobile (375px): 16px gap for optimal spacing on small screens
- Grid bottom padding: 24px with safe-area support for iOS devices
- Prevents scroll jump on mobile by using `overscroll-behavior-y: none`

**Card Shadows** - Moderate, elegant depth:
- Base state: `0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.10)`
- Hover state: `0 2px 6px rgba(0,0,0,0.10), 0 8px 20px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.14)`

**Delete Button Design**:
- Position: Top-right corner of card (`top: 12px; right: 12px`)
- Color: `var(--color-info)` (#007AFF) - matches settings gear icon
- Icon: Trash bin/kuka icon (18x18px SVG)
- Size: 32x32px (mobile 375px: 36x36px for better touch target)
- Hover: Darker blue (#0051D5) with scale 1.1 and blue glow shadow
- Visibility: Desktop hover-only, mobile always visible
- Note: Urgent badge moved to top-left to avoid collision

**Header Shadow** - Subtle, refined:
- Fixed sticky header: `0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)`
- Glassmorphism effect: `backdrop-filter: blur(20px)`

**Mobile Scroll Behavior**:
- Smooth scrolling disabled on mobile (<768px) to prevent iOS jump/bounce
- `scroll-behavior: auto` on mobile, `smooth` on desktop (768px+)
- `overscroll-behavior-y: none` prevents rubber band scroll artifacts

### Card Sorting & Manual Reordering - Fixed Implementation

**Critical Fix (2025-01-07)**: A kártyák pozíció cseréje mostanáig hibásan működött. Az alábbi problémák kerültek javításra:

#### Probléma Gyökerei

1. **updatedAt ütközés az order mezővel**:
   - Amikor az `order` mező frissült, az `updatedAt` is automatikusan frissült
   - A rendezés `updatedAt` szerint történt, nem `order` szerint
   - Eredmény: Csak az időbélyeg változott, a kártya nem mozdult

2. **Urgent flag prioritás**:
   - A rendezés "urgent items first" logikával működött
   - Az `order` csere hatástalan volt urgent kártyáknál
   - Eredmény: Urgent kártyák mindig felül maradtak

3. **Hiányzó order értékek**:
   - Régi kártyák nem rendelkeztek `order` mezővel (`undefined`)
   - Az `undefined` értékek miatt hibás rendezés történt
   - Eredmény: Kártyák egyáltalán nem mozogtak

#### Megoldás Implementációja

**1. Store réteg** - [src/lib/stores/notes.ts](src/lib/stores/notes.ts), [src/lib/stores/todos.ts](src/lib/stores/todos.ts):
```typescript
// Order-only frissítésnél NEM változik az updatedAt
const isOnlyOrderChange = Object.keys(updates).length === 1 && 'order' in updates;
notesStateWritable.update(s => ({
  value: s.value.map(note =>
    note.id === id
      ? { ...note, ...updates, ...(isOnlyOrderChange ? {} : { updatedAt: new Date() }) }
      : note
  )
}));
```

**2. Service réteg** - [src/lib/services/storage.service.ts](src/lib/services/storage.service.ts):
```typescript
// getAll() most order szerint rendez (NEM updatedAt!)
static async getAll(): Promise<INote[]> {
  const notes = await db.notes.toArray();
  return notes.sort((a, b) => a.order - b.order); // Ascending order
}

// update() nem frissíti az updatedAt-et order változásnál
const isOnlyOrderChange = Object.keys(updates).length === 1 && 'order' in updates;
await db.notes.update(id, {
  ...updates,
  ...(isOnlyOrderChange ? {} : { updatedAt: new Date() }),
});
```

**3. Komponens réteg** - [src/routes/+page.svelte](src/routes/+page.svelte):
```typescript
// Urgent flag ELTÁVOLÍTVA a rendezésből - order mező teljes kontrollt ad
const items = $derived.by(() => {
  const allItems = [...notes, ...todos];
  return allItems.sort((a, b) => a.data.order - b.data.order); // Csak order!
});

// Promise.all használata - race condition elkerülése
await Promise.all([
  notesStore.update(id, { order: previousOrder }),
  notesStore.update(previousItem.id, { order: currentOrder })
]);
```

**4. Automatikus migráció** - [src/routes/+page.svelte:30-80](src/routes/+page.svelte#L30-L80):
- `onMount` során ellenőrzi, hogy vannak-e `undefined` order értékek
- Ha igen, automatikusan inicializálja őket (0, 1000, 2000, stb.)
- 1000-es lépésközök jövőbeli insertekhez biztosítanak helyet
- Migration csak egyszer fut le, utána már minden új kártya kap order értéket

#### Működés

- ✅ Kártyák valóban cserélnek pozíciót fel/le gombokkal
- ✅ `updatedAt` NEM változik mozgatáskor
- ✅ Urgent kártyák is szabadon mozgathatók bárhová
- ✅ Race condition megoldva (Promise.all)
- ✅ Régi adatok automatikusan migrálódnak
- ✅ Új kártyák timestamp-et kapnak order értéknek (természetes sorrend)

#### Kritikus Szabályok

- ⚠️ SOHA ne frissítsd az `updatedAt`-et order-only változásnál
- ⚠️ A rendezés CSAK az `order` mező alapján történjen
- ⚠️ Urgent flag NE befolyásolja a rendezést
- ⚠️ Mindig Promise.all-t használj párhuzamos update-eknél
- ⚠️ Migration kód megmarad a backward compatibility miatt
