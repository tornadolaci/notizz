# Notizz - Jegyzetek és TODO-k 📝✅

Modern jegyzet és TODO lista kezelő Progressive Web App (PWA) iOS-inspired designnal. Offline-first, gyors, biztonságos és telepíthető bármilyen eszközre.

![Notizz Banner](./docs/banner.png)

## ✨ Főbb jellemzők

- 📱 **PWA** - Telepíthető mobilra és desktopra
- 🔒 **Offline-first** - Teljes működés internet nélkül
- 🎨 **iOS-inspired design** - Glassmorphism és smooth animációk
- 🌗 **Dark mode** - Automatikus vagy manuális témavál
tás
- 🔍 **Fuzzy search** - Gyors keresés jegyzetekben és todo-kban
- 🎯 **Sürgősség jelölés** - Fontos elemek kiemelése
- 🏷️ **Címkézés** - Jegyzetek és todo-k kategorizálása
- 📊 **Haladáskövetés** - TODO listák automatikus progress bar-ral
- 🎨 **8 pasztell szín** - Vizuális kategorizálás
- 💾 **Export/Import** - Adatok mentése és visszatöltése JSON formátumban
- 🔄 **Drag & drop** - Elemek átrendezése (mobil long-press, desktop Alt+Drag)
- ♿ **Accessibility** - Teljes keyboard navigáció és screen reader támogatás

## 🚀 Technológiai Stack

### Core
- **Svelte 5.18+** - Runes-based reaktivitás ($state, $derived, $effect)
- **TypeScript 5.7+** - Strict mode type safety
- **Vite 6.0+** - Ultragyors build tool és dev server
- **Dexie.js 4.0+** - IndexedDB wrapper perzisztens adattároláshoz

### PWA & Offline
- **vite-plugin-pwa 0.21+** - PWA generálás és service worker
- **Workbox 7.3+** - Cache stratégiák és offline support

### Testing & Quality
- **Vitest 2.1+** - Unit testing framework
- **Playwright 1.49+** - E2E testing (Chrome, Mobile Chrome, Mobile Safari)
- **ESLint 9.18+** - Code linting
- **Prettier 3.4+** - Code formatting

### Other
- **Zod 3.24+** - Runtime schema validation
- **date-fns 4.1+** - Dátumkezelés

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

## 🎯 Használat

### Jegyzetek létrehozása
1. Kattints a jobb alsó sarokban lévő **+** gombra
2. Válaszd a "Jegyzet" opciót
3. Add meg a címet, tartalmat, választhatsz színt és címkéket
4. Ha sürgős, jelöld be a "Sürgős" checkbox-ot
5. Kattints a "Mentés" gombra

### TODO listák kezelése
1. Kattints a **+** gombra
2. Válaszd a "TODO lista" opciót
3. Add meg a lista címét
4. Add hozzá az egyes teendőket (Enter billentyűvel új elem)
5. Válassz színt és adj hozzá címkéket
6. Mentés után pipa-zd ki a kész elemeket

### Keresés
- Írj be bármit a keresőmezőbe a tetején
- Keresel címekben, tartalomban, címkékben és TODO elemekben
- Fuzzy search: nem kell pontos egyezés

### Szűrés
- **Összes** - Minden elem látszik
- **Csak jegyzetek** - Csak jegyzetek
- **Csak TODO-k** - Csak TODO listák

### Rendezés
- Mobil: **Long-press** (300ms) egy elemre, majd húzd az új helyére
- Desktop: **Alt + Drag** egy elemre, majd húzd
- A sorrend automatikusan mentésre kerül

### Beállítások
- **Téma**: Világos / Sötét / Automatikus
- **Betűméret**: Kicsi / Közepes / Nagy
- **Export**: Letölt egy JSON fájlt az összes adatoddal
- **Import**: Visszatölti a JSON fájlt

## 🏗️ Projekt struktúra

```
notizz/
├── src/
│   ├── lib/
│   │   ├── components/        # Svelte komponensek
│   │   │   ├── common/        # Általános UI komponensek
│   │   │   ├── notes/         # Jegyzet komponensek
│   │   │   ├── todos/         # TODO komponensek
│   │   │   ├── layout/        # Layout komponensek
│   │   │   └── shared/        # Megosztott komponensek
│   │   ├── stores/            # Svelte 5 stores
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
- **CSP headers** - Content Security Policy konfiguráció
- **Rate limiting** - Abuse protection
- **No external dependencies at runtime** - Minden lokális
- **IndexedDB encryption ready** - Készült kibővítésre

## 📊 Performance metrikák

### Bundle size (gzipped)
- **Total**: ~88.5 KB
- CSS: 7.17 KB
- JS: ~81 KB (chunked: svelte, dexie, date-fns, app)

### Lighthouse Score célok
- ⚡ Performance: 95+
- ♿ Accessibility: 95+
- 🎯 Best Practices: 95+
- 🔍 SEO: 100

### First Load
- **FCP** (First Contentful Paint): <1.5s
- **LCP** (Largest Contentful Paint): <2.5s
- **TTI** (Time to Interactive): <3.0s

## 🧪 Tesztelés

### Unit tesztek futtatása
```bash
npm run test:unit
```

### E2E tesztek futtatása
```bash
npm run test:e2e
```

### E2E tesztek debug módban
```bash
npx playwright test --debug
```

### Tesztek UI módban
```bash
npx playwright test --ui
```

## 🚀 Deployment

### Netlify
```bash
npm run build
# Deploy a dist/ könyvtárat
```

### Vercel
```bash
npm run build
# Deploy a dist/ könyvtárat
```

### GitHub Pages
```bash
npm run build
# Push a dist/ könyvtárat a gh-pages branch-re
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

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
- [Project Structure](./project-structure.md) - Részletes projekt struktúra
- [Tasks](./tasks.md) - Implementációs fázisok és állapot

## 🐛 Hibák és javaslatok

Ha hibát találsz vagy javaslatod van, nyiss egy issue-t a GitHub-on.

## 👨‍💻 Szerző

Notizz - Modern jegyzet és TODO kezelő

## 📄 Licenc

MIT License - lásd a [LICENSE](./LICENSE) fájlt a részletekért.
