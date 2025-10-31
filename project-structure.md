# Notizz - Projekt struktúra és technológiai stack

## 🛠 Technológiai Stack

### Core Technologies
- **Svelte 5.0+** - UI framework (runes-based reaktivitás)
- **TypeScript 5.3+** - Type safety
- **Vite 5.0+** - Build tool és dev server
- **Dexie.js 4.0+** - IndexedDB wrapper
- **Zod 3.22+** - Séma validáció
- **Tinro 0.6+** - Lightweight routing library (hash-based)

### Styling & UI
- **Vanilla CSS** - CSS változókkal
- **Material Design Icons** - SVG ikonok
- **Glass morphism** - Modern UI effektek

### PWA & Offline
- **vite-plugin-pwa** - PWA generálás
- **Workbox 7.0+** - Service worker management

### Date & State
- **date-fns 3.0+** - Dátumkezelés
- **Svelte stores** - State management

### Development Tools
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **ESLint** - Linting
- **Prettier** - Code formatting
- **Husky** - Git hooks

## 📁 Könyvtárstruktúra
```
notizz/
├── .github/
│   └── workflows/
│       └── ci.yml
├── public/
│   ├── favicon.ico
│   ├── manifest.json
│   ├── robots.txt
│   └── icons/
│       ├── icon-192x192.png
│       ├── icon-512x512.png
│       └── apple-touch-icon.png
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.svelte
│   │   │   │   ├── Modal.svelte
│   │   │   │   ├── Icon.svelte
│   │   │   │   └── FloatingActionButton.svelte
│   │   │   ├── notes/
│   │   │   │   ├── NoteCard.svelte
│   │   │   │   ├── NoteEditor.svelte
│   │   │   │   ├── NoteList.svelte
│   │   │   │   └── ColorPicker.svelte
│   │   │   ├── todos/
│   │   │   │   ├── TodoCard.svelte
│   │   │   │   ├── TodoEditor.svelte
│   │   │   │   ├── TodoItem.svelte
│   │   │   │   └── TodoProgress.svelte
│   │   │   ├── layout/
│   │   │   │   ├── Header.svelte
│   │   │   │   ├── SearchBar.svelte
│   │   │   │   └── SettingsPanel.svelte
│   │   │   └── shared/
│   │   │       ├── TagInput.svelte
│   │   │       ├── DateDisplay.svelte
│   │   │       └── EmptyState.svelte
│   │   ├── stores/
│   │   │   ├── notes.ts
│   │   │   ├── todos.ts
│   │   │   ├── settings.ts
│   │   │   ├── search.ts
│   │   │   └── theme.ts
│   │   ├── db/
│   │   │   ├── index.ts
│   │   │   ├── schema.ts
│   │   │   └── migrations.ts
│   │   ├── utils/
│   │   │   ├── date.ts
│   │   │   ├── colors.ts
│   │   │   ├── export.ts
│   │   │   ├── search.ts
│   │   │   └── gestures.ts
│   │   ├── types/
│   │   │   ├── note.ts
│   │   │   ├── todo.ts
│   │   │   └── settings.ts
│   │   ├── schemas/
│   │   │   ├── note.schema.ts
│   │   │   ├── todo.schema.ts
│   │   │   └── settings.schema.ts
│   │   ├── constants/
│   │   │   ├── colors.ts
│   │   │   ├── themes.ts
│   │   │   └── shortcuts.ts
│   │   └── services/
│   │       ├── storage.service.ts
│   │       ├── sync.service.ts
│   │       └── share.service.ts
│   ├── routes/
│   │   ├── +page.svelte
│   │   ├── +layout.svelte
│   │   ├── settings/
│   │   │   └── +page.svelte
│   │   └── share-target/
│   │       └── +page.svelte
│   ├── App.svelte
│   ├── main.ts
│   ├── app.css
│   └── app.d.ts
├── tests/
│   ├── unit/
│   │   ├── stores/
│   │   ├── utils/
│   │   └── components/
│   └── e2e/
│       ├── notes.spec.ts
│       ├── todos.spec.ts
│       └── settings.spec.ts
├── .env.example
├── .eslintrc.cjs
├── .gitignore
├── .prettierrc
├── claude.md
├── package.json
├── playwright.config.ts
├── project-structure.md
├── README.md
├── svelte.config.js
├── tasks.md
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

## 🎨 Színpaletta
```typescript
// 8 előre definiált pasztell szín
export const PASTEL_COLORS = {
  lavender: '#E6E6FA',    // Levendula
  peach: '#FFDAB9',       // Barack
  mint: '#B2DFDB',        // Menta
  sky: '#87CEEB',         // Égkék
  rose: '#FFB6C1',        // Rózsa
  lemon: '#FFFACD',       // Citrom
  sage: '#B2D3C2',        // Zsálya
  coral: '#FFB5A7'        // Korall
};
```

## 🛣 Routing

A projekt **Tinro** routing library-t használ hash-based routing-gal, ami biztosítja a PWA kompatibilitást és az offline működést.

### Útvonalak:
- `/` - Főoldal (jegyzetek és TODO-k listája)
- `/settings` - Beállítások oldal
- `/share-target` - Megosztási cél (Web Share Target API)

### Implementáció:
```typescript
// App.svelte
import { router } from 'tinro';
import { Route } from 'tinro';

router.mode.hash(); // Hash-based routing (#/settings)

<Route path="/">
  <HomePage />
</Route>
<Route path="/settings">
  <SettingsPage />
</Route>
```

### Navigáció:
```typescript
// Link használata
<a href="#/settings">Beállítások</a>

// Programozott navigáció
import { router } from 'tinro';
router.goto('/settings');
```

## 🗄 Adatbázis struktúra

### Notes tábla
```typescript
{
  id: string;           // UUID
  title: string;
  content: string;
  color: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isUrgent: boolean;
}
```

### Todos tábla
```typescript
{
  id: string;           // UUID
  title: string;
  items: TodoItem[];
  color: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isUrgent: boolean;
  completedCount: number;
  totalCount: number;
}

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}
```

### Settings tábla
```typescript
{
  id: 'user-settings';
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  language: 'hu';
  enableAnimations: boolean;
  enableSound: boolean;
  defaultColor: string;
  sortOrder: 'updated' | 'created' | 'alphabetical';
}
```