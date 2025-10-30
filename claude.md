# Claude Code - Notizz projekt globális szabályok

## 🎯 Projekt kontextus
- **Név:** Notizz - Jegyzet és TODO lista kezelő PWA
- **Repo:** https://github.com/tornadolaci/notizz
- **Stack:** Svelte 5 + Vite + TypeScript + IndexedDB
- **Nyelv:** Magyar UI, angol kód és kommentek

## 📋 Általános kódolási szabályok

### Design System
- A teljes UI a design-system.md fájl szerint készül
- iOS-inspirált megjelenés következetes alkalmazása
- Minden komponens a definiált design tokeneket használja
- CSS változók kötelező használata a színekhez és spacing értékekhez
- Glass morphism effektek a design-system.md specifikáció szerint
- Animációk és micro-interactions a megadott timing függvényekkel

### TypeScript
- Strict mode használata
- Minden függvényhez explicit típus definíció
- Zod séma validáció az adatmodellekhez
- Interface-ek I prefixszel (pl. INote, ITodo)

### Svelte 5
- Runes használata ($state, $derived, $effect)
- Komponensek .svelte kiterjesztéssel
- Props típusozása TypeScript generics-szel
- Store-ok a $lib/stores mappában

### Stílus
- CSS változók használata téma kezeléshez
- Mobile-first megközelítés
- Max 1000px szélesség desktop nézetben
- BEM naming convention a CSS osztályokhoz
- Glassmorphism: backdrop-filter használata

### Adatkezelés
- IndexedDB: Dexie.js wrapper használata
- LocalStorage: csak beállításokhoz
- Minden művelet try-catch blokkban
- Optimistic UI updates

### Accessibility
- Szemantikus HTML elemek
- ARIA labels minden interaktív elemhez
- Keyboard navigation támogatás (Tab, Enter, Escape)
- Focus trap modálokban
- Min. 16px betűméret

### PWA
- Service Worker: Workbox használata
- Cache first stratégia statikus asset-ekhez
- Network first stratégia dinamikus tartalomhoz
- Background sync változtatásokhoz
- Manifest.json magyar nyelvű meta adatokkal

### Tesztelés és minőségbiztosítás
- Vitest unit tesztekhez
- Playwright E2E tesztekhez
- ESLint + Prettier kód formázás
- Minden fázis végén: npm run test && npm run lint
- Lighthouse audit 90+ score minden kategóriában

### Git workflow
- Conventional commits (feat:, fix:, chore:, docs:)
- Egy fázis = egy feature branch
- Automatikus commit sikeres tesztek után
- Main branch védett, csak tested kód

### Fejlesztési elvek
- DRY - Don't Repeat Yourself
- KISS - Keep It Simple, Stupid
- Komponens alapú architektúra
- Reaktív programozás
- Progressive enhancement

## 🔄 Kontextus betöltési protokoll
Minden fázis kezdetén:
1. Olvasd be a project-structure.md fájlt
2. Ellenőrizd a package.json függőségeket
3. Töltsd be a design-system.md fájlt a UI implementációhoz
4. Vizsgáld meg a már létező komponenseket
5. Töltsd be az aktuális tasks.md állapotot
6. Azonosítsd az aktuális fázis feladatait

## ⚠️ Kritikus szabályok
- SOHA ne módosítsd a már tesztelt és commitolt kódot visszamenőleg
- Mindig várj megerősítést fázisok között
- Hiba esetén automatikus rollback az utolsó working state-re
- Console.log() csak development módban
- Minden felhasználói adat validálása Zod-dal
- A design-system.md-ben definiált összes CSS osztály és változó használata kötelező
- Új színek vagy méretek hozzáadása TILOS, csak a definiált design tokenek használhatók
- Minden UI komponensnek követnie kell az iOS Human Interface Guidelines elveit