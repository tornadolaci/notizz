# Notizz - Jegyzetek és TODO-k 📝✅

Jegyzet és TODO lista kezelő, telepíthető Progressive Web App (PWA). Kis kódméret, gyors, biztonságos és böngészőből telepíthető bármilyen eszközre. Claude Code teszt projekt. Figyelem, hibákat még tartalmazhat!

## ✨ Főbb jellemzők

- 📱 **PWA** - Telepíthető mobilra és desktopra oprendszertől függetlenül
- 🔒 **Offline-first** - Telepített üzemben gyorsítótárból betöltődik netkapcsolat nélkül is
- ☁️ **Vendég mód** - Regisztráció nélkül is futtatható standalone módban
- ☁️ **Cloud Sync** - Felhő alapú szinkronizálás több eszköz között (regisztrációval)
- 🔐 **Authentication** - Email/jelszó és Google OAuth támogatás
- 🌗 **Dark mode** - Manuális témaváltás lehetősége
- 📊 **Feladatkövetés** - TODO listák automatikus progress bar-ral
- 🎨 **8 pasztell szín** - Vizuális kategorizálás
- 💾 **Export/Import** - Adatok mentése és visszatöltése JSON formátumban
- 🔄 **Manuális rendezés** - Fel/le nyíl gombok a kártyákon, a sorrend beállításához
- ♿ **Accessibility** - Teljes keyboard navigáció és screen reader támogatás

## 🚀 Technológiai Stack

### Core
- **Svelte 5.18+** - Runes-based reaktivitás ($state, $derived, $effect)
- **TypeScript 5.7+** - Strict mode type safety
- **Vite 6.0+** - Ultragyors build tool és dev server
- **Dexie.js 4.0+** - IndexedDB wrapper perzisztens adattároláshoz

### Cloud & Auth
- **Supabase 2.47+** - Backend as a Service (PostgreSQL + Auth + Realtime)
- **Offline-first sync** - Queue-based sync mechanizmus
- **Realtime subscriptions** - Automatikus frissítések több eszközről

### PWA & Offline
- **vite-plugin-pwa 0.21+** - PWA generálás és service worker
- **Workbox 7.3+** - Cache stratégiák és offline support

## 📦 Fejlesztés

```bash
# Függőségek telepítése
npm install

# Development szerver indítása
npm run dev

# Production build
npm run build

# Preview a buildelt alkalmazást
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint

# Formázás
npm run format

# Unit tesztek
npm run test:unit

# E2E tesztek
npm run test:e2e
```

## 🎨 Design System

Az alkalmazás iOS Human Interface Guidelines elveit követi:
- Glassmorphism effektek
- Pasztell színpaletta
- Smooth animációk
- Mobile-first megközelítés
- Teljes accessibility támogatás

### Reszponzivitás
Az alkalmazás teljesen reszponzív és minden képernyőméreten tökéletesen működik:

| Viewport szélesség | Layout | Megjegyzés |
|---|---|---|
| **< 375px** | 1 oszlop | Optimalizált iPhone 13 mini-hez |
| **375px - 640px** | 1 oszlop | Optimalizált padding és spacing |
| **640px - 1024px** | 2 oszlop | Tablet layout |
| **≥ 1024px** | 3 oszlop | Desktop layout, max 1000px széles |

**Tesztelve:** iPhone 13 mini (375px), iPad (768px), Desktop (1280px+)

## 🎯 Használat

### Authentication
- **Guest Mode** - Használat bejelentkezés nélkül (adattárolás csak helyben a készüléken)
- **Email/Password** - Regisztráció és bejelentkezés email címmel
- **Google OAuth** - Gyors bejelentkezés Google fiókkal
- **Auto-sync** - Bejelentkezés után automatikus szinkronizálás

### Jegyzetek létrehozása
1. Kattints a jobb alsó sarokban lévő **+** gombra
2. Válaszd a "Jegyzet" opciót
3. Add meg a címet, tartalmat, választhatsz színt hozzá
4. Kattints a "Mentés" gombra

### TODO listák kezelése
1. Kattints a **+** gombra
2. Válaszd a "TODO lista" opciót
3. Add meg a lista címét
4. Add hozzá az egyes teendőket ("Hozzáad" gomb)
5. Válassz színt, majd "Létrehozás" gomb

### Rendezés
- Minden kártya alján **fel/le nyíl gombok** találhatóak
- A sorrend automatikusan mentésre kerül az adatbázisba

### Beállítások
- **Téma**: Világos / Sötét
- **Export**: Letölt egy JSON fájlt az összes adatoddal
- **Import**: Visszatölti a JSON fájlt
- **Kijelentkezés**: Bezárja a sessiont (adatok megmaradnak)

## 🏗️ Projekt struktúra

```
notizz/
├── src/
│   ├── lib/
│   │   ├── components/        # Svelte komponensek
│   │   │   ├── auth/          # Auth UI komponensek
│   │   │   ├── common/        # Általános UI komponensek
│   │   │   ├── notes/         # Jegyzet komponensek
│   │   │   ├── todos/         # TODO komponensek
│   │   │   ├── layout/        # Layout komponensek
│   │   │   └── shared/        # Megosztott komponensek
│   │   ├── stores/            # Svelte 5 stores
│   │   ├── supabase/          # Supabase integráció
│   │   ├── db/                # Dexie.js IndexedDB
│   │   ├── utils/             # Utility függvények
│   │   ├── types/             # TypeScript típusok
│   │   ├── schemas/           # Zod validációs sémák
│   │   ├── services/          # Business logic
│   │   └── constants/         # Konstansok
│   ├── routes/                # SvelteKit-szerű routing
│   ├── app.css                # Globális stílusok
│   └── main.ts                # Entry point
├── tests/
│   ├── unit/                  # Vitest unit tesztek
│   └── e2e/                   # Playwright E2E tesztek
├── public/                    # Statikus fájlok
│   ├── icons/                 # PWA ikonok
│   ├── robots.txt             # SEO
│   └── sitemap.xml            # SEO
└── dist/                      # Build output
```

## 🔒 Biztonság

- **Input sanitization** - XSS védelem minden user input-nál
- **Row Level Security** - Supabase RLS policies felhasználónként
- **Session management** - Biztonságos token tárolás localStorage-ban
- **CSP headers** - Content Security Policy konfiguráció
- **Rate limiting** - Abuse protection

## 📊 Performance metrikák

### Bundle size (gzipped)
- **Total**: ~488 KB (precache: 17 entries)
- CSS: 7.69 KB
- JS: ~127 KB (chunked: svelte, dexie, date-fns, supabase, app)
- Service Worker: Auto-generated with Workbox

### Lighthouse Score célok
- ⚡ Performance: 95+
- ♿ Accessibility: 95+
- 🎯 Best Practices: 95+
- 🔍 SEO: 100

### First Load
- **FCP** (First Contentful Paint): <1.5s
- **LCP** (Largest Contentful Paint): <2.5s
- **TTI** (Time to Interactive): <3.0s

## 🤝 Hozzájárulás

1. Fork-old a projektet
2. Hozz létre egy feature branch-et (`git checkout -b feature/AmazingFeature`)
3. Commit-old a változtatásokat (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push-old a branch-re (`git push origin feature/AmazingFeature`)
5. Nyiss egy Pull Request-et

## 📝 Konvenciók

- **Commits**: Conventional Commits (feat:, fix:, docs:, style:, refactor:, test:, chore:)
- **Branch naming**: feature/, bugfix/, hotfix/, docs/
- **Code style**: Prettier + ESLint
- **Testing**: Minden új feature-hez unit és E2E teszt

## 📚 További dokumentáció

- [Design System](./design-system.md) - Teljes design specifikáció
- [CLAUDE.md](./CLAUDE.md) - Claude Code útmutató és fejlesztői dokumentáció
- [Project Structure](./project-structure.md) - Részletes projekt struktúra
- [Tasks](./tasks.md) - Implementációs fázisok és állapot

## 🐛 Hibák és javaslatok

Ha hibát találsz vagy javaslatod van, nyiss egy issue-t a GitHub-on.

## 👨‍💻 Szerző

@tornadolaci : Notizz - Jegyzet és TODO kezelő

## 📄 Licenc

MIT License - lásd a [LICENSE](./LICENSE) fájlt a részletekért.
