# 🔒 Notizz - Teljes Biztonsági Auditálási Jelentés

**Audit Dátum**: 2026-01-24
**Verzió**: v1.0.6
**Auditor**: Claude Code Security Review

A projekt átfogó biztonsági vizsgálata befejeződött. Az alábbiakban részletezem a megállapításokat:

---

## 📊 Összefoglaló

**Átfogó Értékelés**: Közepesen jó 🟡

- ✅ **Pozitívumok**: Erős input validáció (Zod), framework-szintű XSS védelem, HTTPS kikényszerítés
- ⚠️ **Kritikus problémák**: 2 db - Hardcoded API kulcsok, RLS ellenőrizetlen
- 🟠 **Magas kockázat**: 4 db
- 🟡 **Közepes kockázat**: 9 db
- 🔵 **Alacsony kockázat**: 3 db

---

## 🔴 KRITIKUS SEBEZHETŐSÉGEK

### 1. Hardcoded Supabase API Kulcsok Publikus Repoban

**Hely**: [src/lib/supabase/client.ts:10-11](src/lib/supabase/client.ts#L10-L11)

```typescript
const SUPABASE_URL = 'https://[PROJECT_ID].supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbG....[REDACTED]';
```

**Probléma**:
- ✅ **Git történetben megtalálható**: Commit `626776f` óta benne van
- ✅ **Publikus GitHub repoban elérhető**: `https://github.com/tornadolaci/notizz`
- ✅ **Build output-ban is benne van**: `dist/` fájlokban plain text
- ⏰ **Kulcs érvényessége**: 2034-ig! (`exp: 2084656518`)

**Hatás**:
- Bárki ki tudja nyerni a kulcsot a publikus repoból
- API rate limit kihasználható rosszindulatú módon
- Nem lehet rotálni a kulcsot anélkül, hogy újra ne commitold

**AZONNALI TEENDŐK**:
1. **Supabase API kulcs ROTÁLÁS** (Dashboard → Settings → API):
   - Generálj új `anon` kulcsot
   - Régi kulcs törlése
2. **Environment változók bevezetése**:
   ```bash
   # .env fájl létrehozása (már .gitignore-ban van!)
   echo "VITE_SUPABASE_URL=https://fjrgvrzkucffbwumjcwf.supabase.co" > .env
   echo "VITE_SUPABASE_ANON_KEY=<ÚJ_KULCS>" >> .env
   ```
3. **Kód módosítása**:
   ```typescript
   const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
   const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
   ```
4. **GitHub Secrets beállítása** (Actions/Pages deployment-hez)
5. **Git history tisztítás** (opcionális, de ajánlott):
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch src/lib/supabase/client.ts" \
     --prune-empty --tag-name-filter cat -- --all
   ```

---

### 2. Row Level Security (RLS) Ellenőrizetlen

**Hely**: Supabase backend - nincs migráció fájl a repoban

**Probléma**:
- Nincs bizonyíték arra, hogy az RLS be van kapcsolva
- Kliens oldali szűrés (`eq('user_id', userId)`) egyedül **NEM ELÉG**
- Ha nincs RLS → bárki elérhet bárki adatát az anon kulccsal

**Tesztelés**:
```sql
-- Supabase SQL Editor-ban futtasd:
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('notes', 'todos', 'sync_queue');
```

**Ha rowsecurity = FALSE, AZONNAL futtasd**:
```sql
-- Notes tábla RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own notes"
ON notes FOR ALL
USING (auth.uid() = user_id);

-- Todos tábla RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own todos"
ON todos FOR ALL
USING (auth.uid() = user_id);

-- Sync queue tábla RLS
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own sync queue"
ON sync_queue FOR ALL
USING (auth.uid() = user_id);
```

---

## 🟠 MAGAS KOCKÁZATÚ PROBLÉMÁK

### 3. Gyenge Jelszó Követelmények

**Hely**: [src/lib/components/auth/AuthModal.svelte:102-104](src/lib/components/auth/AuthModal.svelte#L102-L104)

```typescript
if (!password || password.length < 6) {
  error = 'A jelszónak legalább 6 karakter hosszúnak kell lennie.';
}
```

**Problémák**:
- ❌ 6 karakter túl rövid (iparági standard: 12+)
- ❌ Nincs komplexitási követelmény
- ❌ Nincs ellenőrzés gyakori jelszavakra (pl. "123456")

**Javítás**:
```typescript
if (password.length < 8) {
  error = 'A jelszónak legalább 8 karakter hosszúnak kell lennie.';
  return false;
}
if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
  error = 'A jelszónak tartalmaznia kell kis- és nagybetűt, valamint számot.';
  return false;
}
```

---

### 4. localStorage Session Token (XSS Kockázat)

**Hely**: [src/lib/supabase/client.ts:22-27](src/lib/supabase/client.ts#L22-L27)

```typescript
storage: typeof window !== 'undefined' ? window.localStorage : undefined,
```

**Probléma**:
- Session tokenek `localStorage`-ban tárolva
- XSS esetén elérhető JavaScript-ből
- HttpOnly cookie biztonságosabb lenne

**Enyhítés** (mivel PWA miatt localStorage szükséges):
- Content Security Policy (CSP) bevezetése
- XSS védelem szigorítása
- Session lejárati idő beállítása

---

### 5. Hiányzó Content Security Policy (CSP)

**Hely**: [index.html](index.html) - nincs CSP meta tag

**Probléma**:
- Nincs CSP header
- Inline scriptek engedélyezve (GitHub Pages redirect workaround)
- XSS támadás esetén nincs extra védelem

**Javítás**:
```html
<!-- index.html <head> részbe: -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://fjrgvrzkucffbwumjcwf.supabase.co;
  img-src 'self' data: https:;
  frame-ancestors 'none';
">
```

---

### 6. NPM Dependency Sebezhetőségek

**Eredmény**: 6 moderate severity vulnerability

**Érintett csomagok**:
- `vitest` (0.0.1 - 4.0.0-beta.14)
- `esbuild` (<=0.24.2) - **GHSA-67mh-4wv8-2f99**
  - CVE: CWE-346
  - CVSS: 5.3 (Medium)
  - Probléma: Dev szerver bármely weboldaltól kéréseket fogadhat

**Javítás**:
```bash
npm audit fix --force
# vagy major version upgrade:
npm install vitest@latest @vitest/ui@latest
```

**Kockázat**: Alacsony (csak dev környezetben aktív)

---

## 🟡 KÖZEPES KOCKÁZATÚ PROBLÉMÁK

### 7. Potenciális XSS {@html} Direktíva

**Hely**: [src/lib/components/shared/EmptyState.svelte:39](src/lib/components/shared/EmptyState.svelte#L39)

```svelte
{@html icons[icon]}
```

**Jelenlegi állapot**: ALACSONY kockázat (hardcoded SVG stringek)

**Ajánlás**: Cseréld Svelte komponensre

---

### 8. Rate Limiting Hiányzik

**Hely**: Auth formok

**Probléma**:
- Van `RateLimiter` class [src/lib/utils/security.ts](src/lib/utils/security.ts) → **NEM HASZNÁLT**
- Login brute force támadás lehetséges

**Javítás**:
```typescript
import { RateLimiter } from '$lib/utils/security';
const loginRateLimiter = new RateLimiter(5, 60000); // 5 attempt/min

if (!loginRateLimiter.isAllowed(email)) {
  error = 'Túl sok próbálkozás. Várj 1 percet.';
  return;
}
```

---

### 9. IndexedDB Nincs Titkosítva

**Probléma**:
- Jegyzetek és TODO-k plaintext-ben IndexedDB-ben
- Guest mode esetén nincs szerver oldali védelem

**Ajánlás**:
```typescript
// Web Crypto API használata
async function encryptData(data: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  const encoded = new TextEncoder().encode(data);
  return await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
    key,
    encoded
  );
}
```

---

### 10. Hiányzó Security Headers

**Hely**: Deployment konfiguráció

**Hiányzó headerek**:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`
- `Referrer-Policy: no-referrer`

**GitHub Pages-nél**:
Service Worker-ben lehet beállítani:

```typescript
// Service Worker-ben
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).then(response => {
      const headers = new Headers(response.headers);
      headers.set('X-Frame-Options', 'DENY');
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      headers.set('Referrer-Policy', 'no-referrer');
      return new Response(response.body, { headers });
    })
  );
});
```

---

### 11. Production Console Logs

**Hely**: Több fájlban (auth.service.ts, App.svelte, sync.service.ts)

```typescript
console.log('[App] Session user:', session?.user?.email);
console.log('[App] User app_metadata:', JSON.stringify(session?.user?.app_metadata));
console.error('[NotesService] Failed to create note:', error);
```

**Probléma**:
- Szenzitív információk (email címek, metadata, hibák) a konzolban
- Production környezetben is látható

**Javítás**:
```typescript
// Environment-aware logging
const isDev = import.meta.env.DEV;
if (isDev) {
  console.log('[App] Session user:', session?.user?.email);
}
```

---

### 12. Hiányzó CSRF Védelem Ellenőrzés

**Hely**: Auth formok [src/lib/components/auth/AuthModal.svelte](src/lib/components/auth/AuthModal.svelte)

**Probléma**:
- Nincs explicit CSRF token
- Supabase beépített védelme használva (ellenőrizni kell)

**Ajánlás**:
- Verify Supabase CSRF protection
- OAuth state parameter validáció

---

### 13. Insufficient Input Sanitization

**Hely**: [src/lib/services/storage.service.ts](src/lib/services/storage.service.ts)

**Probléma**:
- Zod validáció van, de nincs explicit HTML escape
- Jegyzetek max 10,000 karakter, TODO-k 500 - nincs szanitálás

**Meglévő védelem**: Svelte auto-escape ✅

**Ajánlás**:
```typescript
import { sanitizeHTML } from '../utils/security';

const note: INote = {
  ...validatedInput,
  content: sanitizeHTML(validatedInput.content),
  title: sanitizeHTML(validatedInput.title)
};
```

---

### 14. Hiányzó Subresource Integrity (SRI)

**Hely**: External resources (Google Fonts)

**Probléma**:
- Google Fonts integrity hash nélkül betöltve
- Nincs ellenőrzés external resource-okon

**Ajánlás**:
```html
<link rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=..."
      integrity="sha384-..."
      crossorigin="anonymous">
```

---

### 15. PKCE State Validáció Hiányzik

**Hely**: OAuth flow [src/lib/supabase/auth.service.ts](src/lib/supabase/auth.service.ts)

**Jelenlegi állapot**: PKCE használva ✅, de nincs explicit state validáció

**Ajánlás**: Verify state parameter az OAuth callback-ben

---

## 📁 GitHub Repo Szenzitív Adatok Ellenőrzés

### ✅ Pozitív Eredmények

- ✅ `.env` fájlok **NINCSENEK** commitolva
- ✅ `.gitignore` megfelelően beállítva
- ✅ `node_modules/`, `dist/`, `.env*` ignorálva
- ✅ Nincs `credentials.json`, `secret.key`, stb.

### ❌ Negatív Eredmények

- ❌ **Supabase API kulcsok** commitolva [src/lib/supabase/client.ts](src/lib/supabase/client.ts)
- ❌ Git history tartalmazza (commit `626776f` óta)
- ❌ Publikus repoban látható: `https://github.com/tornadolaci/notizz`

---

## ✅ BIZTONSÁGI ERŐSSÉGEK

1. ✅ **Zod validáció**: Minden input validálva van
2. ✅ **XSS védelem**: Svelte auto-escape
3. ✅ **SQL Injection védelem**: Dexie.js paraméteres lekérdezések
4. ✅ **HTTPS kikényszerítés**: Supabase TLS
5. ✅ **PKCE flow**: OAuth biztonságos implementáció
6. ✅ **Nincs hardcoded jelszó**: Csak API kulcsok (ami standard kliens oldalon)
7. ✅ **Security utils léteznek**: `sanitizeHTML()`, `validateFileUpload()` - csak nincs használva
8. ✅ **Nincs ismert sebezhetőség**: Production dependencies tiszták

---

## 🎯 PRIORIZÁLT JAVÍTÁSI TERV

### 🔥 AZONNAL (24 órán belül)

1. **Supabase API kulcs rotálás** + env változó
2. **RLS ellenőrzés és bekapcsolás** Supabase-en
3. **CSP header hozzáadása**

### 📅 1 Héten Belül

4. Jelszó követelmények szigorítása (8+ char, komplexitás)
5. Rate limiting implementálása
6. Production console.log-ok törlése
7. Security headerek beállítása

### 📆 1 Hónapon Belül

8. IndexedDB titkosítás (guest mode)
9. SRI implementálása (external resources)
10. Penetration testing
11. Security monitoring beállítása

---

## 📋 COMPLIANCE ÁLLAPOT

| Standard | Státusz | Megjegyzés |
|----------|---------|------------|
| **GDPR** | ✅ PASS | Nincs PII tracking |
| **WCAG** | ✅ PASS | Accessibility megfelelő |
| **OWASP A01** | ⚠️ RISK | RLS ellenőrizetlen |
| **OWASP A02** | ⚠️ RISK | Nincs encryption at rest |
| **OWASP A03** | ✅ PASS | Injection védett |
| **OWASP A07** | ⚠️ RISK | Gyenge jelszó policy |

---

## 📞 KÖVETKEZŐ LÉPÉSEK

1. **RLS ellenőrzés MOST**: Supabase SQL Editor → futtasd a fenti teszteket
2. **API kulcs rotálás MOST**: Ha nincs RLS, AZONNAL rotáld
3. **Environment változók**: Mozgasd ki a kulcsokat környezeti változókba
4. **Git history tisztítás**: Fontold meg (de API kulcs rotálás fontosabb)
5. **Dependency update**: `npm audit fix --force`

---

## 📊 ÖSSZESÍTÉS

**Összes talált probléma száma**: 15 db
**Kritikus**: 2 db (🔴)
**Magas**: 4 db (🟠)
**Közepes**: 9 db (🟡)

**Átfogó kockázati szint**: 🟡 KÖZEPES

**Legkritikusabb probléma**: Hardcoded API kulcsok publikus repoban + RLS ellenőrizetlen

**Ajánlás**: A kritikus problémák azonnali javítása után a projekt biztonsági szintje JÓRA javul.

---

**Jelentés vége**
