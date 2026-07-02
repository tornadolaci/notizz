# Notizz - Jegyzetek és TODO-k 📝✅

Jegyzet és TODO lista kezelő. Böngészőből telepíthető Progressive Web App (PWA).

Használd! 👉 https://nomadnet.hu/app/notizz/

## ✨ Főbb jellemzők

- 📱 **PWA** - Böngészőből telepíthető mobilra és desktopra oprendszertől függetlenül
- ☁️ **Cloud Sync** - Saját szerveres adatbázis, automatikus szinkronizálás több eszköz között
- 🔐 **Authentication** - Email/jelszó alapú regisztráció email-megerősítéssel
- 🔔 **Értesítések** - Natív értesítés + hangjelzés, ha más eszközről új tartalom érkezik
- 🌗 **Dark mode** - Manuális témaváltás lehetősége
- 📊 **Feladatkövetés** - TODO listák progress bar-ral
- 🎨 **8 pasztell szín** - Vizuális kategorizálás
- 🔄 **Manuális rendezés** - Fel/le nyíl gombok a kártyákon, a sorrend beállításához
- 📤 **Share Target** - Más appokból megosztott tartalom jegyzetként mentődik (Android)
- ♿ **Accessibility** - Teljes keyboard navigáció és screen reader támogatás

## 🌴 Relax User Experience

- Nincs adatgyűjtés, profilozás
- Nem jelennek meg reklámok
- Ráböksz -› villámgyorsan betöltődik -› használod-örülsz

## 🚀 Technológiai Stack

### Frontend
- **Svelte 5.18+** - Runes-based reaktivitás ($state, $derived, $effect)
- **TypeScript 5.7+** - Strict mode type safety
- **Vite 6.0+** - Ultragyors build tool és dev server
- **vite-plugin-pwa + Workbox** - PWA generálás, service worker, cache stratégiák

### Backend
- **PHP 8.3+** - Függőség nélküli REST API (server/)
- **MySQL 8** - Adattárolás DATETIME(3) pontossággal
- **Token auth** - Opaque Bearer token, SHA-256-tal hash-elve tárolva
- **Polling sync** - 10 másodpercenkénti szinkronizálás változás-detektálással

## 📦 Fejlesztés

Előfeltétel: Node 20+, PHP 8.3+, futó MySQL szerver.

```bash
# Függőségek telepítése
npm install

# Lokális backend konfig (első alkalommal)
cp server/config.example.php server/config.php   # db: notizz_dev, smtp driver: 'log'

# PHP API indítása
php -S localhost:8080 server/dev-router.php

# Development szerver indítása (proxyzza az /app/notizz/api kéréseket a PHP-hez)
npm run dev

# Production build + type check
npm run build

# Backend smoke teszt (friss notizz_dev adatbázist hoz létre)
bash server/tests/smoke.sh

# Unit tesztek / lint / formázás
npm run test:unit
npm run lint
npm run format

# E2E tesztek (elindítja a PHP + vite szervereket; MySQL szükséges)
npm run test:e2e
```

Részletes backend-dokumentáció: [server/README.md](./server/README.md)

## 🎨 Design System

Az alkalmazás iOS Human Interface Guidelines elveit követi:
- Glassmorphism effektek
- Pasztell színpaletta
- Smooth animációk
- Mobile-first megközelítés
- Teljes accessibility támogatás

### Reszponzivitás

| Viewport szélesség | Layout | Megjegyzés |
|---|---|---|
| **< 375px** | 1 oszlop | Optimalizált iPhone 13 mini-hez |
| **375px - 640px** | 1 oszlop | Optimalizált padding és spacing |
| **640px - 1024px** | 2 oszlop | Tablet layout |
| **≥ 1024px** | 3 oszlop | Desktop layout, max 1000px széles |

## 🎯 Használat

### Authentication
- **Email/jelszó** - Regisztráció email-megerősítéssel, utána bejelentkezés
- **Jelszó-visszaállítás** - Email-ben küldött egyszeri linkkel
- **Auto-sync** - Bejelentkezés után automatikus szinkronizálás minden eszközön

### Jegyzetek létrehozása
1. Kattints a jobb alsó sarokban lévő **+** gombra
2. Válaszd a "Jegyzet" opciót
3. Add meg a címet, tartalmat, választhatsz színt hozzá
4. Kattints a "Létrehozás" gombra

### TODO listák kezelése
1. Kattints a **+** gombra
2. Válaszd a "Teendő" opciót
3. Add meg a lista címét, add hozzá az egyes teendőket
4. Válassz színt, majd "Létrehozás" gomb
5. A kipipálás a kártyára kattintva, a szerkesztőben történik

### Rendezés
- Minden kártya alján **fel/le nyíl gombok** találhatóak
- A sorrend automatikusan mentésre kerül az adatbázisba

## 🏗️ Projekt struktúra

```
notizz/
├── src/
│   ├── lib/
│   │   ├── api/               # Backend API kliens (auth, data, sync)
│   │   ├── components/        # Svelte komponensek
│   │   │   ├── auth/          # AuthGate, AuthModal
│   │   │   ├── common/        # Általános UI komponensek
│   │   │   ├── notes/         # Jegyzet komponensek
│   │   │   ├── todos/         # TODO komponensek
│   │   │   ├── layout/        # Layout komponensek
│   │   │   └── shared/        # Megosztott komponensek
│   │   ├── stores/            # Svelte stores (auth, notes, todos, settings, theme)
│   │   ├── utils/             # Utility függvények
│   │   ├── types/             # TypeScript típusok
│   │   ├── schemas/           # Zod validációs sémák
│   │   ├── services/          # Notification, localStorage
│   │   └── constants/         # Konstansok
│   ├── routes/                # Oldalak (fő, settings, share-target, reset-password)
│   ├── app.css                # Globális stílusok
│   └── main.ts                # Entry point
├── server/
│   ├── api/                   # PHP REST API (front controller + controllerek)
│   ├── migrations/            # MySQL séma
│   └── tests/                 # Backend smoke teszt
├── tests/
│   ├── unit/                  # Vitest unit tesztek
│   └── e2e/                   # Playwright E2E tesztek
├── public/                    # Statikus fájlok (.htaccess, ikonok)
└── dist/                      # Build output
```

## 🔒 Biztonság

- **Input validáció** - Kliens- és szerveroldalon egyaránt
- **Prepared statements** - SQL injection védelem minden lekérdezésnél
- **User-izoláció** - Minden adatművelet a tokenből azonosított felhasználóra szűr
- **Rate limiting** - Login/regisztráció/reset végpontokon (5 kísérlet / 15 perc)
- **Titkok a docroot-on kívül** - DB/SMTP jelszavak soha nem kerülnek a repóba

## 🚢 Deploy

A GitHub Actions „Deploy to nomadnet.hu" workflow (kézi indítás) buildeli a
frontendet és FTPS-en feltölti a `dist/` + `server/api/` tartalmat a tárhelyre.
Részletek: [server/README.md](./server/README.md)

## 📝 Konvenciók

- **Commits**: Conventional Commits (feat:, fix:, docs:, style:, refactor:, test:, chore:)
- **Branch naming**: feature/, bugfix/, hotfix/, docs/
- **Code style**: Prettier + ESLint
- **Testing**: Minden új feature-hez unit és E2E teszt

## 📚 További dokumentáció

- [Design System](./design-system.md) - Teljes design specifikáció
- [CLAUDE.md](./CLAUDE.md) - Claude Code útmutató és fejlesztői dokumentáció
- [server/README.md](./server/README.md) - Backend és deploy dokumentáció
- [php-mysql-migration-plan.md](./php-mysql-migration-plan.md) - A Supabase → PHP+MySQL migráció terve és naplója

## 🐛 Hibák és javaslatok

Ha hibát találsz vagy javaslatod van, nyiss egy issue-t a GitHub-on.

## 👨‍💻 Szerző

Készítette: [nomadnet.hu](https://nomadnet.hu)

## 📄 Licenc

MIT License - lásd a [LICENSE](./LICENSE) fájlt a részletekért.
