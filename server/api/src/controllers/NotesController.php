<?php

declare(strict_types=1);

/**
 * Notes CRUD. JSON field names follow the frontend INote shape
 * (camelCase, `order`); the DB column is sort_order (`order` is reserved).
 *
 * CRITICAL updatedAt rule: the server NEVER generates updated_at — it stores
 * what the client sends. On PATCH without updatedAt (order-only change) the
 * stored value is left untouched, so manual reordering does not bump it.
 */
final class NotesController
{
    public function __construct(
        private readonly PDO $pdo,
        private readonly Auth $auth,
    ) {
    }

    public function list(): never
    {
        $user = $this->auth->requireUser();
        $stmt = $this->pdo->prepare(
            'SELECT * FROM notes WHERE user_id = ? ORDER BY sort_order ASC'
        );
        $stmt->execute([$user['id']]);
        json_response(array_map($this->toJson(...), $stmt->fetchAll()));
    }

    public function create(): never
    {
        $user = $this->auth->requireUser();
        $note = $this->validateFull(json_input());

        $stmt = $this->pdo->prepare(
            'INSERT INTO notes (id, user_id, title, content, color, sort_order, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        try {
            $stmt->execute([
                $note['id'], $user['id'], $note['title'], $note['content'],
                $note['color'], $note['order'], $note['createdAt'], $note['updatedAt'],
            ]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                json_error('conflict', 409);
            }
            throw $e;
        }

        json_response($this->fetchOne($note['id'], $user['id']), 201);
    }

    public function update(string $id): never
    {
        $user = $this->auth->requireUser();
        $input = json_input();

        $sets = [];
        $params = [];

        if (array_key_exists('title', $input)) {
            if (!is_string($input['title']) || mb_strlen($input['title']) > 500) {
                json_error('invalid_title', 400);
            }
            $sets[] = 'title = ?';
            $params[] = $input['title'];
        }
        if (array_key_exists('content', $input)) {
            if (!is_string($input['content']) || strlen($input['content']) > 1024 * 1024) {
                json_error('invalid_content', 400);
            }
            $sets[] = 'content = ?';
            $params[] = $input['content'];
        }
        if (array_key_exists('color', $input)) {
            if (!is_string($input['color']) || !is_valid_color($input['color'])) {
                json_error('invalid_color', 400);
            }
            $sets[] = 'color = ?';
            $params[] = $input['color'];
        }
        if (array_key_exists('order', $input)) {
            if (!is_valid_order($input['order'])) {
                json_error('invalid_order', 400);
            }
            $sets[] = 'sort_order = ?';
            $params[] = (int) $input['order'];
        }
        if (array_key_exists('updatedAt', $input)) {
            $sql = is_string($input['updatedAt']) ? iso_to_sql($input['updatedAt']) : null;
            if ($sql === null) {
                json_error('invalid_date', 400);
            }
            $sets[] = 'updated_at = ?';
            $params[] = $sql;
        }

        if ($sets === []) {
            json_error('empty_update', 400);
        }

        $params[] = $id;
        $params[] = $user['id'];
        $stmt = $this->pdo->prepare(
            'UPDATE notes SET ' . implode(', ', $sets) . ' WHERE id = ? AND user_id = ?'
        );
        $stmt->execute($params);

        $row = $this->fetchOne($id, $user['id'], orFail: true);
        json_response($row);
    }

    public function upsert(string $id): never
    {
        $user = $this->auth->requireUser();
        $note = $this->validateFull(json_input());
        if ($note['id'] !== $id) {
            json_error('id_mismatch', 400);
        }

        $stmt = $this->pdo->prepare(
            'INSERT INTO notes (id, user_id, title, content, color, sort_order, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               title = IF(user_id = VALUES(user_id), VALUES(title), title),
               content = IF(user_id = VALUES(user_id), VALUES(content), content),
               color = IF(user_id = VALUES(user_id), VALUES(color), color),
               sort_order = IF(user_id = VALUES(user_id), VALUES(sort_order), sort_order),
               updated_at = IF(user_id = VALUES(user_id), VALUES(updated_at), updated_at)'
        );
        $stmt->execute([
            $note['id'], $user['id'], $note['title'], $note['content'],
            $note['color'], $note['order'], $note['createdAt'], $note['updatedAt'],
        ]);

        $row = $this->fetchOne($id, $user['id'], orFail: true);
        json_response($row);
    }

    public function delete(string $id): never
    {
        $user = $this->auth->requireUser();
        $stmt = $this->pdo->prepare('DELETE FROM notes WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user['id']]);
        json_response(['success' => true]);
    }

    /**
     * Validate a full note payload (create/upsert). Returns normalized values
     * with SQL-format dates.
     */
    private function validateFull(array $input): array
    {
        $id = $input['id'] ?? '';
        if (!is_string($id) || !is_uuid($id)) {
            json_error('invalid_id', 400);
        }
        if (!is_string($input['title'] ?? null) || mb_strlen($input['title']) > 500) {
            json_error('invalid_title', 400);
        }
        if (!is_string($input['content'] ?? null) || strlen($input['content']) > 1024 * 1024) {
            json_error('invalid_content', 400);
        }
        if (!is_string($input['color'] ?? null) || !is_valid_color($input['color'])) {
            json_error('invalid_color', 400);
        }
        if (!is_valid_order($input['order'] ?? null)) {
            json_error('invalid_order', 400);
        }
        $createdAt = is_string($input['createdAt'] ?? null) ? iso_to_sql($input['createdAt']) : null;
        $updatedAt = is_string($input['updatedAt'] ?? null) ? iso_to_sql($input['updatedAt']) : null;
        if ($createdAt === null || $updatedAt === null) {
            json_error('invalid_date', 400);
        }

        return [
            'id' => strtolower($id),
            'title' => $input['title'],
            'content' => $input['content'],
            'color' => $input['color'],
            'order' => (int) $input['order'],
            'createdAt' => $createdAt,
            'updatedAt' => $updatedAt,
        ];
    }

    private function fetchOne(string $id, string $userId, bool $orFail = false): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $row = $stmt->fetch();
        if ($row === false) {
            if ($orFail) {
                json_error('not_found', 404);
            }
            return null;
        }
        return $this->toJson($row);
    }

    private function toJson(array $row): array
    {
        return [
            'id' => $row['id'],
            'title' => $row['title'],
            'content' => $row['content'],
            'color' => $row['color'],
            'order' => (int) $row['sort_order'],
            'createdAt' => sql_to_iso($row['created_at']),
            'updatedAt' => sql_to_iso($row['updated_at']),
        ];
    }
}
