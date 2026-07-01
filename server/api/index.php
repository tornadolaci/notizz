<?php

declare(strict_types=1);

/**
 * Notizz API front controller.
 * All /api/* requests are rewritten here (.htaccess) or routed by the
 * dev router (php -S). Responses are JSON except verify-email (redirect).
 */

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

require __DIR__ . '/src/helpers.php';
require __DIR__ . '/src/Database.php';
require __DIR__ . '/src/Auth.php';
require __DIR__ . '/src/RateLimit.php';
require __DIR__ . '/src/Mailer.php';
require __DIR__ . '/src/controllers/AuthController.php';
require __DIR__ . '/src/controllers/NotesController.php';
require __DIR__ . '/src/controllers/TodosController.php';

set_exception_handler(function (Throwable $e): void {
    error_log('[notizz-api] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    // Never leak internals to the client
    json_error('server_error', 500);
});

/**
 * Locate config: env override → local dev file → production path outside docroot.
 */
$configPath = null;
foreach ([
    getenv('NOTIZZ_CONFIG') ?: null,
    __DIR__ . '/../config.php',                          // local dev (gitignored)
    dirname($_SERVER['DOCUMENT_ROOT'] ?? '/nonexistent') . '/notizz_config/config.php',
] as $candidate) {
    if ($candidate !== null && is_file($candidate)) {
        $configPath = $candidate;
        break;
    }
}
if ($configPath === null) {
    json_error('server_error', 500, 'Missing configuration');
}
$config = require $configPath;

$pdo = Database::get($config);
$auth = new Auth($pdo);
$mailer = new Mailer($config['smtp']);
$rateLimit = new RateLimit(
    $pdo,
    $config['security']['rate_limit_max_attempts'],
    $config['security']['rate_limit_window']
);

$authController = new AuthController($pdo, $auth, $mailer, $rateLimit, $config);
$notesController = new NotesController($pdo, $auth);
$todosController = new TodosController($pdo, $auth);

// Extract the path after the "api/" segment — works both at /api/... (dev)
// and /app/notizz/api/... (production subdirectory)
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$pos = strpos($uri, '/api/');
$path = $pos !== false ? trim(substr($uri, $pos + 5), '/') : '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// --- Auth routes ---
match (true) {
    $path === 'health' && $method === 'GET'
        => json_response(['status' => 'ok']),

    $path === 'auth/register' && $method === 'POST'
        => $authController->register(),
    $path === 'auth/login' && $method === 'POST'
        => $authController->login(),
    $path === 'auth/logout' && $method === 'POST'
        => $authController->logout(),
    $path === 'auth/me' && $method === 'GET'
        => $authController->me(),
    $path === 'auth/verify-email' && $method === 'GET'
        => $authController->verifyEmail(),
    $path === 'auth/password-reset-request' && $method === 'POST'
        => $authController->passwordResetRequest(),
    $path === 'auth/password-reset' && $method === 'POST'
        => $authController->passwordReset(),

    default => null,
};

// --- Collection routes ---
if ($path === 'notes') {
    match ($method) {
        'GET' => $notesController->list(),
        'POST' => $notesController->create(),
        default => json_error('method_not_allowed', 405),
    };
}
if ($path === 'todos') {
    match ($method) {
        'GET' => $todosController->list(),
        'POST' => $todosController->create(),
        default => json_error('method_not_allowed', 405),
    };
}

// --- Item routes: notes/{uuid}, todos/{uuid} ---
if (preg_match('#^(notes|todos)/([0-9a-f-]{36})$#i', $path, $m) === 1) {
    $controller = strtolower($m[1]) === 'notes' ? $notesController : $todosController;
    $id = strtolower($m[2]);
    if (!is_uuid($id)) {
        json_error('invalid_id', 400);
    }
    match ($method) {
        'PATCH' => $controller->update($id),
        'PUT' => $controller->upsert($id),
        'DELETE' => $controller->delete($id),
        default => json_error('method_not_allowed', 405),
    };
}

json_error('not_found', 404);
