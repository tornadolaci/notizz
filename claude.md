# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Notizz** - A modern note and TODO list manager Progressive Web App (PWA) with iOS-inspired design.

- **Frontend**: Svelte 5 (Runes) + Vite + TypeScript
- **Backend**: Dependency-free PHP 8.3+ REST API + MySQL 8 ([server/](server/))
- **Auth**: Login-only (email/password with email verification); opaque Bearer tokens
- **Hosting**: https://nomadnet.hu/app/notizz/ (subdirectory! base path `/app/notizz/`)
- **UI Language**: Hungarian
- **Code Language**: English (code, comments, types)
- **Repository**: https://github.com/tornadolaci/notizz (public - NEVER commit secrets)

## Development Commands

```bash
npm run dev              # Vite dev server (proxies /app/notizz/api to localhost:8080)
php -S localhost:8080 server/dev-router.php   # Local PHP API (needs MySQL + server/config.php)
npm run build            # Production build + type checking
npm run preview          # Preview production build (also proxies the API)
npm run type-check       # TypeScript type checking only
npm run lint             # ESLint
npm run format           # Prettier
npm run test:unit        # Vitest unit tests
npm run test:e2e         # Playwright E2E (starts PHP + vite on port 5199; needs MySQL)
bash server/tests/smoke.sh   # Backend smoke suite (recreates the notizz_dev database!)
```

### Local backend setup (first time)
1. Running MySQL (root, no password) - the smoke test creates `notizz_dev`
2. `cp server/config.example.php server/config.php` (gitignored; smtp driver `'log'`
   writes emails to `server/mail.log` instead of sending)

### Testing notes
- E2E: 3 projects (Desktop Chrome, Pixel 5, iPhone 13) + a `setup` project that
  logs in a shared test account via the API and saves a storage state.
  Tests run serially (`workers: 1`) because they share one account.
- E2E data reset happens through the API (`tests/e2e/helpers.ts` resetData).
- The TODO editor has `#todo-title` only in CREATE mode; in edit mode wait for
  `getByRole('checkbox')` instead.

## Architecture Overview

### Data flow (auth-only, server-side storage)
```
UI -> stores (optimistic update) -> $lib/api services -> PHP API -> MySQL
                                          ^
              10s polling (sync.service) -+-> change detection -> notifications
```
- There is NO local data storage (no IndexedDB/Dexie, no guest mode).
- Offline: app shell loads from SW cache, reads yield empty lists, writes throw
  a Hungarian error; data reloads on the `online` event.

### API module ([src/lib/api/](src/lib/api/))
- `client.ts` - fetch wrapper; base URL `${import.meta.env.BASE_URL}api`;
  token in localStorage (`notizz_auth_token`); sends BOTH `Authorization: Bearer`
  and `X-Auth-Token` headers (the hosting Apache strips Authorization!);
  401 clears the token and notifies the auth store.
- `auth.service.ts` - register/login/logout/me/reset; maps stable backend error
  codes (`invalid_credentials`, `email_taken`, ...) to Hungarian messages.
- `data.service.ts` - ApiNotesService/ApiTodosService CRUD; ISO 8601 dates with
  milliseconds; todo items[].createdAt stays an ISO string in transport and is
  normalized to Date on read.
- `sync.service.ts` - 10s polling (sole sync mechanism), updatedAt-based change
  detection, native+toast notifications, sync status for the header icon,
  local-modification tracking (15s TTL) to avoid self-notifications.
  Polling sessions are generation-counted: stopPolling invalidates in-flight
  sessions so a logout can never leak a running interval.

### Auth gate
[src/routes/+layout.svelte](src/routes/+layout.svelte): unauthenticated users see
the full-page [AuthGate](src/lib/components/auth/AuthGate.svelte) instead of the
app. `/reset-password` stays public (email links land there with a one-time
token in the hash query). The auth $effect is idempotent (tracks syncUserId).

### Backend ([server/](server/), deployed to /public_html/app/notizz/api/)
- Front controller `api/index.php`; controllers in `api/src/controllers/`.
- Config lookup: `NOTIZZ_CONFIG` env -> `server/config.php` (local dev) ->
  `<docroot parent>/notizz_config/config.php` (production, OUTSIDE the docroot).
- Tokens stored as SHA-256 hashes; never expire (logout/password reset revokes).
- Rate limiting on auth endpoints (5 attempts / 15 min).
- Full docs: [server/README.md](server/README.md)

### State management (stores)
- Writable store + derived stores + action methods; optimistic updates.
- `setNotes`/`setTodos` (polling callbacks) bail out when unauthenticated.
- Settings/theme live in localStorage (device preferences, not user data).

### Routing
- Tinro in hash mode. Share target opens `<base>/share-target` -> main.ts
  rewrites it to the hash route with the query params.

## CRITICAL data rules (breaking these corrupts sorting/sync)

1. **The server NEVER generates updatedAt** - it stores what the client sends.
   Order-only updates (PATCH with just `order`) must NOT touch updatedAt,
   otherwise manual card reordering breaks.
2. **Sorting uses ONLY the `order` field** (BIGINT; DB column `sort_order`
   because `order` is a reserved word; API JSON uses `order`).
3. **Millisecond precision everywhere**: MySQL DATETIME(3), ISO strings with
   milliseconds - change detection compares `updatedAt.getTime()`.
4. New items get `minOrder - 1000` (top of the list); first item `Date.now()`.
5. Always update BOTH items' order when swapping (up/down buttons).
6. Register a local modification BEFORE the API call (self-notification guard).
7. `toggleItem` sends updatedAt too, so other devices detect the change.

## Design System

**Critical**: All UI must follow [design-system.md](design-system.md).

- iOS-inspired: glassmorphism, pastel colors, smooth animations
- Mobile-first responsive grid (1 -> 2 -> 3 columns; breakpoints 375/640/1024px)
- Design tokens: CSS custom properties only; light/dark via `[data-theme="dark"]`
  (the attribute lives on `<html>`, so component CSS uses `:global([data-theme="dark"])`)
- 8 pastel colors (INote/ITodo.color stores the HEX value, e.g. '#FFFACD';
  keys/names in [src/lib/constants/colors.ts](src/lib/constants/colors.ts))
- Cards: 20px radius; grid handles sizing - never set explicit widths on grid children
- Accessibility: WCAG AAA contrast, ARIA labels, keyboard nav, 44x44px touch targets
- Scrollbars are globally hidden (native app feel); scrolling itself must keep working
- Mobile scroll rules: never `overscroll-behavior-y: none`; html/body use
  `overflow-y: scroll`; avoid flex+100vh on scroll containers

## Hosting & Deploy

- Fixed base path `/app/notizz/` (vite base, manifest start_url/scope,
  share_target action). The PWA scope is the subdirectory.
- [public/.htaccess](public/.htaccess) ships with the build: HTTPS redirect,
  API rewrite, SPA fallback, cache rules (hashed assets immutable;
  index.html/sw.js/manifest no-cache - REQUIRED for the PWA update flow).
- Deploy: GitHub Actions "Deploy to nomadnet.hu" (manual trigger) builds and
  uploads dist/ + server/api/ via FTPS. Secrets: DEPLOY_FTP_HOST/USER/PASSWORD/
  TARGET_DIR. Production config.php and MySQL schema are one-time manual steps.
- The old GitHub Pages URL serves a redirect page (pages-redirect/) with a
  self-destroying sw.js; deployed by the "Deploy redirect page" workflow.
- The Settings screen "version" is the build date (YY.MM.DD), generated in
  vite.config.ts as `__APP_VERSION__`.

## Critical Rules

1. **Never modify design tokens** - use only colors/spacing from design-system.md
2. **Validate input** - client-side plus PHP-side validation for every endpoint
3. **Responsive breakpoints** - test at 375px, 768px, 1024px+
4. **Dark mode support** - all new components must work in both themes
5. **No console.log in production** code paths
6. **Never commit secrets** - the repo is public; server/config.php and
   server/mail.log are gitignored; CI secrets live in GitHub repo settings
7. **API responses must never be cached** - workbox NetworkOnly rule on /api/
8. **Quality gates before commit**: `npm run test:unit && npm run lint`

## Key Files Reference

- [design-system.md](design-system.md) - UI/UX specification (must read for UI work)
- [server/README.md](server/README.md) - backend architecture, API, deploy
- [php-mysql-migration-plan.md](php-mysql-migration-plan.md) - migration plan + log
- [vite.config.ts](vite.config.ts) - base path, PWA manifest, workbox, proxies
- [src/lib/api/index.ts](src/lib/api/index.ts) - API module exports
- [src/routes/+layout.svelte](src/routes/+layout.svelte) - auth gate + sync lifecycle
- [server/migrations/001_init.sql](server/migrations/001_init.sql) - DB schema

## Common Patterns

### Creating a new component
1. Place under components/ (auth/, common/, layout/, notes/, todos/, shared/)
2. Follow design-system.md (CSS variables only)
3. TypeScript props interface; ARIA labels; keyboard handlers
4. Test in light + dark themes and at all breakpoints

### Adding an API endpoint
1. Route in server/api/index.php; handler in the matching controller
2. Validate input server-side; use prepared statements; scope by user_id
3. camelCase JSON fields matching the frontend types
4. Add coverage to server/tests/smoke.sh
5. Mirror it in src/lib/api/data.service.ts (or auth.service.ts)

### Database schema changes
1. New file in server/migrations/ (numbered)
2. Update controllers + src/lib/api DTOs + src/lib/types
3. Remember: DATETIME(3), utf8mb4, user_id scoping, `sort_order` naming
