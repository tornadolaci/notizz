<?php

// Diagnostic probe: runs on any PHP version. Reports the runtime and which
// auth header channels survive the server config (names only, no values).
header('Content-Type: application/json');

$authVars = array();
foreach (array_keys($_SERVER) as $key) {
    if (stripos($key, 'AUTH') !== false) {
        $authVars[] = $key;
    }
}

$getallheadersAuth = false;
if (function_exists('getallheaders')) {
    foreach (getallheaders() as $name => $value) {
        if (strcasecmp((string) $name, 'Authorization') === 0) {
            $getallheadersAuth = true;
            break;
        }
    }
}

echo json_encode(array(
    'php' => PHP_VERSION,
    'authServerVars' => $authVars,
    'getallheadersAuthorization' => $getallheadersAuth,
));
