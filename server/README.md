# Notizz Backend — PHP 8.3 + MySQL 8 API

REST API a Notizz PWA-hoz. Vanilla PHP (függőség nélkül), PDO + prepared
statements, opaque Bearer token auth. Részletek: [php-mysql-migration-plan.md](../php-mysql-migration-plan.md).

## Könyvtárszerkezet

```
server/
├── api/                  ← ez kerül a szerverre: /public_html/app/notizz/api/
│   ├── index.php         ← front controller (routing, bootstrap)
│   ├── .htaccess         ← rewrite + Authorization header + no-cache
│   └── src/              ← Database, Auth, Mailer, RateLimit, controllerek
├── migrations/           ← verziózott SQL migrációk
├── config.example.php    ← konfig sablon (placeholder értékekkel)
├── config.php            ← LOKÁLIS dev konfig (gitignored!)
├── dev-router.php        ← PHP beépített szerverhez
└── tests/smoke.sh        ← teljes auth + CRUD smoke teszt
```

## Lokális fejlesztés

Előfeltétel: PHP 8.3+, futó MySQL szerver (root, jelszó nélkül).

```bash
# 1. Konfig (első alkalommal): a config.example.php másolása és kitöltése
cp server/config.example.php server/config.php   # db: notizz_dev/root, smtp driver: 'log'

# 2. API szerver indítása
php -S localhost:8080 server/dev-router.php

# 3. Smoke teszt (friss notizz_dev adatbázist hoz létre!)
bash server/tests/smoke.sh
```

Lokálisan az emailek nem kerülnek kiküldésre: a `smtp.driver = 'log'` beállítással
a `server/mail.log` fájlba íródnak (a verify/reset linkek innen másolhatók ki).

## Konfiguráció betöltési sorrend

1. `NOTIZZ_CONFIG` környezeti változó (explicit útvonal)
2. `server/config.php` (lokális dev, gitignored)
3. `<docroot szülőkönyvtára>/notizz_config/config.php` (éles szerver)

**Élesben a config.php a docroot-on KÍVÜL van, jelszavak SOHA nem kerülnek a repóba.**

## API áttekintés

Auth (token nélkül): `POST auth/register`, `POST auth/login`,
`GET auth/verify-email?token=`, `POST auth/password-reset-request`,
`POST auth/password-reset`

Auth (Bearer token): `GET auth/me`, `POST auth/logout`

Adatok (Bearer token, a user_id a tokenből jön): `GET|POST notes`,
`PATCH|PUT|DELETE notes/{id}`, ugyanígy `todos`.

`GET health` — monitorozáshoz.

## Kritikus szabályok

- **updatedAt-et SOHA nem generál a szerver** — azt tárolja, amit a kliens küld.
  Order-only PATCH (updatedAt nélkül) nem érinti az updated_at oszlopot.
- Minden dátum DATETIME(3) (milliszekundum!), UTC-ben tárolva, ISO 8601-ként
  (`2026-07-01T10:30:00.123Z`) utazik.
- A DB oszlop `sort_order` (az `order` foglalt szó), az API JSON-ban `order`.
- A `todos.items` JSON-ben az item `createdAt` ISO string marad.
- Hibaválaszok stabil kódokkal (`invalid_credentials`, `email_not_confirmed`,
  `email_taken`, `rate_limited`, ...) — a magyar üzeneteket a kliens rendeli hozzá.

## Éles telepítés (4. fázis)

1. MySQL adatbázis létrehozás + `migrations/001_init.sql` futtatás
2. `api/` könyvtár feltöltése: `/public_html/app/notizz/api/`
3. `config.example.php` alapján `config.php` létrehozása a
   `/notizz_config/` könyvtárban (docroot-on kívül), éles adatokkal
   (DB + SMTP: mail.nomadnet.hu:465 SSL)
4. Ellenőrzés: `https://nomadnet.hu/app/notizz/api/health` → `{"status":"ok"}`
