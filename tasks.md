# Notizz - Implementációs fázisok

## 📌 Általános szabályok minden fázishoz

### Fázis kezdete:
1. **Kontextus betöltés**
   - Olvasd be: claude.md, project-structure.md
   - Ellenőrizd a git status és branch állapotot
   - Vizsgáld meg a meglévő fájlokat és függőségeket
   - Azonosítsd az aktuális fázis feladatait

2. **Context7 MCP használat** KÖTELEZŐ 
   - Svelte 5 runes dokumentáció
   - Vite PWA plugin best practices
   - IndexedDB/Dexie.js patterns
   - TypeScript strict mode guidelines

### Fázis vége:
1. **Tesztek futtatása**
```bash
   npm run test:unit
   npm run lint
   npm run type-check
   npm run build
```

2. **Hiba esetén**
   - Automatikus hibajavítás
   - Újrafuttatás
   - Ha 3x sikertelen: kézi beavatkozás kérése

3. **Sikeres befejezés**
   - Git commit: `git commit -m "feat: [fázis neve] completed"`
   - Tasks.md frissítése: ✅ jelölés
   - Üzenet: "Fázis X sikeresen befejezve. Várom a megerősítést a folytatáshoz."

---

## 📋 FÁZIS 1: Projekt inicializálás és alapstruktúra ✅
**Becsült idő:** 15-20 perc
**Tényleges idő:** ~20 perc
**Befejezve:** 2025-10-30

### 1.1 Kontextus betöltés ✅
- [x] Claude.md és project-structure.md betöltése
- [x] Aktuális könyvtár ellenőrzése
- [x] Design-system.md betöltése
- [x] Context7 MCP: Svelte 5 runes dokumentáció
- [x] Context7 MCP: Vite PWA plugin dokumentáció
- [x] Context7 MCP: TypeScript strict mode dokumentáció

### 1.2 Vite + Svelte projekt létrehozása ✅
- [x] Manuális projekt setup (könyvtár nem üres miatt)
- [x] Package.json létrehozása minden függőséggel
- [x] Tsconfig.json strict mode beállítása

### 1.3 Függőségek telepítése ✅
- [x] Core: svelte@5, typescript, vite
- [x] PWA: vite-plugin-pwa, workbox-window
- [x] DB: dexie, zod
- [x] Utils: date-fns
- [x] Dev: vitest, playwright, eslint, prettier, husky

### 1.4 Alapstruktúra kialakítása ✅
- [x] Könyvtárstruktúra létrehozása (src/lib/*, tests/*, stb.)
- [x] App.css alapstílusok (teljes design system CSS változókkal)
- [x] Vite config PWA plugin-nal
- [x] ESLint + Prettier konfiguráció
- [x] Vitest + Playwright setup

### 1.5 Git inicializálás ✅
- [x] Git init és .gitignore
- [x] Initial commit
- [ ] GitHub repo kapcsolás (manuálisan később)

### 1.6 Ellenőrzés ✅
- [x] npm run type-check - sikeres
- [x] npm run build - sikeres (422ms, PWA generálva)
- [ ] npm run dev - manuális teszt szükséges
- [ ] Lighthouse audit - később

---

## 📋 FÁZIS 2: Adatmodell és IndexedDB setup ✅
**Becsült idő:** 20-25 perc
**Tényleges idő:** ~25 perc
**Befejezve:** 2025-10-30

### 2.1 Kontextus betöltés ✅
- [x] Projekt állapot ellenőrzése
- [x] Dexie.js dokumentáció (Context7 MCP)

### 2.2 TypeScript típusok és Zod sémák ✅
- [x] src/types/*.ts fájlok létrehozása (note.ts, todo.ts, settings.ts)
- [x] src/schemas/*.schema.ts Zod validációk magyar hibaüzenetekkel
- [x] Típus export/import struktúra (index.ts)

### 2.3 IndexedDB/Dexie setup ✅
- [x] src/lib/db/index.ts - Dexie instance
- [x] src/lib/db/schema.ts - Tábla definíciók EntityTable típusokkal
- [x] src/lib/db/migrations.ts - Verziókezelés és default settings

### 2.4 Storage service ✅
- [x] CRUD műveletek notes táblához (NotesService)
- [x] CRUD műveletek todos táblához (TodosService + toggleItem)
- [x] Settings kezelés (SettingsService)
- [x] UUID generátor utility (crypto.randomUUID)

### 2.5 LocalStorage wrapper ✅
- [x] Beállítások mentése/betöltése
- [x] Téma preferencia kezelés
- [x] Fallback mechanizmus (isAvailable check)

### 2.6 Ellenőrzés ✅
- [x] Unit tesztek az adatműveletekhez (storage.service.test.ts)
- [x] TypeScript típus ellenőrzés - sikeres
- [x] Build sikeres (409ms, PWA generálva)
- [ ] IndexedDB működés böngészőben - későbbi manuális teszt

---

## 📋 FÁZIS 3: Főoldal és panel komponensek ✅
**Becsült idő:** 25-30 perc
**Tényleges idő:** ~30 perc
**Befejezve:** 2025-10-30

### 3.1 Kontextus betöltés ✅
- [x] Komponens struktúra áttekintése
- [x] Svelte 5 runes szintaxis (Context7 MCP - Runed library)

### 3.2 Layout komponensek ✅
- [x] +layout.svelte - App wrapper téma inicializációval
- [x] Header.svelte - Fejléc élő órával és dátummal
- [x] FloatingActionButton.svelte - Új elem gomb gradient háttérrel

### 3.3 Panel komponensek ✅
- [x] NoteCard.svelte - Jegyzet kártya pasztell színekkel
- [x] TodoCard.svelte - TODO lista kártya checkbox-okkal
- [x] TodoProgress.svelte - Haladás jelző gradient fill-lel

### 3.4 Főoldal összeállítása ✅
- [x] +page.svelte - Grid layout (1/2/3 oszlop responsive)
- [x] Rendezési logika (frissítés szerinti, $derived.by használatával)
- [x] Sürgős elemek kitűzése (badge + border)

### 3.5 Stores létrehozása ✅
- [x] notes.ts - Jegyzetek store Svelte 5 runes-szal
- [x] todos.ts - TODO-k store Svelte 5 runes-szal
- [x] Reaktív $state és $derived használata

### 3.6 Ellenőrzés ✅
- [x] TypeScript type-check sikeres
- [x] Build sikeres (1.81s, ~220KB total gzip)
- [x] Reszponzív grid layout implementálva
- [ ] Böngésző teszt - későbbi manuális teszt szükséges

---

## 📋 FÁZIS 4: Jegyzet/TODO szerkesztő ✅
**Becsült idő:** 30-35 perc
**Tényleges idő:** ~30 perc
**Befejezve:** 2025-10-30

### 4.1 Kontextus betöltés ✅
- [x] Modális komponens tervezés
- [x] Form kezelés best practices (Context7 MCP - Svelte 5 runes)

### 4.2 Szerkesztő modál ✅
- [x] Modal.svelte - Általános modál wrapper (focus trap, ESC key, backdrop click)
- [x] NoteEditor.svelte - Jegyzet szerkesztő (CRUD, validáció)
- [x] TodoEditor.svelte - TODO szerkesztő (items kezelés, CRUD)

### 4.3 Közös komponensek ✅
- [x] ColorPicker.svelte - Szín választó (8 pasztell szín, ARIA support)
- [x] TagInput.svelte - Címke kezelő (add/remove, keyboard support)
- [x] DateDisplay.svelte - Dátum megjelenítő (date-fns, magyar nyelv)

### 4.4 TODO specifikus ✅
- [x] TodoItem.svelte - Egyedi TODO elem (checkbox, delete)
- [x] Checkbox animációk (checkmark pop animáció)
- [x] Elem törlés funkció

### 4.5 CRUD műveletek ✅
- [x] Létrehozás logika (új jegyzet/todo FAB gombbal)
- [x] Szerkesztés logika (card click → editor modal)
- [x] Törlés megerősítéssel (confirm dialog)
- [x] Optimistic updates (store-ok frissítése)

### 4.6 Ellenőrzés ✅
- [x] Form validáció működése (required fields)
- [x] Adatmentés ellenőrzése
- [x] UI frissülés tesztelése
- [x] TypeScript type-check - sikeres
- [x] Production build - sikeres (1.94s, ~254KB total)

---

## 📋 FÁZIS 5: Keresés és szűrés ✅
**Becsült idő:** 20-25 perc
**Tényleges idő:** ~25 perc
**Befejezve:** 2025-10-30

### 5.1 Kontextus betöltés ✅
- [x] Keresési algoritmusok áttekintése
- [x] Debounce pattern implementáció (Context7 MCP - Svelte 5 runes)

### 5.2 SearchBar komponens ✅
- [x] SearchBar.svelte létrehozása (sticky pozíció, iOS design)
- [x] Keresési input debounce-szal (300ms késleltetés)
- [x] Szűrő opciók (Összes/Jegyzetek/TODO-k)

### 5.3 Keresési logika ✅
- [x] search.ts store (Svelte 5 runes: $state, $derived)
- [x] Szöveg alapú keresés (cím, tartalom, TODO elemek)
- [x] Címke alapú szűrés
- [x] Relevancia alapú találatok rendezése

### 5.4 Találatok megjelenítése ✅
- [x] Valós idejű találatok megjelenítése
- [x] Nincs találat állapot (EmptyState komponens)
- [x] Találatok számlálója

### 5.5 Search service ✅
- [x] src/lib/utils/search.ts (fuzzy search utility)
- [x] Fuzzy search implementáció (exact, contains, character match)
- [x] Relevancia alapú rendezés (score + update date)

### 5.6 Ellenőrzés ✅
- [x] Keresési teljesítmény (debounce 300ms)
- [x] Valós idejű frissülés ($derived reaktivitás)
- [x] TypeScript type-check - sikeres
- [x] Production build - sikeres (2.03s, ~266KB total)
- [ ] Böngésző teszt - későbbi manuális teszt

---

## 📋 FÁZIS 6: Drag&drop és swipe funkciók ✅ BEFEJEZVE
**Becsült idő:** 25-30 perc
**Tényleges idő:** ~45 perc (swipe: 20 perc + drag&drop: 25 perc)
**Befejezve:** 2025-10-30

### 6.1 Kontextus betöltés ✅
- [x] Touch események kezelése (Context7 MCP - use-gesture)
- [x] Drag&drop API dokumentáció (Context7 MCP - SvelteDnD)

### 6.2 Gesture utilities ✅
- [x] src/lib/utils/gestures.ts létrehozva
- [x] Swipe detektálás (balra/jobbra/fel/le)
- [x] Drag threshold beállítás (100px, 0.3 px/ms velocity)
- [x] draggableItem action hozzáadva (long-press + drag)

### 6.3 Mobilos swipe ✅
- [x] Balra húzás → Szerkesztés trigger
- [x] Jobbra húzás → Törlés trigger
- [x] Animációk hozzáadása (smooth drag transform)
- [x] Haptic feedback (Vibration API)
- [x] Vizuális visszajelzés (action icons és háttér)
- [x] Desktop támogatás egérrel

### 6.4 Drag&drop rendezés ✅
- [x] draggableItem Svelte action
- [x] Long-press aktiválás (300ms) mobilon
- [x] Alt+Drag aktiválás desktopon
- [x] Vizuális placeholder és feedback
- [x] Touch és mouse támogatás
- [x] Mixed content (note + todo) rendezés

### 6.5 Pozíció mentése ✅
- [x] INote és ITodo `order` mező hozzáadva
- [x] DB schema v2 migráció (auto-upgrade)
- [x] notesStore.reorder() és todosStore.reorder()
- [x] Sorrend perzisztencia IndexedDB-ben
- [x] Optimistic UI updates

### 6.6 Ellenőrzés ✅
- [x] TypeScript type-check - sikeres
- [x] Production build - sikeres (283KB total, +5KB)
- [x] Egér és touch kompatibilitás
- [x] DB migráció tesztelve
- [ ] Mobil eszköz tesztelés - későbbi manuális teszt
- [ ] Performance monitoring - későbbi manuális teszt

---

## 📋 FÁZIS 7: PWA és offline funkciók ✅ BEFEJEZVE
**Becsült idő:** 30-35 perc
**Tényleges idő:** ~30 perc
**Befejezve:** 2025-10-30

### 7.1 Kontextus betöltés ✅
- [x] PWA követelmények
- [x] Workbox stratégiák (Context7 MCP)

### 7.2 PWA konfiguráció ✅
- [x] vite.config.ts PWA plugin setup
- [x] Manifest.json finomhangolás (categories, share_target)
- [x] Ikonok referenciák (192x192, 512x512, apple-touch-icon)

### 7.3 Service Worker ✅
- [x] Automatikus service worker generálás (Workbox generateSW)
- [x] Cache stratégiák beállítása (CacheFirst, runtimeCaching)
- [x] Precaching 17 entries (461.79 KB)
- [x] Google Fonts cache stratégia

### 7.4 App frissítés kezelés ✅
- [x] Verzió ellenőrzés (registerType: 'prompt')
- [x] UpdatePrompt.svelte komponens
- [x] Automatikus frissítés opció (updateServiceWorker)
- [x] Óránkénti frissítés ellenőrzés

### 7.5 Offline indikátor ✅
- [x] Kapcsolat állapot figyelése (navigator.onLine)
- [x] OfflineIndicator.svelte komponens
- [x] Online/offline állapot jelzése
- [x] Auto-dismiss 3s után

### 7.6 Share Target API ✅
- [x] Manifest share_target konfiguráció
- [x] /share-target route implementáció
- [x] Külső tartalom fogadása (title, text, url)
- [x] Megosztott tartalom jegyzetként mentése

### 7.7 Ellenőrzés ✅
- [x] TypeScript type-check - sikeres
- [x] Production build - sikeres (2.14s, 17 precache entries)
- [x] Service Worker és manifest generálás sikeres
- [ ] Lighthouse PWA audit - későbbi manuális teszt
- [ ] Offline működés teszt - későbbi manuális teszt
- [ ] Telepíthetőség ellenőrzés - későbbi manuális teszt

---

## 📋 FÁZIS 8: Beállítások és export/import
**Becsült idő:** 25-30 perc

### 8.1 Kontextus betöltés
- [ ] Settings route struktúra
- [ ] File API használat

### 8.2 Beállítások oldal
- [ ] src/routes/settings/+page.svelte
- [ ] SettingsPanel.svelte komponens
- [ ] Navigáció a főoldalról

### 8.3 Téma kezelés
- [ ] Világos/sötét/auto módok
- [ ] theme.ts store
- [ ] CSS változók dinamikus váltása
- [ ] System preference figyelés

### 8.4 Betűméret állítás
- [ ] 3 méret opció (kicsi/közepes/nagy)
- [ ] Élő előnézet
- [ ] Accessibility szempontok

### 8.5 Export funkció
- [ ] JSON export implementáció
- [ ] Fájl letöltés trigger
- [ ] Dátum bélyeg a fájlnévben
- [ ] Export progress jelzés

### 8.6 Import funkció  
- [ ] File input komponens
- [ ] JSON validáció Zod-dal
- [ ] Ütközések kezelése
- [ ] Import eredmény visszajelzés

### 8.7 Ellenőrzés
- [ ] Export/import round-trip teszt
- [ ] Téma váltás működése
- [ ] Settings perzisztencia

---

## 📋 FÁZIS 9: UI finomítások és animációk
**Becsült idő:** 25-30 perc

### 9.1 Kontextus betöltés
- [ ] CSS animáció best practices
- [ ] Performance szempontok

### 9.2 Glassmorphism effektek
- [ ] Backdrop-filter beállítások
- [ ] Rétegzett üveghatás
- [ ] Színezett glass panelek

### 9.3 Micro-interactions
- [ ] Checkbox animációk
- [ ] Button hover effektek
- [ ] Card hover/press állapotok
- [ ] FAB animáció

### 9.4 Transition-ök
- [ ] Oldal váltás animációk
- [ ] Modál megjelenés/eltűnés
- [ ] Lista elem hozzáadás/törlés
- [ ] Smooth scrolling

### 9.5 Loading states
- [ ] Skeleton loaders
- [ ] Shimmer effekt
- [ ] Progress indikátorok

### 9.6 Empty states
- [ ] EmptyState.svelte komponens
- [ ] Illusztrációk hozzáadása
- [ ] Akció gombok

### 9.7 Ellenőrzés
- [ ] Animáció teljesítmény (60 FPS)
- [ ] Reduced motion támogatás
- [ ] Cross-browser kompatibilitás

---

## 📋 FÁZIS 10: Végső tesztelés és optimalizáció
**Becsült idő:** 20-25 perc

### 10.1 Kontextus betöltés
- [ ] Teljes projekt áttekintése
- [ ] Production build követelmények

### 10.2 E2E tesztek
- [ ] Playwright tesztek írása
- [ ] User flow tesztelés
- [ ] Cross-browser tesztek

### 10.3 Performance optimalizáció
- [ ] Bundle size analízis
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Image optimalizáció

### 10.4 SEO és meta
- [ ] Meta tagek ellenőrzése
- [ ] Open Graph beállítások
- [ ] Robots.txt
- [ ] Sitemap generálás

### 10.5 Accessibility audit
- [ ] ARIA labels ellenőrzése
- [ ] Keyboard navigation teszt
- [ ] Screen reader teszt
- [ ] Kontraszt ellenőrzés

### 10.6 Security
- [ ] CSP headers
- [ ] XSS védelem
- [ ] Input sanitizálás
- [ ] HTTPS követelmény

### 10.7 Production build
- [ ] Build optimalizációk
- [ ] Minification
- [ ] Source maps
- [ ] Környezeti változók

### 10.8 Dokumentáció
- [ ] README.md frissítése
- [ ] Deployment útmutató
- [ ] Felhasználói dokumentáció

### 10.9 Végső ellenőrzés
- [ ] Lighthouse audit (90+ minden kategóriában)
- [ ] Bundle size (<200KB gzipped)
- [ ] First load time (<3s on 3G)
- [ ] Minden funkció működik offline

---

## ✅ Projekt befejezése

### Deployment előkészítés
- [ ] Production build létrehozása
- [ ] GitHub Pages vagy Netlify setup
- [ ] Custom domain beállítás (ha van)
- [ ] Analytics integráció (opcionális)

### Átadás
- [ ] Forráskód dokumentálása
- [ ] Használati útmutató
- [ ] Későbbi fejlesztési javaslatok
- [ ] Migráció terve (PHP backend)

---

## 📝 Megjegyzések

- Minden fázis önállóan tesztelhető és committolható
- A /clear parancs használható fázisok között
- Hiba esetén rollback az utolsó working state-re
- Context7 MCP használata KÖTELEZŐ a legfrissebb dokumentációkhoz
- A felhasználó megerősítése szükséges minden fázis után