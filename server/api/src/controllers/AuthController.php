<?php

declare(strict_types=1);

/**
 * Auth endpoints: register, login, logout, me, verify-email,
 * password-reset-request, password-reset.
 *
 * Error responses use stable codes; the frontend maps them to Hungarian
 * messages (same pattern as the old Supabase getErrorMessage map).
 */
final class AuthController
{
    public function __construct(
        private readonly PDO $pdo,
        private readonly Auth $auth,
        private readonly Mailer $mailer,
        private readonly RateLimit $rateLimit,
        private readonly array $config,
    ) {
    }

    public function register(): never
    {
        $this->rateLimit->hit('register:' . client_ip());

        $input = json_input();
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        $password = (string) ($input['password'] ?? '');

        if (!is_valid_email($email)) {
            json_error('invalid_email', 400);
        }
        if (strlen($password) < $this->config['security']['password_min_length']) {
            json_error('password_too_short', 400);
        }

        $exists = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $exists->execute([$email]);
        if ($exists->fetch() !== false) {
            json_error('email_taken', 409);
        }

        $userId = $this->uuid();
        $now = now_sql();
        $stmt = $this->pdo->prepare(
            'INSERT INTO users (id, email, password_hash, email_verified_at, created_at, updated_at)
             VALUES (?, ?, ?, NULL, ?, ?)'
        );
        $stmt->execute([$userId, $email, password_hash($password, PASSWORD_DEFAULT), $now, $now]);

        $this->sendVerificationEmail($userId, $email);

        json_response(['needsEmailConfirmation' => true], 201);
    }

    public function login(): never
    {
        $ipKey = 'login:' . client_ip();
        $this->rateLimit->hit($ipKey);

        $input = json_input();
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        $password = (string) ($input['password'] ?? '');

        $emailKey = 'login:' . $email;
        $this->rateLimit->hit($emailKey);

        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user === false || !password_verify($password, $user['password_hash'])) {
            json_error('invalid_credentials', 401);
        }
        if ($user['email_verified_at'] === null) {
            json_error('email_not_confirmed', 403);
        }

        // Transparent rehash if PHP's default algorithm/cost changes
        if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
            $rehash = $this->pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
            $rehash->execute([password_hash($password, PASSWORD_DEFAULT), $user['id']]);
        }

        $this->rateLimit->clear($ipKey, $emailKey);
        $token = $this->auth->issueToken($user['id']);

        json_response([
            'token' => $token,
            'user' => $this->publicUser($user),
        ]);
    }

    public function logout(): never
    {
        $this->auth->revokeCurrentToken();
        json_response(['success' => true]);
    }

    public function me(): never
    {
        $user = $this->auth->requireUser();
        json_response(['user' => $this->publicUser($user)]);
    }

    public function verifyEmail(): never
    {
        $token = (string) ($_GET['token'] ?? '');
        $baseUrl = $this->config['app']['base_url'];

        $userId = strlen($token) === 64 ? $this->auth->consumeOneTimeToken($token, 'verify_email') : null;
        if ($userId !== null) {
            $stmt = $this->pdo->prepare(
                'UPDATE users SET email_verified_at = ?, updated_at = ? WHERE id = ? AND email_verified_at IS NULL'
            );
            $now = now_sql();
            $stmt->execute([$now, $now, $userId]);
            header('Location: ' . $baseUrl . '/#/?verified=1', true, 302);
        } else {
            header('Location: ' . $baseUrl . '/#/?verified=0', true, 302);
        }
        exit;
    }

    public function passwordResetRequest(): never
    {
        $input = json_input();
        $email = strtolower(trim((string) ($input['email'] ?? '')));

        $this->rateLimit->hit('reset:' . client_ip(), 'reset:' . $email);

        // Always return success — do not reveal whether the email exists
        if (is_valid_email($email)) {
            $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            if ($user !== false) {
                $raw = $this->auth->issueOneTimeToken(
                    $user['id'],
                    'password_reset',
                    $this->config['security']['reset_token_ttl']
                );
                $link = $this->config['app']['base_url'] . '/#/reset-password?token=' . $raw;
                $this->mailer->send(
                    $email,
                    'Notizz – Jelszó visszaállítás',
                    "Szia!\n\n"
                    . "Jelszó-visszaállítást kértél a Notizz fiókodhoz.\n"
                    . "Kattints az alábbi linkre az új jelszó megadásához (1 órán át érvényes):\n\n"
                    . $link . "\n\n"
                    . "Ha nem te kérted, hagyd figyelmen kívül ezt a levelet.\n\n"
                    . "Üdvözlettel,\nNotizz"
                );
            }
        }

        json_response(['success' => true]);
    }

    public function passwordReset(): never
    {
        $this->rateLimit->hit('reset-confirm:' . client_ip());

        $input = json_input();
        $token = (string) ($input['token'] ?? '');
        $newPassword = (string) ($input['newPassword'] ?? '');

        if (strlen($newPassword) < $this->config['security']['password_min_length']) {
            json_error('password_too_short', 400);
        }

        $userId = strlen($token) === 64 ? $this->auth->consumeOneTimeToken($token, 'password_reset') : null;
        if ($userId === null) {
            json_error('invalid_token', 400);
        }

        $stmt = $this->pdo->prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?');
        $stmt->execute([password_hash($newPassword, PASSWORD_DEFAULT), now_sql(), $userId]);

        // Force re-login on every device
        $this->auth->revokeAllTokens($userId);

        json_response(['success' => true]);
    }

    private function sendVerificationEmail(string $userId, string $email): void
    {
        $raw = $this->auth->issueOneTimeToken(
            $userId,
            'verify_email',
            $this->config['security']['verify_token_ttl']
        );
        $link = $this->config['app']['base_url'] . '/api/auth/verify-email?token=' . $raw;
        $this->mailer->send(
            $email,
            'Notizz – Erősítsd meg az email címedet',
            "Szia!\n\n"
            . "Köszönjük a regisztrációt a Notizz alkalmazásban!\n"
            . "A fiókod aktiválásához kattints az alábbi linkre:\n\n"
            . $link . "\n\n"
            . "Ha nem te regisztráltál, hagyd figyelmen kívül ezt a levelet.\n\n"
            . "Üdvözlettel,\nNotizz"
        );
    }

    private function publicUser(array $user): array
    {
        return [
            'id' => $user['id'],
            'email' => $user['email'],
            'emailVerifiedAt' => $user['email_verified_at'] !== null ? sql_to_iso($user['email_verified_at']) : null,
            'createdAt' => sql_to_iso($user['created_at']),
        ];
    }

    private function uuid(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40); // version 4
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80); // variant
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
    }
}
