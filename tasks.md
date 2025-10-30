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

## 📋 FÁZIS 3: Főoldal és panel komponensek
**Becsült idő:** 25-30 perc

### 3.1 Kontextus betöltés
- [ ] Komponens struktúra áttekintése
- [ ] Svelte 5 runes szintaxis (Context7 MCP)

### 3.2 Layout komponensek
- [ ] +layout.svelte - App wrapper
- [ ] Header.svelte - Fejléc navigációval
- [ ] FloatingActionButton.svelte - Új elem gomb

### 3.3 Panel komponensek
- [ ] NoteCard.svelte - Jegyzet kártya
- [ ] TodoCard.svelte - TODO lista kártya
- [ ] TodoProgress.svelte - Haladás jelző

### 3.4 Főoldal összeállítása
- [ ] +page.svelte - Grid layout
- [ ] Rendezési logika (frissítés szerinti)
- [ ] Sürgős elemek kitűzése

### 3.5 Stores létrehozása
- [ ] notes.ts - Jegyzetek store
- [ ] todos.ts - TODO-k store
- [ ] Reaktív derived store-ok

### 3.6 Ellenőrzés
- [ ] Komponens renderelés
- [ ] Reszponzivitás (mobile/tablet/desktop)
- [ ] Store reaktivitás

---

## 📋 FÁZIS 4: Jegyzet/TODO szerkesztő
**Becsült idő:** 30-35 perc

### 4.1 Kontextus betöltés
- [ ] Modális komponens tervezés
- [ ] Form kezelés best practices

### 4.2 Szerkesztő modál
- [ ] Modal.svelte - Általános modál wrapper
- [ ] NoteEditor.svelte - Jegyzet szerkesztő
- [ ] TodoEditor.svelte - TODO szerkesztő

### 4.3 Közös komponensek
- [ ] ColorPicker.svelte - Szín választó
- [ ] TagInput.svelte - Címke kezelő
- [ ] DateDisplay.svelte - Dátum megjelenítő

### 4.4 TODO specifikus
- [ ] TodoItem.svelte - Egyedi TODO elem
- [ ] Checkbox animációk
- [ ] Elem törlés funkció

### 4.5 CRUD műveletek
- [ ] Létrehozás logika
- [ ] Szerkesztés logika
- [ ] Törlés megerősítéssel
- [ ] Optimistic updates

### 4.6 Ellenőrzés
- [ ] Form validáció működése
- [ ] Adatmentés ellenőrzése
- [ ] UI frissülés tesztelése

---

## 📋 FÁZIS 5: Keresés és szűrés
**Becsült idő:** 20-25 perc

### 5.1 Kontextus betöltés
- [ ] Keresési algoritmusok áttekintése
- [ ] Debounce pattern implementáció

### 5.2 SearchBar komponens
- [ ] SearchBar.svelte létrehozása
- [ ] Keresési input debounce-szal
- [ ] Szűrő opciók (jegyzet/todo/mind)

### 5.3 Keresési logika
- [ ] search.ts store
- [ ] Szöveg alapú keresés
- [ ] Címke alapú szűrés
- [ ] Sürgősség szerinti szűrés

### 5.4 Találatok megjelenítése
- [ ] Kiemeléses megjelenítés
- [ ] Nincs találat állapot
- [ ] Találatok számlálója

### 5.5 Search service
- [ ] src/lib/utils/search.ts
- [ ] Fuzzy search implementáció
- [ ] Relevancia alapú rendezés

### 5.6 Ellenőrzés
- [ ] Keresési teljesítmény
- [ ] Valós idejű frissülés
- [ ] Edge case-ek tesztelése

---

## 📋 FÁZIS 6: Drag&drop és swipe funkciók
**Becsült idő:** 25-30 perc

### 6.1 Kontextus betöltés
- [ ] Touch események kezelése
- [ ] Drag&drop API dokumentáció

### 6.2 Gesture utilities
- [ ] src/lib/utils/gestures.ts
- [ ] Swipe detektálás
- [ ] Drag threshold beállítás

### 6.3 Mobilos swipe
- [ ] Balra húzás - szerkesztés
- [ ] Jobbra húzás - törlés
- [ ] Animációk hozzáadása
- [ ] Haptic feedback (Vibration API)

### 6.4 Drag&drop rendezés
- [ ] Draggable attribútumok
- [ ] Drop zone kezelés
- [ ] Vizuális visszajelzés
- [ ] Touch támogatás

### 6.5 Pozíció mentése
- [ ] Egyedi sorrend tárolása
- [ ] Sorrend visszaállítása
- [ ] Szinkronizáció a store-ral

### 6.6 Ellenőrzés
- [ ] Mobil eszköz tesztelés
- [ ] Egér és touch kompatibilitás
- [ ] Performance monitoring

---

## 📋 FÁZIS 7: PWA és offline funkciók
**Becsült idő:** 30-35 perc

### 7.1 Kontextus betöltés
- [ ] PWA követelmények
- [ ] Workbox stratégiák (Context7 MCP)

### 7.2 PWA konfiguráció
- [ ] vite.config.ts PWA plugin setup
- [ ] Manifest.json finomhangolás
- [ ] Ikonok generálása

### 7.3 Service Worker
- [ ] sw.ts implementáció
- [ ] Cache stratégiák beállítása
- [ ] Offline fallback oldal
- [ ] Background sync

### 7.4 App frissítés kezelés
- [ ] Verzió ellenőrzés
- [ ] Update prompt komponens
- [ ] Automatikus frissítés opció

### 7.5 Offline indikátor
- [ ] Kapcsolat állapot figyelése
- [ ] Offline banner komponens
- [ ] Sync status jelzése

### 7.6 Share Target API
- [ ] Manifest share_target
- [ ] Share handler implementáció
- [ ] Külső tartalom fogadása

### 7.7 Ellenőrzés
- [ ] Lighthouse PWA audit
- [ ] Offline működés teszt
- [ ] Telepíthetőség ellenőrzés

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