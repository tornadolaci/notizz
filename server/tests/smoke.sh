#!/usr/bin/env bash
#
# Notizz API smoke test — exercises the full auth + CRUD flow against a
# locally running API (php -S localhost:8080 server/dev-router.php with the
# gitignored server/config.php pointing at the notizz_dev database).
#
# Usage: bash server/tests/smoke.sh
# Requires: mysql client (root, no password), curl, php.

set -u
API="http://localhost:8080/api"
DB="notizz_dev"
ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
MAIL_LOG="$ROOT_DIR/server/mail.log"
EMAIL="smoke+$(date +%s)@example.com"
PASS_WORD="titok123"
NEW_PASSWORD="ujtitok456"

PASS_COUNT=0
FAIL_COUNT=0

check() { # check <name> <condition-result (0/1)>
  if [ "$2" -eq 0 ]; then
    echo "  ✅ $1"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "  ❌ $1"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

jsonval() { # jsonval <json> <php-expr on $d>, prints value
  php -r '$d = json_decode(stream_get_contents(STDIN), true); echo '"$2"' ?? "";' <<< "$1"
}

echo "== Setup: fresh database =="
mysql -u root -e "DROP DATABASE IF EXISTS $DB; CREATE DATABASE $DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || exit 1
mysql -u root "$DB" < "$ROOT_DIR/server/migrations/001_init.sql" || exit 1
rm -f "$MAIL_LOG"

echo "== Health =="
R=$(curl -s "$API/health")
check "GET /health" "$([ "$(jsonval "$R" '$d["status"]')" = "ok" ]; echo $?)"

echo "== Register =="
R=$(curl -s -X POST "$API/auth/register" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS_WORD\"}")
check "register -> needsEmailConfirmation" "$([ "$(jsonval "$R" '$d["needsEmailConfirmation"] ? "1" : ""')" = "1" ]; echo $?)"

R=$(curl -s -X POST "$API/auth/register" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS_WORD\"}")
check "register duplicate -> email_taken" "$([ "$(jsonval "$R" '$d["error"]')" = "email_taken" ]; echo $?)"

R=$(curl -s -X POST "$API/auth/register" -H 'Content-Type: application/json' \
  -d '{"email":"rossz","password":"titok123"}')
check "register invalid email rejected" "$([ "$(jsonval "$R" '$d["error"]')" = "invalid_email" ]; echo $?)"

R=$(curl -s -X POST "$API/auth/register" -H 'Content-Type: application/json' \
  -d '{"email":"masik@example.com","password":"abc"}')
check "register short password rejected" "$([ "$(jsonval "$R" '$d["error"]')" = "password_too_short" ]; echo $?)"

echo "== Login before verification =="
R=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS_WORD\"}")
check "login unverified -> email_not_confirmed" "$([ "$(jsonval "$R" '$d["error"]')" = "email_not_confirmed" ]; echo $?)"

echo "== Email verification =="
VERIFY_TOKEN=$(grep -o 'verify-email?token=[0-9a-f]*' "$MAIL_LOG" | tail -1 | cut -d= -f2)
check "verify token found in mail log" "$([ -n "$VERIFY_TOKEN" ]; echo $?)"
HTTP=$(curl -s -o /dev/null -w '%{http_code}' "$API/auth/verify-email?token=$VERIFY_TOKEN")
check "verify-email redirects (302)" "$([ "$HTTP" = "302" ]; echo $?)"

echo "== Login =="
R=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"rosszjelszo\"}")
check "login wrong password -> invalid_credentials" "$([ "$(jsonval "$R" '$d["error"]')" = "invalid_credentials" ]; echo $?)"

R=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS_WORD\"}")
TOKEN=$(jsonval "$R" '$d["token"]')
USER_ID=$(jsonval "$R" '$d["user"]["id"]')
check "login returns token" "$([ -n "$TOKEN" ]; echo $?)"
check "login returns user id" "$([ -n "$USER_ID" ]; echo $?)"

AUTH="Authorization: Bearer $TOKEN"

R=$(curl -s "$API/auth/me" -H "$AUTH")
check "GET /auth/me" "$([ "$(jsonval "$R" '$d["user"]["email"]')" = "$EMAIL" ]; echo $?)"

R=$(curl -s "$API/auth/me")
check "GET /auth/me without token -> 401" "$([ "$(jsonval "$R" '$d["error"]')" = "unauthorized" ]; echo $?)"

echo "== Notes CRUD =="
NOTE_ID="11111111-2222-4333-8444-555555555555"
R=$(curl -s -X POST "$API/notes" -H "$AUTH" -H 'Content-Type: application/json' -d "{
  \"id\":\"$NOTE_ID\",\"title\":\"Próba jegyzet őűáé\",\"content\":\"Tartalom\",
  \"color\":\"#FFFACD\",\"order\":1000,
  \"createdAt\":\"2026-07-01T10:30:00.123Z\",\"updatedAt\":\"2026-07-01T10:30:00.123Z\"}")
check "create note" "$([ "$(jsonval "$R" '$d["id"]')" = "$NOTE_ID" ]; echo $?)"
check "note ms precision preserved" "$([ "$(jsonval "$R" '$d["updatedAt"]')" = "2026-07-01T10:30:00.123Z" ]; echo $?)"

# Order-only PATCH must NOT touch updatedAt
R=$(curl -s -X PATCH "$API/notes/$NOTE_ID" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"order":500}')
check "order-only patch keeps updatedAt" "$([ "$(jsonval "$R" '$d["updatedAt"]')" = "2026-07-01T10:30:00.123Z" ]; echo $?)"
check "order-only patch applies order" "$([ "$(jsonval "$R" '$d["order"]')" = "500" ]; echo $?)"

# Content PATCH with client-provided updatedAt
R=$(curl -s -X PATCH "$API/notes/$NOTE_ID" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"title":"Módosított cím","updatedAt":"2026-07-01T11:00:00.456Z"}')
check "content patch stores client updatedAt" "$([ "$(jsonval "$R" '$d["updatedAt"]')" = "2026-07-01T11:00:00.456Z" ]; echo $?)"

R=$(curl -s "$API/notes" -H "$AUTH")
check "list notes (1 item, hungarian chars ok)" "$([ "$(jsonval "$R" 'count($d) === 1 && $d[0]["title"] === "Módosított cím" ? "1" : ""')" = "1" ]; echo $?)"

R=$(curl -s -X POST "$API/notes" -H "$AUTH" -H 'Content-Type: application/json' -d "{
  \"id\":\"$NOTE_ID\",\"title\":\"dup\",\"content\":\"x\",\"color\":\"#FFFACD\",\"order\":1,
  \"createdAt\":\"2026-07-01T10:30:00.000Z\",\"updatedAt\":\"2026-07-01T10:30:00.000Z\"}")
check "duplicate note id -> conflict" "$([ "$(jsonval "$R" '$d["error"]')" = "conflict" ]; echo $?)"

R=$(curl -s -X POST "$API/notes" -H "$AUTH" -H 'Content-Type: application/json' -d "{
  \"id\":\"99999999-2222-4333-8444-555555555555\",\"title\":\"x\",\"content\":\"x\",
  \"color\":\"piros\",\"order\":1,
  \"createdAt\":\"2026-07-01T10:30:00.000Z\",\"updatedAt\":\"2026-07-01T10:30:00.000Z\"}")
check "invalid color rejected" "$([ "$(jsonval "$R" '$d["error"]')" = "invalid_color" ]; echo $?)"

# Upsert (PUT)
R=$(curl -s -X PUT "$API/notes/$NOTE_ID" -H "$AUTH" -H 'Content-Type: application/json' -d "{
  \"id\":\"$NOTE_ID\",\"title\":\"Upsertelt\",\"content\":\"új\",\"color\":\"#E6E6FA\",\"order\":42,
  \"createdAt\":\"2026-07-01T10:30:00.123Z\",\"updatedAt\":\"2026-07-01T12:00:00.789Z\"}")
check "upsert note" "$([ "$(jsonval "$R" '$d["title"]')" = "Upsertelt" ]; echo $?)"

echo "== Todos CRUD =="
TODO_ID="aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"
R=$(curl -s -X POST "$API/todos" -H "$AUTH" -H 'Content-Type: application/json' -d "{
  \"id\":\"$TODO_ID\",\"title\":\"Bevásárlás\",
  \"items\":[{\"id\":\"i1\",\"text\":\"Kenyér\",\"completed\":false,\"createdAt\":\"2026-07-01T09:00:00.000Z\"},
             {\"id\":\"i2\",\"text\":\"Tej\",\"completed\":true,\"createdAt\":\"2026-07-01T09:01:00.000Z\"}],
  \"color\":\"#B2DFDB\",\"order\":2000,\"completedCount\":1,\"totalCount\":2,
  \"createdAt\":\"2026-07-01T09:00:00.000Z\",\"updatedAt\":\"2026-07-01T09:00:00.500Z\"}")
check "create todo" "$([ "$(jsonval "$R" '$d["id"]')" = "$TODO_ID" ]; echo $?)"
check "todo items roundtrip" "$([ "$(jsonval "$R" 'count($d["items"]) === 2 && $d["items"][1]["completed"] === true ? "1" : ""')" = "1" ]; echo $?)"
check "todo item createdAt stays ISO string" "$([ "$(jsonval "$R" '$d["items"][0]["createdAt"]')" = "2026-07-01T09:00:00.000Z" ]; echo $?)"

R=$(curl -s -X PATCH "$API/todos/$TODO_ID" -H "$AUTH" -H 'Content-Type: application/json' -d "{
  \"items\":[{\"id\":\"i1\",\"text\":\"Kenyér\",\"completed\":true,\"createdAt\":\"2026-07-01T09:00:00.000Z\"}],
  \"completedCount\":1,\"totalCount\":1,\"updatedAt\":\"2026-07-01T09:30:00.000Z\"}")
check "patch todo items+counts" "$([ "$(jsonval "$R" '$d["totalCount"]')" = "1" ]; echo $?)"

R=$(curl -s -X PATCH "$API/todos/$TODO_ID" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"order":100}')
check "todo order-only patch keeps updatedAt" "$([ "$(jsonval "$R" '$d["updatedAt"]')" = "2026-07-01T09:30:00.000Z" ]; echo $?)"

echo "== User isolation =="
EMAIL2="smoke2+$(date +%s)@example.com"
curl -s -X POST "$API/auth/register" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL2\",\"password\":\"$PASS_WORD\"}" > /dev/null
VERIFY2=$(grep -o 'verify-email?token=[0-9a-f]*' "$MAIL_LOG" | tail -1 | cut -d= -f2)
curl -s -o /dev/null "$API/auth/verify-email?token=$VERIFY2"
R=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL2\",\"password\":\"$PASS_WORD\"}")
TOKEN2=$(jsonval "$R" '$d["token"]')
R=$(curl -s "$API/notes" -H "Authorization: Bearer $TOKEN2")
check "user2 sees no notes of user1" "$([ "$(jsonval "$R" 'count($d)')" = "0" ]; echo $?)"
R=$(curl -s -X DELETE "$API/notes/$NOTE_ID" -H "Authorization: Bearer $TOKEN2")
NOTE_STILL=$(curl -s "$API/notes" -H "$AUTH")
check "user2 cannot delete user1's note" "$([ "$(jsonval "$NOTE_STILL" 'count($d)')" = "1" ]; echo $?)"
R=$(curl -s -X PUT "$API/notes/$NOTE_ID" -H "Authorization: Bearer $TOKEN2" -H 'Content-Type: application/json' -d "{
  \"id\":\"$NOTE_ID\",\"title\":\"HACKELT\",\"content\":\"x\",\"color\":\"#E6E6FA\",\"order\":1,
  \"createdAt\":\"2026-07-01T10:30:00.123Z\",\"updatedAt\":\"2026-07-01T13:00:00.000Z\"}")
NOTE_CHECK=$(curl -s "$API/notes" -H "$AUTH")
check "user2 upsert cannot overwrite user1's note" "$([ "$(jsonval "$NOTE_CHECK" '$d[0]["title"]')" = "Upsertelt" ]; echo $?)"

echo "== Password reset =="
curl -s -X POST "$API/auth/password-reset-request" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\"}" > /dev/null
RESET_TOKEN=$(grep -o 'reset-password?token=[0-9a-f]*' "$MAIL_LOG" | tail -1 | cut -d= -f2)
check "reset token found in mail log" "$([ -n "$RESET_TOKEN" ]; echo $?)"

R=$(curl -s -X POST "$API/auth/password-reset" -H 'Content-Type: application/json' \
  -d "{\"token\":\"$RESET_TOKEN\",\"newPassword\":\"$NEW_PASSWORD\"}")
check "password reset succeeds" "$([ "$(jsonval "$R" '$d["success"] ? "1" : ""')" = "1" ]; echo $?)"

R=$(curl -s "$API/auth/me" -H "$AUTH")
check "old token revoked after reset" "$([ "$(jsonval "$R" '$d["error"]')" = "unauthorized" ]; echo $?)"

R=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$NEW_PASSWORD\"}")
TOKEN=$(jsonval "$R" '$d["token"]')
check "login with new password" "$([ -n "$TOKEN" ]; echo $?)"

echo "== Logout =="
R=$(curl -s -X POST "$API/auth/logout" -H "Authorization: Bearer $TOKEN")
check "logout" "$([ "$(jsonval "$R" '$d["success"] ? "1" : ""')" = "1" ]; echo $?)"
R=$(curl -s "$API/auth/me" -H "Authorization: Bearer $TOKEN")
check "token invalid after logout" "$([ "$(jsonval "$R" '$d["error"]')" = "unauthorized" ]; echo $?)"

echo "== Rate limiting =="
for i in 1 2 3 4 5 6 7; do
  RL=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"password\":\"rossz\"}")
done
check "6+ failed logins -> rate_limited" "$([ "$(jsonval "$RL" '$d["error"]')" = "rate_limited" ]; echo $?)"

echo ""
echo "=============================="
echo "PASS: $PASS_COUNT  FAIL: $FAIL_COUNT"
echo "=============================="
[ "$FAIL_COUNT" -eq 0 ]
