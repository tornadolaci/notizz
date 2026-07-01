<?php

/**
 * Notizz API configuration — EXAMPLE.
 *
 * Production: copy to a directory OUTSIDE the docroot
 * (e.g. /notizz_config/config.php) and fill in the real credentials.
 * Local dev: copy to server/config.php (gitignored).
 *
 * NEVER commit real credentials — the repository is public.
 */

return [
    'db' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'name' => 'notizz',
        'user' => 'notizz',
        'pass' => 'CHANGE_ME',
        'charset' => 'utf8mb4',
    ],

    'smtp' => [
        // 'smtp' = real sending, 'log' = write emails to log_file (local dev)
        'driver' => 'smtp',
        'host' => 'mail.nomadnet.hu',
        'port' => 465, // implicit SSL/TLS
        'user' => 'nomad@nomadnet.hu',
        'pass' => 'CHANGE_ME',
        'from' => 'nomad@nomadnet.hu',
        'from_name' => 'Notizz',
        'log_file' => __DIR__ . '/mail.log',
    ],

    'app' => [
        // Public base URL of the installed app, no trailing slash
        'base_url' => 'https://nomadnet.hu/app/notizz',
        'name' => 'Notizz',
    ],

    'security' => [
        'password_min_length' => 6,
        'reset_token_ttl' => 3600,          // 1 hour
        'verify_token_ttl' => 259200,       // 3 days
        'rate_limit_max_attempts' => 5,
        'rate_limit_window' => 900,         // 15 minutes
    ],
];
