<?php

declare(strict_types=1);

/**
 * Shared helpers: JSON I/O, date conversion, validation primitives.
 */

/**
 * Send a JSON response and terminate.
 */
function json_response(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Send a JSON error response and terminate.
 * $code is a stable machine-readable identifier the client maps to Hungarian messages.
 */
function json_error(string $code, int $status, string $message = ''): never
{
    json_response(['error' => $code, 'message' => $message], $status);
}

/**
 * Read and decode the JSON request body (max 2 MB).
 */
function json_input(): array
{
    $raw = file_get_contents('php://input', length: 2 * 1024 * 1024);
    if ($raw === false || $raw === '') {
        json_error('invalid_json', 400);
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        json_error('invalid_json', 400);
    }
    return $data;
}

/**
 * ISO 8601 (client, "2026-07-01T10:30:00.000Z") → MySQL DATETIME(3) in UTC.
 * Millisecond precision must survive: the client compares updatedAt with getTime().
 */
function iso_to_sql(string $iso): ?string
{
    try {
        $dt = new DateTimeImmutable($iso);
    } catch (Exception) {
        return null;
    }
    return $dt->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s.v');
}

/**
 * MySQL DATETIME(3) (stored as UTC) → ISO 8601 with milliseconds.
 */
function sql_to_iso(string $sql): string
{
    $dt = new DateTimeImmutable($sql, new DateTimeZone('UTC'));
    return $dt->format('Y-m-d\TH:i:s.v') . 'Z';
}

/**
 * Current time as MySQL DATETIME(3) UTC string.
 */
function now_sql(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d H:i:s.v');
}

function is_uuid(string $value): bool
{
    return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $value) === 1;
}

function is_valid_email(string $value): bool
{
    return filter_var($value, FILTER_VALIDATE_EMAIL) !== false && strlen($value) <= 255;
}

function is_valid_color(string $value): bool
{
    return preg_match('/^#[0-9a-f]{6}$/i', $value) === 1;
}

/**
 * Validate an incoming order value (JS number, must fit BIGINT).
 */
function is_valid_order(mixed $value): bool
{
    return (is_int($value) || is_float($value)) && abs($value) < 9.2e18;
}

function client_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}
