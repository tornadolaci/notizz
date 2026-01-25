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
- **Notification Service**: Web Notifications API for browser/PWA notifications with sound

### Supabase Layer (Cloud Sync)
- **Location**: [src/lib/supabase/](src/lib/supabase/)
- **Purpose**: Cloud authentication and data synchronization
- **Client**: Supabase JS client with persistent session storage
- **Auth**: Email/password and Google OAuth support
- **Sync**: Offline-first with sync queue and realtime subscriptions
- **Pattern**: Stores → Local DB → Supabase (async sync)

### Component Structure
```
src/lib/components/
├── auth/             # Authentication UI (AuthModal, WelcomeModal, LoginForm)
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

**Header Design**:
- **Shadow**: Subtle, refined - `0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)`
- **Glassmorphism**: `backdrop-filter: blur(20px)` effect
- **Date display**: Full date visible on all screen sizes without ellipsis
  - Removed `max-width` constraints (was 150px/140px causing truncation)
  - Removed `text-overflow: ellipsis`, `overflow: hidden`, `white-space: nowrap`
  - Font size: `--text-base` (desktop), `--text-sm` (mobile)
  - Flexbox layout naturally handles spacing between brand and actions
- **Dark mode**:
  - Header background: `rgba(28, 28, 30, 0.7)` (matches settings page)
  - Date text color: `#FFFFFF` (white for better visibility)
  - CSS selector: `:global([data-theme="dark"])` - uses global scope since `data-theme` is on `<html>` element
  - Border: `1px solid rgba(255, 255, 255, 0.1)`

**Settings Page Header**:
- **Title gradient**: Same as main header "Notizz!" title
  - Gradient: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
  - Uses `-webkit-background-clip: text` and `-webkit-text-fill-color: transparent`
  - Ensures visual consistency across all pages
- **Dark mode**: Same glassmorphism effect as main header
  - Background: `rgba(28, 28, 30, 0.7)`
  - Border: `1px solid rgba(255, 255, 255, 0.1)`

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

### Új Elemek Automatikus Tetejére Kerülése (2025-01-08)

**Probléma**: Új jegyzetek és TODO-k timestamp alapú `order` értéket kaptak, így a lista aljára kerültek.

**Megoldás**: A store-ok `add()` metódusai most automatikusan a legkisebb order értéket adják az új elemeknek.

**Implementáció** - [src/lib/stores/notes.ts](src/lib/stores/notes.ts), [src/lib/stores/todos.ts](src/lib/stores/todos.ts):
```typescript
async add(note: INote): Promise<void> {
  // Calculate order to place new note at the top
  const state = get(notesStateWritable);
  const minOrder = state.value.length > 0
    ? Math.min(...state.value.map(n => n.order))
    : Date.now();

  // New note gets minimum order - 1000 (or Date.now() if first note)
  const noteWithOrder = {
    ...note,
    order: state.value.length > 0 ? minOrder - 1000 : minOrder
  };

  await NotesService.create(noteWithOrder);
}
```

**Működés**:
- ✅ Első elem: `order = Date.now()` (pl. 1736333251234)
- ✅ Második elem: `order = minOrder - 1000` → tetejére kerül
- ✅ Harmadik elem: `order = minOrder - 1000` → tetejére kerül
- ✅ 1000-es lépésköz biztosítja a jövőbeli beszúrásokat

### TODO Progress Bar Modern Redesign (2025-01-08)

**Változtatások** - [src/lib/components/todos/TodoProgress.svelte](src/lib/components/todos/TodoProgress.svelte):

**Progress Bar**:
- Vastagság: 6px → **12px** (dupla)
- Szín: Gradiens → **#007AFF** egyszínű kék
- Háttér: `rgba(0, 0, 0, 0.08)` semi-transparent
- Shadow: `inset 0 1px 3px rgba(0, 0, 0, 0.1)` + `0 1px 4px rgba(0, 122, 255, 0.3)` glow

**Progress Text (pl. 2/4)**:
- Betűméret: `--text-sm` → **`--text-base`** (minden képernyőméret)
- Szín: `--text-tertiary` → **#007AFF** (világos mód)
- Font weight: `--font-medium` → **`--font-semibold`**

**Dark Mode**:
- Progress bar szín: **#007AFF** (ugyanaz!)
- Progress text szín: `var(--text-tertiary)` (szürke, jobb láthatóság)
- Betűméret: **`--text-base`** (nagyobb)

### Szerkesztő Dinamikus Háttérszínek (2025-01-08)

**TODO Szerkesztő** - [src/lib/components/todos/TodoEditor.svelte](src/lib/components/todos/TodoEditor.svelte):
```svelte
<div class="items-list" style:--items-list-bg={todo?.color}>
```
```css
.items-list {
  background: var(--items-list-bg, var(--bg-secondary));
}

:global([data-theme="dark"]) .items-list {
  background: var(--bg-secondary);
}
```

**Jegyzet Szerkesztő** - [src/lib/components/notes/NoteEditor.svelte](src/lib/components/notes/NoteEditor.svelte):
```svelte
<textarea style:--textarea-bg={note?.color}></textarea>
```
```css
.textarea {
  background: var(--textarea-bg, var(--bg-primary));
}

:global([data-theme="dark"]) .textarea {
  background: var(--bg-primary);
}
```

**Működés**:
- ✅ Világos mód + Szerkesztés: Kártya saját pasztell háttérszíne
- ✅ Világos mód + Új létrehozás: Alapértelmezett szürke/fehér
- ✅ Sötét mód: MINDIG alapértelmezett sötét háttér

### Globális Scrollbar Elrejtés - Natív App Élmény (2025-01-08)

**Cél**: PWA natív alkalmazás megjelenés, scrollbar nélkül

**Implementáció** - [src/app.css](src/app.css):
```css
html, body, * {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

html::-webkit-scrollbar,
body::-webkit-scrollbar,
*::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}
```

**Működés**:
- ✅ Főoldal görgetősáv: Láthatatlan
- ✅ Modal dialógusok: Scrollbar nélkül
- ✅ TODO items-list: Láthatatlan scrollbar
- ✅ Jegyzet textarea: Láthatatlan scrollbar
- ✅ Cross-browser kompatibilitás (Chrome, Safari, Firefox, Edge)

**Megjegyzés**: A görgetési funkció megmarad, csak a vizuális scrollbar indikátor tűnik el.

### Mobil Görgetés Javítás - Android Chrome (2025-01-22)

**Probléma**: Android Chrome-on a lista nem volt görgethető touch gesztusokkal.

**Gyökér okok**:
1. `overscroll-behavior-y: none` blokkolta a touch scroll-t
2. `display: flex` az `.app-container`-en interferált a görgetéssel
3. `flex: 1` a main container-en problémát okozott

**Megoldás** - [src/app.css](src/app.css), [src/routes/+layout.svelte](src/routes/+layout.svelte):
```css
/* html és body - explicit scroll engedélyezés */
html, body {
  overflow-y: scroll;  /* NEM 'auto' - explicit scroll */
  /* overscroll-behavior-y: none ELTÁVOLÍTVA */
}

/* app-container - block layout flexbox helyett */
.app-container {
  display: block;      /* NEM 'flex' */
  overflow-y: visible; /* NEM 'hidden' vagy 'auto' */
}

/* main container - flex: 1 eltávolítva */
.container {
  padding-bottom: 100px; /* FAB gomb alatti hely */
  /* flex: 1 ELTÁVOLÍTVA */
}
```

**Kritikus szabályok mobil görgetéshez**:
- ⚠️ SOHA ne használj `overscroll-behavior-y: none` - blokkol(hat)ja a touch scroll-t
- ⚠️ `overflow-y: scroll` explicit beállítás szükséges, nem `auto`
- ⚠️ Kerüld a `display: flex` + `min-height: 100vh` kombinációt scroll konténereken
- ⚠️ Ne használj `touch-action` manipulációt az `*` univerzális szelektoron
- ✅ `-webkit-overflow-scrolling: touch` iOS smooth scroll támogatáshoz

### Urgent Flag Eltávolítása (2025-01-08)

**Változtatások**:
- ❌ `isUrgent` mező törölve `INote` és `ITodo` interface-ekből
- ❌ Sürgős badge és styling eltávolítva
- ❌ Urgent checkbox törlve a szerkesztő űrlapokról
- ✅ **Version 3 migration**: Automatikusan eltávolítja az `isUrgent` mezőt a meglévő adatokból
- ✅ Egyszerűsített UX - csak szín alapú kategorizálás

### Színválasztó Optimalizálás (2025-01-08)

**Új alapértelmezett színek**:
- Jegyzetek: **Lemon** (#FFFACD) - világos, barátságos
- TODO listák: **Mint** (#B2DFDB) - nyugodt, produktív

**Új helper függvény** - [src/lib/constants/colors.ts](src/lib/constants/colors.ts):
```typescript
export function hexToColorKey(hex: string): PastelColorKey {
  const upperHex = hex.toUpperCase();
  const entry = Object.entries(PASTEL_COLORS).find(([_, value]) => value.toUpperCase() === upperHex);
  return entry ? (entry[0] as PastelColorKey) : DEFAULT_COLOR;
}
```

**Használat szerkesztőkben**:
```typescript
selectedColor = hexToColorKey(note.color); // HEX → ColorKey konverzió
```

### Supabase Auth & Sync Modul (2025-01-23)

**Új modulok**:
- [src/lib/supabase/](src/lib/supabase/) - Supabase integráció
- [src/lib/stores/auth.ts](src/lib/stores/auth.ts) - Auth state management
- [src/lib/components/auth/](src/lib/components/auth/) - Auth UI komponensek

**Architektúra**:
```
src/lib/supabase/
├── client.ts       # Supabase kliens inicializálás
├── auth.service.ts # Auth műveletek (login, signup, logout)
├── data.service.ts # CRUD műveletek Supabase-zel
├── sync.service.ts # Offline sync és realtime subscriptions
├── types.ts        # Supabase Database típusok
└── index.ts        # Modul exportok
```

**Auth Flow**:
1. `authStore.initialize()` - App induláskor session ellenőrzés
2. `WelcomeModal` - Első indításkor Guest/Login választás
3. `AuthModal` - Email/jelszó vagy Google bejelentkezés
4. Session localStorage-ban tárolva (PWA kompatibilis)

**Sync Stratégia**:
- **Offline-first**: IndexedDB az elsődleges adatforrás
- **Optimistic UI**: Lokális frissítés azonnal, majd Supabase sync
- **Sync Queue**: Offline műveletek localStorage-ban tárolva
- **Realtime**: Postgres Changes subscription más eszközökről

**Realtime Sync Race Condition Javítás** - [src/lib/supabase/sync.service.ts](src/lib/supabase/sync.service.ts):

**Probléma**: TODO elem kipipálásakor a változás "elveszett" - visszaugrott a régi állapotra.

**Gyökér ok**: A Supabase realtime subscription túl gyorsan reagált és felülírta a lokális frissebb adatokat a szerveren még nem frissült régi adatokkal.

**Megoldás**:
```typescript
// 1. Debounce timer (500ms) - megvárja a szerver frissítést
const REALTIME_DEBOUNCE_MS = 500;
let todosDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// 2. Merge by updatedAt - frissebb adat nyer
function mergeByUpdatedAt<T extends { id?: string; updatedAt: Date }>(
  localItems: T[],
  remoteItems: T[]
): T[] {
  // Lokális és távoli adatok összehasonlítása
  // Ha lokális frissebb → lokális marad
  // Ha távoli frissebb → távoli nyer
}

// 3. Realtime callback debounce-olva
todosDebounceTimer = setTimeout(async () => {
  const remoteTodos = await SupabaseTodosService.getAll(userId);
  const localTodos = await db.todos.toArray();
  const mergedTodos = mergeByUpdatedAt(localTodos, remoteTodos);
  // ...
}, REALTIME_DEBOUNCE_MS);
```

**Működés**:
- ✅ TODO kipipálás megmarad
- ✅ Lokális adat prioritást élvez ha frissebb
- ✅ 500ms debounce megakadályozza a race condition-t
- ✅ Timer cleanup unsubscribe-nál

**Kritikus szabályok Supabase sync-hez**:
- ⚠️ MINDIG debounce-old a realtime callback-eket
- ⚠️ MINDIG hasonlítsd össze az `updatedAt` mezőket merge előtt
- ⚠️ Lokális frissebb adat NE legyen felülírva távoli régebbivel
- ✅ `getCurrentUserId()` lehet `null` - offline működés támogatott
- ✅ Sync queue localStorage-ban - offline műveletek megmaradnak

### TODO Items Date Conversion Fix (2025-01-23)

**Probléma**: TODO listában kipipált elemek mentése után elveszik a mentett állapot. Zod validációs hiba: `items[].createdAt` string helyett Date objektumot vár.

**Gyökér ok**: A Supabase-ből érkező TODO adatok `items[].createdAt` mezői JSON stringként érkeznek (pl. `"2025-01-23T10:30:00.000Z"`). Az IndexedDB-ből visszaolvasva is stringek maradnak (JSON serializáció miatt).

**Megoldás** - [src/lib/supabase/data.service.ts](src/lib/supabase/data.service.ts), [src/lib/services/storage.service.ts](src/lib/services/storage.service.ts):

1. **Supabase data service - `toITodo()` függvény**:
```typescript
const rawItems = (row.items as unknown as Array<{ ... createdAt: string | Date }>) || [];
const items: ITodoItem[] = rawItems.map(item => ({
  ...item,
  createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt),
}));
```

2. **Storage service - `TodosService.getAll()`**:
```typescript
const normalizedTodos = todos.map(todo => ({
  ...todo,
  items: todo.items.map(item => ({
    ...item,
    createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt as unknown as string),
  })),
}));
```

**Működés**:
- ✅ Supabase-ből jövő stringek Date-re konvertálódnak
- ✅ IndexedDB-ből jövő stringek Date-re konvertálódnak
- ✅ Zod validáció sikeres
- ✅ TODO checkbox állapota megmarad mentés után

**Kritikus szabályok dátum kezeléshez**:
- ⚠️ Supabase JSON-ből stringként érkeznek a dátumok
- ⚠️ IndexedDB is stringként tárolja a Date objektumokat
- ✅ `getAll()` metódusok MINDIG normalizáljanak dátumokat
- ✅ `instanceof Date` ellenőrzés a dupla konverzió elkerüléshez

### Sync Notification System (2025-01-25)

**Cél**: Értesítés a felhasználónak, amikor polling/realtime sync során új tartalom érkezik.

**Új modulok**:
- [src/lib/services/notification.service.ts](src/lib/services/notification.service.ts) - Web Notifications API wrapper
- [src/lib/components/common/Toast.svelte](src/lib/components/common/Toast.svelte) - In-app narancssárga toast értesítés

**Architektúra**:
```
Sync Service
├── Change detection (updatedAt összehasonlítás)
├── NotificationService.showNotification() - Native browser/PWA notification + hang
└── Toast callback - In-app narancssárga banner (3 sec auto-hide)
```

**Notification Service - [src/lib/services/notification.service.ts](src/lib/services/notification.service.ts)**:
```typescript
// Initialize on app startup
await NotificationService.initialize();

// Request permission (bejelentkezéskor / vendég mód választáskor)
await NotificationService.requestPermission();

// Show notification with sound
await NotificationService.showNotification({
  type: 'note' | 'todo',
  title: 'Jegyzet címe',
  message: 'Jegyzet: Jegyzet címe'
});
```

**Features**:
- ✅ **Native notification**: Browser/PWA notification ikával, címmel, üzenettel
- ✅ **Hangjelzés**: Beépített beep hang (800Hz, 150ms), natív rendszer hang PWA-ban
- ✅ **Auto-close**: 5 másodperc után automatikus bezárás
- ✅ **Cross-platform**: Chrome, Safari, iOS Safari, Android Chrome támogatás

**Toast Component - [src/lib/components/common/Toast.svelte](src/lib/components/common/Toast.svelte)**:
```svelte
<Toast bind:visible={toastVisible} message={toastMessage} />
```

**Features**:
- ✅ **Narancssárga szöveg** (#ff9500) - figyelem felkeltő, nem zavaró
- ✅ **Glassmorphism** - blur(20px) háttér, semi-transparent
- ✅ **Auto-hide**: 5 másodperc után automatikus elrejtés
- ✅ **Slide-in animáció**: Cubic-bezier bounce effekt
- ✅ **Fixed position**: Header alatt középen, minden képernyőméreten látható
- ✅ **Native `<dialog>` elem**: Top layer támogatás - MINDEN modal ablak felett megjelenik

**Implementáció**:
- **Dialog element**: A Toast natív `<dialog>` elemet használ, így a böngésző "top layer"-ben jelenik meg
- **Transparent backdrop**: A dialog backdrop teljesen átlátszó, nincs blur/dimming effekt
- **Z-index maximum**: `2147483647` (32-bit integer max) biztosítja a legfelső pozíciót
- **Critical fix**: Előzőleg sima `<div>` volt, amely nem tudott a modal dialog-ok fölé kerülni

**Sync Service Módosítások - [src/lib/supabase/sync.service.ts](src/lib/supabase/sync.service.ts)**:

**1. Toast callback regisztráció**:
```typescript
// Main page komponens
registerToastCallback((message: string) => {
  toastMessage = message;
  toastVisible = true;
});

// Cleanup on unmount
unregisterToastCallback();
```

**2. Change detection**:
```typescript
function hasContentChanged<T extends { id: string; updatedAt: Date }>(
  oldItems: T[],
  newItems: T[]
): T[] {
  // Compare updatedAt timestamps to detect actual changes
  // Returns array of changed/new items
}
```

**3. Notification trigger**:
- **Realtime subscription**: Debounce (500ms) utáni értesítés
- **Polling (10s interval)**: Minden polling ciklusban értesítés ha változott
- **Previous state tracking**: `previousNotes` és `previousTodos` globális változókban

**Permission Flow**:
1. **WelcomeModal** - Vendég mód / Bejelentkezés választáskor permission kérés
2. **AuthModal** - Sikeres login/register után permission kérés
3. **Main page** - `NotificationService.initialize()` az app indulásakor

**Működés**:
- ✅ Polling során változás detektálás `updatedAt` alapján
- ✅ Realtime subscription változáskor értesítés
- ✅ Dupla értesítés: Native browser notification + Toast
- ✅ Hangjelzés minden értesítésnél
- ✅ Címek megjelenítése: "Jegyzet: <cím>" vagy "TODO: <cím>"
- ✅ Üres cím esetén: "Névtelen jegyzet" / "Névtelen TODO"

**Platform Support**:
- ✅ **Desktop Chrome**: Native notification + hang
- ✅ **Desktop Safari**: Native notification + hang (permission kérés után)
- ✅ **iOS Safari (PWA)**: Native notification + natív rendszer hang
- ✅ **Android Chrome (PWA)**: Native notification + natív rendszer hang
- ⚠️ **iOS Safari (böngésző)**: Csak toast (Web Notifications API nem támogatott böngészőben)

**Kritikus szabályok**:
- ⚠️ MINDIG kérj permission-t bejelentkezéskor
- ⚠️ Toast callback MINDIG regisztráld a main page-en és cleanup unmount-nál
- ⚠️ Previous state tracking szükséges a dupla értesítés elkerülésére
- ✅ `hasContentChanged()` csak `updatedAt` mezőt hasonlít össze
- ✅ Permission denied esetén graceful fallback (csak toast, hang nélkül)
