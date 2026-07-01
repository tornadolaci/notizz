# Notizz átalakítási terv: Supabase → PHP 8.3 + MySQL 8 (rackforest.hu)

**Készült:** 2026-07-01
**Cél:** A Supabase függőség és a vendég (bejelentkezés nélküli) mód megszüntetése. Kizárólag bejelentkezés-alapú működés, szerver oldali MySQL adattárolással, saját PHP 8.3 REST API-val, rackforest.hu statikus PHP tárhelyen hosztolva. **Minden más funkció változatlan marad, beleértve a PWA telepíthetőséget.**

**Rögzített döntések (2026-07-01):**
1. Nincs Google bejelentkezés — kizárólag email/jelszó auth.
2. Nincs adatmigráció — sem felhasználók, sem tartalom nem kerül át; az új app üres adatbázissal, tisztán indul.
3. Email-küldés a tárhelyszolgáltató SMTP-jén: `mail.nomadnet.hu`, port **465 (SSL/TLS)**, feladó/user: `nomad@nomadnet.hu` (jelszó CSAK a szerveren, a docroot-on kívüli `config.php`-ban — a repóba SOHA nem kerülhet be, mert a repo publikus!).
4. Telepítési hely: **`https://nomadnet.hu/app/notizz`** (alkönyvtár!) — SSL él. A base path emiatt `/app/notizz/`.

---

## 1. Jelenlegi állapot felmérése

### Adatfolyam ma

```
Bejelentkezve:  Store-ok ←→ Supabase (közvetlen, IndexedDB nélkül)
                + Realtime subscription (Postgres Changes)
                + Polling (10 mp) fallback
Vendég mód:     Store-ok ←→ IndexedDB (Dexie)
```

### Érintett modulok

| Modul | Jelenlegi szerep | Sorsa |
|---|---|---|
| [src/lib/supabase/](src/lib/supabase/) (client, auth.service, data.service, sync.service, types) | Auth + CRUD + realtime + polling | **Lecserélendő** → `src/lib/api/` |
| [src/lib/stores/auth.ts](src/lib/stores/auth.ts) | Supabase User/Session típusokra épül | **Átírandó** saját típusokra |
| [src/lib/stores/notes.ts](src/lib/stores/notes.ts), [todos.ts](src/lib/stores/todos.ts) | Kettős ág: Supabase (auth) / IndexedDB (vendég) | **Egyszerűsítendő**: csak API ág |
| [src/lib/db/](src/lib/db/) (Dexie schema) | Vendég adatok + settings tábla | **Törlendő** (notes/todos), settings → localStorage |
| [src/lib/services/storage.service.ts](src/lib/services/storage.service.ts) | IndexedDB CRUD + export/import | CRUD törlendő, export/import átírandó API-ra |
| [src/lib/components/auth/WelcomeModal.svelte](src/lib/components/auth/WelcomeModal.svelte) | Vendég mód / Bejelentkezés választó | **Átalakítandó**: csak bejelentkezés |
| [src/routes/+layout.svelte](src/routes/+layout.svelte) | Sync setup, guest fallback logout után | **Átírandó**: auth-gate |
| [src/App.svelte](src/App.svelte) | Supabase PKCE / recovery flow kezelés | **Átírandó** saját reset flow-ra |
| [vite.config.ts](vite.config.ts) | `/notizz/` base path (GitHub Pages) | **Módosítandó**: `/` + workbox API-kizárás |
| [.github/workflows/deploy.yml](.github/workflows/deploy.yml) | GitHub Pages deploy | **Lecserélendő**: SFTP/rsync deploy rackforestre |

### Ami változatlan marad (nem szabad hozzányúlni)

- Teljes UI, design system, komponensek, témák
- Order-alapú rendezés és a hozzá tartozó összes kritikus szabály (updatedAt nem frissül order-only változásnál stb.)
- Notification rendszer (natív + Toast), change detection logika
- Polling-alapú sync státusz ikon a Headerben
- PWA: manifest, service worker, telepíthetőség, share-target
- Zod validáció, típusrendszer (INote, ITodo)

---

## 2. Architektúra döntések

### 2.1 Backend: vanilla PHP 8.3 + PDO, framework nélkül

Megosztott tárhelyen a legkevesebb mozgó alkatrész a legbiztonságosabb: **egyetlen belépési pontú (front controller) natív PHP API**, Composer-függőségek nélkül (vagy minimálisan, ha a tárhelyen van Composer). PDO + prepared statements, JSON válaszok.

```
/public_html/                                       ← nomadnet.hu docroot
└── app/notizz/                                     ← https://nomadnet.hu/app/notizz
    ├── index.html, assets/, sw.js, manifest...     ← Vite build kimenet
    ├── .htaccess                                   ← rewrite + cache + security
    └── api/
        ├── index.php          ← front controller (router)
        ├── .htaccess          ← minden kérés index.php-ra
        └── src/
            ├── Database.php   ← PDO singleton
            ├── Auth.php       ← token kezelés, password hash
            ├── Router.php
            ├── controllers/   ← AuthController, NotesController, TodosController
            └── helpers.php    ← JSON response, validáció, rate limit
/notizz_config/                ← DOCROOT-ON KÍVÜL! (DB jelszó, SMTP jelszó, secret-ek)
    └── config.php
```

**Fontos:** a DB hitelesítő adatok a docroot-on kívülre kerülnek. Ha a tárhely ezt nem engedi, `.htaccess` `Require all denied` védelemmel a docroot-on belül.

### 2.2 Auth: opaque Bearer token (nem PHP session, nem JWT)

A jelenlegi viselkedés: *a session soha nem jár le, csak explicit kijelentkezéskor* (localStorage-ban tárolva, PWA-kompatibilisen). Ezt így képezzük le:

- Login/register → a szerver kriptográfiailag véletlen tokent generál (`bin2hex(random_bytes(32))`), **hash-elve** tárolja az `auth_tokens` táblában, a nyers tokent visszaadja.
- A kliens localStorage-ban tárolja (mint most a Supabase session-t), és `Authorization: Bearer <token>` fejlécben küldi.
- Nincs cookie → nincs CSRF felület; PWA standalone módban is megbízható.
- Kijelentkezés → token törlése szerveren és kliensen.
- PHP session azért nem jó: shared hostingon a session GC kiléptetné a felhasználót; JWT azért nem kell: nincs több szerver, a visszavonhatóság (logout) opaque tokennel triviális.

Jelszó: `password_hash()` (bcrypt, PHP default) + `password_verify()`.

### 2.3 Realtime → csak polling

A Supabase websocket realtime megszűnik. **A 10 mp-es polling már ma is teljes értékű sync mechanizmus** (change detection, notification, sync ikon mind erre épül) — a realtime subscription rétegét egyszerűen elhagyjuk. Felhasználói szinten a különbség: más eszközről érkező változás max. 10 mp késéssel jelenik meg a jelenlegi ~0,5 mp helyett. A notification/Toast viselkedés változatlan, mert a polling ágon ugyanaz a `showContentChangeNotification` fut.

*Opcionális optimalizáció (2. ütem):* könnyű `GET /api/changes?since=<timestamp>` végpont, ami csak `MAX(updated_at)`-et ad vissza — a teljes lista csak akkor töltődik le, ha változott valami. Shared hosting terhelést csökkenti.

### 2.4 Csak email/jelszó auth — Google OAuth megszűnik

**Döntés: nincs Google bejelentkezés.** Ez egyszerűsíti a backendet (nincs OAuth flow) és a frontendet is:
- AuthModal: Google bejelentkezés gomb törlése
- auth store + auth service: `signInWithGoogle` és minden OAuth/PKCE-hez kötődő kód törlése
- App.svelte: az OAuth redirect/code detektálás kiesik, csak a jelszó-reset link kezelése marad

### 2.5 Email küldés (regisztráció megerősítés + jelszó reset)

**A tárhelyszolgáltató SMTP-jét használjuk**: host `mail.nomadnet.hu`, user/feladó `nomad@nomadnet.hu`, hitelesített SMTP kapcsolattal (STARTTLS 587-es vagy SSL 465-ös port — a 0. fázis próbaküldése dönti el). Mivel a feladó domain és a tárhely azonos (nomadnet.hu), az SPF rendben lesz — ez a legmegbízhatóbb felállás. Implementáció: natív PHP SMTP socket vagy minimális PHPMailer.

**Biztonság:** az SMTP jelszó kizárólag a szerveren, a docroot-on kívüli `config.php`-ban tárolható. Nem kerülhet a git repóba (a repo publikus!), sem `.env` fájlba a frontend projektben.

Reset link formátum: `https://nomadnet.hu/app/notizz/#/reset-password?token=...`
Verify link: `https://nomadnet.hu/app/notizz/api/auth/verify-email?token=...` → megerősítés után redirect: `https://nomadnet.hu/app/notizz/`

- Regisztráció → megerősítő email tokennel (`/api/auth/verify-email?token=...` → átirányítás az appra) — a jelenlegi Supabase "email confirmation required" viselkedés megmarad.
- Jelszó reset → email link `https://<domain>/#/reset-password?token=...` formában, a meglévő [reset-password oldal](src/routes/reset-password/+page.svelte) átírva a saját API-ra.

---

## 3. MySQL 8 séma

```sql
-- utf8mb4, InnoDB, DATETIME(3) a milliszekundumos updatedAt-összehasonlítás miatt!
-- (a change detection getTime()-mal hasonlít, másodperces kerekítés hamis/elmaradó
--  értesítéseket okozna)

CREATE TABLE users (
  id            CHAR(36)     PRIMARY KEY,           -- UUID, kliens formátummal azonos
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified_at DATETIME(3) NULL,
  created_at    DATETIME(3)  NOT NULL,
  updated_at    DATETIME(3)  NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auth_tokens (
  token_hash   CHAR(64)    PRIMARY KEY,             -- SHA-256(token)
  user_id      CHAR(36)    NOT NULL,
  created_at   DATETIME(3) NOT NULL,
  last_used_at DATETIME(3) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE one_time_tokens (                      -- email verify + password reset
  token_hash CHAR(64)    PRIMARY KEY,
  user_id    CHAR(36)    NOT NULL,
  type       ENUM('verify_email','password_reset') NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE notes (
  id         CHAR(36)     PRIMARY KEY,
  user_id    CHAR(36)     NOT NULL,
  title      VARCHAR(500) NOT NULL DEFAULT '',
  content    MEDIUMTEXT   NOT NULL,
  color      VARCHAR(16)  NOT NULL,
  sort_order BIGINT       NOT NULL,                 -- `order` foglalt szó MySQL-ben!
  created_at DATETIME(3)  NOT NULL,
  updated_at DATETIME(3)  NOT NULL,
  INDEX idx_user_order (user_id, sort_order),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE todos (
  id              CHAR(36)     PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  title           VARCHAR(500) NOT NULL DEFAULT '',
  items           JSON         NOT NULL,            -- ITodoItem[] (createdAt ISO string!)
  color           VARCHAR(16)  NOT NULL,
  sort_order      BIGINT       NOT NULL,
  completed_count INT          NOT NULL DEFAULT 0,
  total_count     INT          NOT NULL DEFAULT 0,
  created_at      DATETIME(3)  NOT NULL,
  updated_at      DATETIME(3)  NOT NULL,
  INDEX idx_user_order (user_id, sort_order),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Megjegyzések:**
- A `sort_order` DB-oszlopnév a `order` foglalt szó miatt; az API JSON-ban továbbra is `order` néven megy ki/be, így a frontend típusok nem változnak.
- A `todos.items` JSON-jében a `createdAt` ISO stringként utazik — a meglévő Date-normalizálás (CLAUDE.md „TODO Items Date Conversion Fix") változatlanul kezeli.
- Az API minden dátumot ISO 8601 UTC stringként ad vissza milliszekundummal (`2026-07-01T10:30:00.000Z`).

---

## 4. PHP API végpontok

Minden végpont JSON-t fogad/ad, a mezőnevek **a frontend INote/ITodo camelCase konvencióját követik** (title, content, color, order, createdAt, updatedAt) — így a jelenlegi `toINote`/`fromINote` mapping réteg minimálisra egyszerűsödik.

### Auth
| Metódus | Útvonal | Leírás |
|---|---|---|
| POST | `/api/auth/register` | email+jelszó → user létrehozás + verify email küldés |
| POST | `/api/auth/login` | email+jelszó → `{ user, token }` |
| POST | `/api/auth/logout` | token érvénytelenítés |
| GET  | `/api/auth/me` | token → user (app-induló session ellenőrzés) |
| GET  | `/api/auth/verify-email?token=` | email megerősítés → redirect az appra |
| POST | `/api/auth/password-reset-request` | reset email küldés |
| POST | `/api/auth/password-reset` | `{ token, newPassword }` |

### Adatok (mind Bearer token köteles, user_id a tokenből — kliens sosem küld user_id-t)
| Metódus | Útvonal | Leírás |
|---|---|---|
| GET | `/api/notes` | összes note, sort_order szerint rendezve |
| POST | `/api/notes` | létrehozás (kliens által generált UUID-vel) |
| PATCH | `/api/notes/{id}` | részleges frissítés — **order-only változásnál a szerver NEM írja felül az updated_at-et** (kliens küldi az updatedAt-et, ha küldi) |
| DELETE | `/api/notes/{id}` | törlés |
| GET/POST/PATCH/DELETE | `/api/todos`, `/api/todos/{id}` | ugyanígy |

**Kritikus szabály átvitele:** a jelenlegi rendszerben a kliens dönti el, mikor változik az `updatedAt` (order-only change → nem változik). Ezt megtartjuk: a szerver a klienstől kapott `updatedAt`-et tárolja (ha a PATCH tartalmazza), és NEM generál sajátot. Így az order-csere logika és a change detection bitre pontosan úgy működik, mint most.

### Biztonság
- Prepared statements mindenhol (SQL injection ellen)
- Zod a kliensen marad + **szerver oldali input validáció** is (hossz, típus, color whitelist)
- Rate limit a login/register/reset végpontokon (egyszerű DB-alapú számláló: IP+email, 5 kísérlet / 15 perc)
- Generikus hibaüzenet loginnál (user enumeration ellen); a magyar hibaüzenet-térkép (`getErrorMessage`) átkerül az új `api/auth.service.ts`-be
- `Content-Type: application/json` kényszerítés, méretlimit
- HTTPS kényszerítés .htaccess-ből

---

## 5. Frontend átalakítás

### 5.1 Új `src/lib/api/` modul (a `src/lib/supabase/` helyére)

A kulcs: **az új modul ugyanazokat a függvény-szignatúrákat exportálja**, mint most a `$lib/supabase` (AuthResult, signInWithEmail, SupabaseNotesService→ApiNotesService, startPolling, registerToastCallback stb.), így a store-ok és komponensek módosítása minimális és mechanikus.

```
src/lib/api/
├── client.ts        # fetch wrapper: base URL, Bearer token, hibakezelés, isOnline()
├── auth.service.ts  # signUp/signIn/signOut/getMe/resetPassword — AuthResult megtartva
├── data.service.ts  # NotesApi/TodosApi — a mostani Supabase*Service interfészével
├── sync.service.ts  # a mostani sync.service.ts MÁSOLATA, realtime nélkül:
│                    #   - subscribeToChanges/unsubscribeFromChanges TÖRÖLVE
│                    #   - startPolling/stopPolling, change detection, notification,
│                    #     sync status, local modification tracking VÁLTOZATLAN
├── types.ts         # IUser, ISession (a Supabase User/Session pótlása)
└── index.ts
```

- Token tárolás: localStorage (`notizz_auth_token`), a `client.ts` kezeli.
- 401 válasz → token törlés + auth store nullázás → login képernyő.

### 5.2 Auth store ([src/lib/stores/auth.ts](src/lib/stores/auth.ts))

- `User`/`Session` Supabase típusok → saját `IUser` (`{ id, email, emailVerifiedAt }`)
- `initialize()`: localStorage token → `GET /api/auth/me` → user betöltés. Offline induláskor: a token megléte = "bejelentkezett" állapot (lásd 5.5 offline viselkedés).
- `onAuthStateChange` → egyszerű belső esemény (a 401-kezelés és a login/logout hívja)

### 5.3 Vendég mód kivezetése

1. **[+layout.svelte](src/routes/+layout.svelte)**:
   - `WelcomeModal` vendég opciója megszűnik → helyette **auth-gate**: ha `initialized && !user`, a fő tartalom helyett bejelentkező képernyő jelenik meg (az AuthModal tartalma teljes oldalas nézetként vagy kötelező, nem bezárható modálként).
   - `handleLogout`: a guest-fallback lépések (IndexedDB load, welcome reset) törlendők → logout után login képernyő.
   - `WELCOME_COMPLETED_KEY` logika törlendő.
2. **[notes.ts](src/lib/stores/notes.ts) / [todos.ts](src/lib/stores/todos.ts)**: a `userId ? ... : IndexedDB` háromágú elágazások két ágra egyszerűsödnek (online → API, offline → magyar hibaüzenet, ami már most is így működik auth módban). A `setNotes` guest-guard okafogyottá válik, de az auth-ellenőrzés maradjon (logout utáni stale callback ellen).
3. **Dexie eltávolítása**: `src/lib/db/` törlés, `dexie` dependency ki a package.json-ból, `NotesService`/`TodosService` IndexedDB CRUD törlés a [storage.service.ts](src/lib/services/storage.service.ts)-ből.
4. **Settings/téma**: a `settings` IndexedDB tábla megszűnik; a téma és betűméret **localStorage-ban marad** (ez eszköz-szintű preferencia, nem felhasználói adat — a [localstorage.service.ts](src/lib/services/localstorage.service.ts) már ma is kezeli, a settings store-ból csak a Dexie-ág esik ki).
5. **Export/import** (Beállítások oldal): az export a store-okban lévő (API-ról töltött) adatokból készül, az import a API-n keresztül upsertel — funkció megmarad, csak a forrás/cél változik.
6. **[App.svelte](src/App.svelte)**: Supabase PKCE/recovery detektálás → saját, egyszerűbb logika (reset token a hash-ben → reset-password oldal).

### 5.4 Egyéb frontend munkák

- AuthModal: Google bejelentkezés gomb + `signInWithGoogle` akció törlése (store-ból és service-ből is)
- `@supabase/supabase-js` eltávolítása a package.json-ból
- `.env`: a `VITE_SUPABASE_*` változók törlése; az API base a kódban `${import.meta.env.BASE_URL}api` (prod: `/app/notizz/api` — same-origin, CORS nem kell; dev: proxy-n át)
- Vite dev proxy: `server.proxy = { '/api': 'http://localhost:8080' }` a lokális PHP szerverhez
- Sync státusz ikon (Header): változatlanul működik, mert a `getSyncStatus`/`registerSyncStatusCallback` a polling-ból táplálkozik
- Grep-ellenőrzés a végén: `grep -r "supabase\|dexie\|IndexedDB\|guest\|vendég" src/` — nulla találatig

### 5.5 Offline viselkedés (PWA)

A jelenlegi auth-módbeli viselkedés marad: az app shell offline is betölt (service worker cache), a lista üres/"Nincs internetkapcsolat" állapotot mutat, írási műveletek magyar hibaüzenetet dobnak, `online` eseményre újratölt. **Ez ma is pontosan így működik bejelentkezett módban** — tehát nem változik semmi, csak a vendég-offline eset szűnik meg a vendég móddal együtt.

---

## 6. Hosting és deploy (rackforest.hu)

### 6.1 Build konfiguráció ([vite.config.ts](vite.config.ts))

Az app alkönyvtárba kerül (`https://nomadnet.hu/app/notizz`), ezért a base path **`/app/notizz/`**:

- `base: process.env.GITHUB_ACTIONS ? ... : '/'` feltétel törlése → fixen `base: '/app/notizz/'` (dev módban a Vite ezt is kezeli, a dev szerver a `localhost:5173/app/notizz/` alatt szolgál ki)
- Manifest: `start_url: '/app/notizz/'`, `scope: '/app/notizz/'`, `share_target.action: '/app/notizz/share-target'`
- A PWA telepíthetőségnek az alkönyvtáras scope nem akadálya — a service worker és a manifest a `/app/notizz/` scope-ra regisztrál
- **Workbox**: az API útvonal explicit kizárása a cache-ből:
  ```ts
  workbox: {
    navigateFallback: null,
    runtimeCaching: [ /* fonts változatlanul */ ],
    // API hívás SOHA ne legyen cache-elve (base-független minta):
    navigateFallbackDenylist: [/\/api\//],
  }
  ```
  (A fetch-alapú API hívásokat a precache nem érinti, de védőháló: NetworkOnly szabály a `/\/api\//` mintára.)
- API base URL a kliensben: `${import.meta.env.BASE_URL}api` → prod-ban `/app/notizz/api`, így nincs hardcode-olt domain

### 6.2 `.htaccess` az app könyvtárban (`/public_html/app/notizz/.htaccess`)

```apache
# HTTPS kényszerítés (SSL él a nomadnet.hu-n)
RewriteEngine On
RewriteBase /app/notizz/
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# API → PHP front controller
RewriteRule ^api/(.*)$ api/index.php [L,QSA]

# SPA: minden más nem-létező útvonal → index.html
# (hash routing miatt ritkán kell, de a share-target POST és a verify-redirect miatt igen)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]

# Cache: hash-elt assetek örökre, belépési pontok soha
<FilesMatch "\.(js|css|woff2?|png|svg)$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>
<FilesMatch "^(index\.html|sw\.js|manifest\.webmanifest|registerSW\.js)$">
  Header set Cache-Control "no-cache"
</FilesMatch>
AddType application/manifest+json .webmanifest
```

**Fontos:** az `sw.js` és `index.html` `no-cache` fejléce nélkül a PWA frissítési mechanizmus (UpdatePrompt) eltörhet — ez kötelező elem.

### 6.3 Share Target ellenőrzés

A manifest `share_target` POST-tal a `/app/notizz/share-target` útvonalra mutat (a scope-on belül kell lennie!). GitHub Pages-en ezt a service worker kezelte; az új tárhelyen a fenti SPA-fallback biztosítja, hogy SW-cache-miss esetén se 404/405 legyen. **Tesztelendő** Android Chrome-mal telepítés után.

### 6.4 Deploy pipeline

Új GitHub Actions workflow (a `deploy.yml` cseréje):
1. `npm ci && npm run build` (nincs build-time secret — az API base a `BASE_URL`-ből jön)
2. `dist/` + `api/` (PHP forrás a repóban pl. `server/` mappában) feltöltés SFTP/rsync-kel a tárhely `/public_html/app/notizz/` könyvtárába (SSH/SFTP hozzáférés GitHub secretben)
3. A `config.php` NEM a repóból megy — egyszer, kézzel kerül a szerverre a docroot-on kívülre
4. DB migrációk: verziózott `server/migrations/*.sql` fájlok, kézi vagy egyszerű PHP migrate-script futtatás

Alternatíva, ha nincs SSH: kézi SFTP feltöltés dokumentált checklist-tel (első körben ez is elég).

### 6.5 PWA következmény — felhasználói kommunikáció

Az origin megváltozik (`tornadolaci.github.io` → `nomadnet.hu`, scope: `/app/notizz/`). Ez azt jelenti:
- **A meglévő telepített PWA-k NEM frissülnek át** — a felhasználóknak az új címről újra kell telepíteniük az appot.
- A notification permission-t az új originen újra meg kell adni.
- A régi GitHub Pages verzió kapjon egy utolsó deployt, ami átirányító üzenetet mutat az új címre ("Az app új címre költözött: ...").

---

## 7. Adatmigráció — NINCS (tiszta indulás)

**Döntés: sem felhasználót, sem adatbázis-tartalmat nem mentünk át.** Következmények:

1. Az új app **üres MySQL adatbázissal indul**; a felhasználók az új címen újraregisztrálnak.
2. A Supabase-ben tárolt adatok nem kerülnek át; a Supabase projekt az átállás ellenőrzése után azonnal leállítható.
3. A vendég módú (IndexedDB-s) lokális adatokhoz sem készül felszívó/átmentő logika → **a Dexie-kód már a 3. fázisban véglegesen törölhető**, átmeneti verzió nélkül. Ez a legtisztább vágás: nulla legacy kód marad.
4. Nem kell import-script, nem kell jelszó-hash kompatibilitással foglalkozni, és a UUID-konzisztencia kérdése sem merül fel.

---

## 8. Ütemezés — fázisok és ellenőrzési pontok

### 0. fázis — Előkészítés (blokkolók)
- [x] Döntések rögzítve: nincs Google OAuth, nincs adatmigráció, szolgáltatói SMTP
- [x] Telepítési hely él: `https://nomadnet.hu/app/notizz`, SSL aktív
- [x] SMTP adatok megvannak: `mail.nomadnet.hu`, user `nomad@nomadnet.hu` (jelszó → szerveren, config.php)
- [x] SMTP port és titkosítás: **465, SSL/TLS** (próbaküldés a 4-5. fázisban, éles környezetből)
- [ ] MySQL adatbázis + DB-user létrehozás a tárhely panelen
- [ ] Lokális dev környezet: PHP 8.3 + MySQL 8 (Docker compose vagy MAMP)

### 1. fázis — Backend (a frontend érintése nélkül) ✅ KÉSZ (2026-07-01)
- [x] MySQL séma + migrációs SQL-ek ([server/migrations/001_init.sql](server/migrations/001_init.sql))
- [x] PHP API: router, DB réteg, auth (register/login/logout/me/reset/verify) — [server/api/](server/api/)
- [x] Notes/Todos CRUD végpontok az updatedAt-szabállyal (+ PUT upsert az importhoz)
- [x] Rate limit + input validáció
- [x] API tesztek: curl-alapú smoke suite ([server/tests/smoke.sh](server/tests/smoke.sh))
- [x] **Kapu teljesítve:** 37/37 smoke teszt zöld — teljes auth + CRUD folyamat működik lokálisan (regisztráció → email-verify → login → notes/todos CRUD → user-izoláció → jelszó-reset → logout → rate limit)

### 2. fázis — Frontend API-réteg csere ✅ KÉSZ (2026-07-01)
- [x] `src/lib/api/` modul a supabase modul interfészével (client, auth.service, data.service, sync.service, types)
- [x] `auth.ts` store átírás saját IUser/ISession típusokra; App.svelte PKCE-logika törölve; reset-password oldal token-alapú flow-ra átírva
- [x] `notes.ts`/`todos.ts`: Supabase hívások → API hívások (a guest ág még marad, a 3. fázis törli); toggleItem mostantól updatedAt-et is küld
- [x] sync.service: realtime ki, 10 mp polling az egyetlen sync mechanizmus; change detection/notification/sync ikon változatlan
- [x] AuthModal: Google gomb + signInWithGoogle törölve
- [x] Vite dev proxy (`/api` → localhost:8080)
- [x] **Kapu teljesítve:** böngészős E2E a PHP API-val (login → session persist reload után → jegyzet létrehozás UTF-8 tartalommal → TODO létrehozás + item pipálás DB-ben ellenőrizve → polling aktív); `npm run build` + `type-check` + `lint` (0 error) + `test:unit` (13/13) zöld

### 3. fázis — Vendég mód kivezetése
- [ ] Auth-gate a layoutban, WelcomeModal átalakítás, logout-flow
- [ ] Guest ágak törlése a store-okból
- [ ] Dexie + IndexedDB kód végleges törlése (tiszta indulás — nincs átmentő logika), settings → localStorage-only
- [ ] Export/import átírás API-alapúra
- [ ] `@supabase/supabase-js`, `dexie` dependency törlés
- **Kapu:** grep-tiszta (supabase/dexie nulla találat), type-check zöld, bundle méret csökkent

### 4. fázis — Hosting
- [ ] vite.config: base `/`, workbox API-kizárás
- [ ] `.htaccess` (rewrite, cache, HTTPS, MIME)
- [ ] Deploy workflow (SFTP) vagy kézi deploy checklist
- [ ] Staging feltöltés a rackforest tárhelyre, éles DB-vel
- **Kapu:** Lighthouse PWA audit zöld az új domainen, telepíthetőség + share-target + offline app-shell OK

### 5. fázis — Átállás
- [ ] E2E tesztek frissítése és futtatása az új stack ellen
- [ ] Teljes éles próba: regisztráció → email-megerősítés → belépés → CRUD → jelszó-reset (éles freemail SMTP-vel)
- [ ] PWA telepítés-teszt Androidon és iOS-en az új domainről (+ share-target, offline app-shell, update flow)
- [ ] GitHub Pages: átirányító oldal deploy („az app új címre költözött")
- [ ] Supabase projekt leállítása

### 6. fázis — Utómunka
- [ ] CLAUDE.md + README frissítés (új architektúra, dev környezet, deploy)
- [ ] `.github/workflows/deploy.yml` régi Pages-workflow törlés
- [ ] (Opcionális) `/api/changes` könnyű polling-végpont

---

## 9. Kockázatok és ellenszereik

| Kockázat | Hatás | Ellenszer |
|---|---|---|
| PWA origin-váltás + tiszta indulás | Minden user újratelepít és újraregisztrál | Átirányító oldal a régi címen, előzetes kommunikáció |
| DATETIME másodperc-kerekítés | Hamis notificationök, order-bugok | DATETIME(3) + ISO ms formátum, erre külön teszt |
| SMTP kapcsolati beállítás (port, TLS mód) eltér a várttól | Verify/reset emailek nem mennek ki | 0. fázisban próbaküldés; az SPF rendben (feladó és tárhely azonos domain), alacsony kockázat |
| SMTP jelszó véletlen commitolása | Publikus repóban kiszivárog | Jelszó KIZÁRÓLAG a szerveri config.php-ban; a repóban csak `config.example.php` placeholder értékekkel |
| `order` foglalt szó MySQL-ben | SQL hibák | `sort_order` oszlopnév, API-ban marad `order` |
| SW cache-eli az API-t / a régi index.html-t | "Nem frissül semmi" bugok | Workbox denylist + `.htaccess` no-cache a belépési pontokra |
| 10s polling terhelés shared hostingon | Lassulás sok usernél | Kis payload, indexek, később `/api/changes` |
| Config fájl kiszivárgás docroot-ból | DB jelszó publikus | Config a docroot-on kívül / Require all denied |

---

## 10. Becsült terjedelem

| Fázis | Nagyságrend |
|---|---|
| 1. Backend API | ~1200–1500 sor PHP + SQL |
| 2. Frontend API-réteg | ~600 sor új TS, ~10 fájl módosítás |
| 3. Vendég mód kivezetés | ~15 fájl módosítás, nettó kódcsökkenés |
| 4. Hosting | konfig + workflow |
| 5. Átállás | teszt-forgatókönyvek + deploy checklist (kód nélkül) |
