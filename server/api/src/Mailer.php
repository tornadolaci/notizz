<?php

declare(strict_types=1);

/**
 * Minimal SMTP mailer over implicit SSL/TLS (port 465), no dependencies.
 * driver 'log' writes the message to a file instead of sending (local dev,
 * the smoke test greps tokens out of it).
 */
final class Mailer
{
    public function __construct(private readonly array $smtp)
    {
    }

    /**
     * Send a plain-text UTF-8 email. Throws RuntimeException on failure.
     */
    public function send(string $to, string $subject, string $body): void
    {
        if (($this->smtp['driver'] ?? 'smtp') === 'log') {
            $entry = sprintf(
                "[%s] To: %s\nSubject: %s\n%s\n----\n",
                date('c'),
                $to,
                $subject,
                $body
            );
            file_put_contents($this->smtp['log_file'], $entry, FILE_APPEND | LOCK_EX);
            return;
        }

        $this->sendSmtp($to, $subject, $body);
    }

    private function sendSmtp(string $to, string $subject, string $body): void
    {
        $host = $this->smtp['host'];
        $port = (int) $this->smtp['port'];
        $timeout = 15;

        $fp = @stream_socket_client(
            "ssl://{$host}:{$port}",
            $errno,
            $errstr,
            $timeout,
            STREAM_CLIENT_CONNECT,
            stream_context_create(['ssl' => ['SNI_enabled' => true]])
        );
        if ($fp === false) {
            throw new RuntimeException("SMTP connect failed: {$errstr} ({$errno})");
        }
        stream_set_timeout($fp, $timeout);

        try {
            $this->expect($fp, 220);
            $this->command($fp, 'EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost'), 250);
            $this->command($fp, 'AUTH LOGIN', 334);
            $this->command($fp, base64_encode($this->smtp['user']), 334);
            $this->command($fp, base64_encode($this->smtp['pass']), 235);
            $this->command($fp, 'MAIL FROM:<' . $this->smtp['from'] . '>', 250);
            $this->command($fp, 'RCPT TO:<' . $to . '>', 250);
            $this->command($fp, 'DATA', 354);

            $message = $this->buildMessage($to, $subject, $body);
            // Dot-stuffing per RFC 5321
            $message = preg_replace('/^\./m', '..', $message);
            fwrite($fp, $message . "\r\n.\r\n");
            $this->expect($fp, 250);

            $this->command($fp, 'QUIT', 221);
        } finally {
            fclose($fp);
        }
    }

    private function buildMessage(string $to, string $subject, string $body): string
    {
        $fromName = $this->encodeHeader($this->smtp['from_name'] ?? '');
        $headers = [
            'Date: ' . date('r'),
            'From: ' . ($fromName !== '' ? "{$fromName} " : '') . '<' . $this->smtp['from'] . '>',
            'To: <' . $to . '>',
            'Subject: ' . $this->encodeHeader($subject),
            'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . $this->smtp['host'] . '>',
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
        ];
        return implode("\r\n", $headers) . "\r\n\r\n" . chunk_split(base64_encode($body), 76, "\r\n");
    }

    private function encodeHeader(string $value): string
    {
        if ($value === '' || preg_match('/^[\x20-\x7E]*$/', $value) === 1) {
            return $value;
        }
        return '=?UTF-8?B?' . base64_encode($value) . '?=';
    }

    private function command($fp, string $command, int $expectedCode): void
    {
        fwrite($fp, $command . "\r\n");
        $this->expect($fp, $expectedCode);
    }

    private function expect($fp, int $expectedCode): void
    {
        $response = '';
        while (($line = fgets($fp, 1024)) !== false) {
            $response .= $line;
            // Multiline responses continue with "NNN-", final line is "NNN "
            if (strlen($line) >= 4 && $line[3] === ' ') {
                break;
            }
        }
        $code = (int) substr($response, 0, 3);
        if ($code !== $expectedCode) {
            throw new RuntimeException("SMTP error: expected {$expectedCode}, got: " . trim($response));
        }
    }
}
