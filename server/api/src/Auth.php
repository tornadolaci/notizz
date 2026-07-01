<?php

declare(strict_types=1);

/**
 * Token-based authentication.
 *
 * Access tokens are opaque: 64 hex chars handed to the client, stored as
 * SHA-256 hashes. They never expire — only an explicit logout (or password
 * reset) removes them, matching the previous Supabase session behaviour.
 */
final class Auth
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * Create a new access token for a user and return the raw token.
     */
    public function issueToken(string $userId): string
    {
        $raw = bin2hex(random_bytes(32));
        $now = now_sql();
        $stmt = $this->pdo->prepare(
            'INSERT INTO auth_tokens (token_hash, user_id, created_at, last_used_at) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([hash('sha256', $raw), $userId, $now, $now]);
        return $raw;
    }

    /**
     * Resolve the Bearer token of the current request to a user row.
     * Returns null when missing/invalid.
     */
    public function currentUser(): ?array
    {
        $token = $this->bearerToken();
        if ($token === null) {
            return null;
        }

        $hash = hash('sha256', $token);
        $stmt = $this->pdo->prepare(
            'SELECT u.* FROM auth_tokens t JOIN users u ON u.id = t.user_id WHERE t.token_hash = ?'
        );
        $stmt->execute([$hash]);
        $user = $stmt->fetch();
        if ($user === false) {
            return null;
        }

        // Touch last_used_at at most once a minute to avoid a write per request
        $touch = $this->pdo->prepare(
            'UPDATE auth_tokens SET last_used_at = ? WHERE token_hash = ? AND last_used_at < ?'
        );
        $nowDt = new DateTimeImmutable('now', new DateTimeZone('UTC'));
        $touch->execute([
            $nowDt->format('Y-m-d H:i:s.v'),
            $hash,
            $nowDt->modify('-1 minute')->format('Y-m-d H:i:s.v'),
        ]);

        return $user;
    }

    /**
     * Require an authenticated user or terminate with 401.
     */
    public function requireUser(): array
    {
        $user = $this->currentUser();
        if ($user === null) {
            json_error('unauthorized', 401);
        }
        return $user;
    }

    /**
     * Delete the current request's token (logout). Idempotent.
     */
    public function revokeCurrentToken(): void
    {
        $token = $this->bearerToken();
        if ($token === null) {
            return;
        }
        $stmt = $this->pdo->prepare('DELETE FROM auth_tokens WHERE token_hash = ?');
        $stmt->execute([hash('sha256', $token)]);
    }

    /**
     * Delete all tokens of a user (e.g. after password reset).
     */
    public function revokeAllTokens(string $userId): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM auth_tokens WHERE user_id = ?');
        $stmt->execute([$userId]);
    }

    /**
     * Create a one-time token (email verify / password reset), return the raw token.
     * Replaces any previous token of the same type for the user.
     */
    public function issueOneTimeToken(string $userId, string $type, int $ttlSeconds): string
    {
        $del = $this->pdo->prepare('DELETE FROM one_time_tokens WHERE user_id = ? AND type = ?');
        $del->execute([$userId, $type]);

        $raw = bin2hex(random_bytes(32));
        $expires = (new DateTimeImmutable('now', new DateTimeZone('UTC')))
            ->modify("+{$ttlSeconds} seconds")
            ->format('Y-m-d H:i:s.v');
        $stmt = $this->pdo->prepare(
            'INSERT INTO one_time_tokens (token_hash, user_id, type, expires_at) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([hash('sha256', $raw), $userId, $type, $expires]);
        return $raw;
    }

    /**
     * Consume a one-time token: validates type + expiry, deletes it, returns user_id.
     * Returns null when invalid or expired.
     */
    public function consumeOneTimeToken(string $rawToken, string $type): ?string
    {
        $hash = hash('sha256', $rawToken);
        $stmt = $this->pdo->prepare(
            'SELECT user_id, expires_at FROM one_time_tokens WHERE token_hash = ? AND type = ?'
        );
        $stmt->execute([$hash, $type]);
        $row = $stmt->fetch();
        if ($row === false) {
            return null;
        }

        $del = $this->pdo->prepare('DELETE FROM one_time_tokens WHERE token_hash = ?');
        $del->execute([$hash]);

        if ($row['expires_at'] < now_sql()) {
            return null;
        }
        return $row['user_id'];
    }

    private function bearerToken(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? '';
        if (preg_match('/^Bearer\s+([0-9a-f]{64})$/i', trim($header), $m) !== 1) {
            return null;
        }
        return strtolower($m[1]);
    }
}
