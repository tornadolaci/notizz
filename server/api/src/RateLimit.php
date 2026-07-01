<?php

declare(strict_types=1);

/**
 * Fixed-window rate limiter backed by the rate_limits table.
 * Keys are "<action>:<identifier>" (e.g. "login:1.2.3.4", "reset:user@x.hu").
 */
final class RateLimit
{
    public function __construct(
        private readonly PDO $pdo,
        private readonly int $maxAttempts,
        private readonly int $windowSeconds,
    ) {
    }

    /**
     * Register an attempt for each key; terminates with 429 when a key is over the limit.
     */
    public function hit(string ...$keys): void
    {
        $now = new DateTimeImmutable('now', new DateTimeZone('UTC'));
        $nowSql = $now->format('Y-m-d H:i:s.v');
        $windowStartMin = $now->modify("-{$this->windowSeconds} seconds")->format('Y-m-d H:i:s.v');

        foreach ($keys as $key) {
            $key = substr($key, 0, 191);

            // Reset the window when expired, otherwise increment
            $stmt = $this->pdo->prepare(
                'INSERT INTO rate_limits (rl_key, window_start, attempts) VALUES (?, ?, 1)
                 ON DUPLICATE KEY UPDATE
                   attempts = IF(window_start < ?, 1, attempts + 1),
                   window_start = IF(window_start < ?, VALUES(window_start), window_start)'
            );
            $stmt->execute([$key, $nowSql, $windowStartMin, $windowStartMin]);

            $check = $this->pdo->prepare('SELECT attempts FROM rate_limits WHERE rl_key = ?');
            $check->execute([$key]);
            $attempts = (int) $check->fetchColumn();

            if ($attempts > $this->maxAttempts) {
                json_error('rate_limited', 429);
            }
        }
    }

    /**
     * Clear counters after a successful action (e.g. successful login).
     */
    public function clear(string ...$keys): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM rate_limits WHERE rl_key = ?');
        foreach ($keys as $key) {
            $stmt->execute([substr($key, 0, 191)]);
        }
    }
}
