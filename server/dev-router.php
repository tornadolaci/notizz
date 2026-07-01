<?php

declare(strict_types=1);

/**
 * Dev router for PHP's built-in server:
 *   php -S localhost:8080 server/dev-router.php
 * Routes any path containing /api/ to the front controller.
 */

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

if (str_contains($uri, '/api/')) {
    require __DIR__ . '/api/index.php';
    return true;
}

http_response_code(404);
header('Content-Type: application/json');
echo '{"error":"not_found"}';
return true;
