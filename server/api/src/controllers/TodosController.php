<?php

declare(strict_types=1);

/**
 * Todos CRUD. Same conventions as NotesController; items is a JSON array of
 * ITodoItem ({id, text, completed, createdAt}) where createdAt stays an ISO
 * string inside the JSON — the frontend normalizes it to Date (see the
 * "TODO Items Date Conversion Fix" rule in CLAUDE.md).
 */
final class TodosController
{
    private const MAX_ITEMS = 500;
    private const MAX_ITEM_TEXT = 2000;

    public function __construct(
        private readonly PDO $pdo,
        private readonly Auth $auth,
    ) {
    }

    public function list(): never
    {
        $user = $this->auth->requireUser();
        $stmt = $this->pdo->prepare(
            'SELECT * FROM todos WHERE user_id = ? ORDER BY sort_order ASC'
        );
        $stmt->execute([$user['id']]);
        json_response(array_map($this->toJson(...), $stmt->fetchAll()));
    }

    public function create(): never
    {
        $user = $this->auth->requireUser();
        $todo = $this->validateFull(json_input());

        $stmt = $this->pdo->prepare(
            'INSERT INTO todos (id, user_id, title, items, color, sort_order, completed_count, total_count, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        try {
            $stmt->execute([
                $todo['id'], $user['id'], $todo['title'], $todo['items'], $todo['color'],
                $todo['order'], $todo['completedCount'], $todo['totalCount'],
                $todo['createdAt'], $todo['updatedAt'],
            ]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                json_error('conflict', 409);
            }
            throw $e;
        }

        json_response($this->fetchOne($todo['id'], $user['id']), 201);
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
        if (array_key_exists('items', $input)) {
            $items = $this->validateItems($input['items']);
            $sets[] = 'items = ?';
            $params[] = $items;
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
        if (array_key_exists('completedCount', $input)) {
            if (!is_int($input['completedCount']) || $input['completedCount'] < 0) {
                json_error('invalid_count', 400);
            }
            $sets[] = 'completed_count = ?';
            $params[] = $input['completedCount'];
        }
        if (array_key_exists('totalCount', $input)) {
            if (!is_int($input['totalCount']) || $input['totalCount'] < 0) {
                json_error('invalid_count', 400);
            }
            $sets[] = 'total_count = ?';
            $params[] = $input['totalCount'];
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
            'UPDATE todos SET ' . implode(', ', $sets) . ' WHERE id = ? AND user_id = ?'
        );
        $stmt->execute($params);

        $row = $this->fetchOne($id, $user['id'], orFail: true);
        json_response($row);
    }

    public function upsert(string $id): never
    {
        $user = $this->auth->requireUser();
        $todo = $this->validateFull(json_input());
        if ($todo['id'] !== $id) {
            json_error('id_mismatch', 400);
        }

        $stmt = $this->pdo->prepare(
            'INSERT INTO todos (id, user_id, title, items, color, sort_order, completed_count, total_count, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               title = IF(user_id = VALUES(user_id), VALUES(title), title),
               items = IF(user_id = VALUES(user_id), VALUES(items), items),
               color = IF(user_id = VALUES(user_id), VALUES(color), color),
               sort_order = IF(user_id = VALUES(user_id), VALUES(sort_order), sort_order),
               completed_count = IF(user_id = VALUES(user_id), VALUES(completed_count), completed_count),
               total_count = IF(user_id = VALUES(user_id), VALUES(total_count), total_count),
               updated_at = IF(user_id = VALUES(user_id), VALUES(updated_at), updated_at)'
        );
        $stmt->execute([
            $todo['id'], $user['id'], $todo['title'], $todo['items'], $todo['color'],
            $todo['order'], $todo['completedCount'], $todo['totalCount'],
            $todo['createdAt'], $todo['updatedAt'],
        ]);

        $row = $this->fetchOne($id, $user['id'], orFail: true);
        json_response($row);
    }

    public function delete(string $id): never
    {
        $user = $this->auth->requireUser();
        $stmt = $this->pdo->prepare('DELETE FROM todos WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user['id']]);
        json_response(['success' => true]);
    }

    private function validateFull(array $input): array
    {
        $id = $input['id'] ?? '';
        if (!is_string($id) || !is_uuid($id)) {
            json_error('invalid_id', 400);
        }
        if (!is_string($input['title'] ?? null) || mb_strlen($input['title']) > 500) {
            json_error('invalid_title', 400);
        }
        $items = $this->validateItems($input['items'] ?? null);
        if (!is_string($input['color'] ?? null) || !is_valid_color($input['color'])) {
            json_error('invalid_color', 400);
        }
        if (!is_valid_order($input['order'] ?? null)) {
            json_error('invalid_order', 400);
        }
        if (!is_int($input['completedCount'] ?? null) || $input['completedCount'] < 0) {
            json_error('invalid_count', 400);
        }
        if (!is_int($input['totalCount'] ?? null) || $input['totalCount'] < 0) {
            json_error('invalid_count', 400);
        }
        $createdAt = is_string($input['createdAt'] ?? null) ? iso_to_sql($input['createdAt']) : null;
        $updatedAt = is_string($input['updatedAt'] ?? null) ? iso_to_sql($input['updatedAt']) : null;
        if ($createdAt === null || $updatedAt === null) {
            json_error('invalid_date', 400);
        }

        return [
            'id' => strtolower($id),
            'title' => $input['title'],
            'items' => $items,
            'color' => $input['color'],
            'order' => (int) $input['order'],
            'completedCount' => $input['completedCount'],
            'totalCount' => $input['totalCount'],
            'createdAt' => $createdAt,
            'updatedAt' => $updatedAt,
        ];
    }

    /**
     * Validate the items array and return it re-encoded as a JSON string.
     * Only whitelisted keys survive; createdAt stays an ISO string.
     */
    private function validateItems(mixed $items): string
    {
        if (!is_array($items) || count($items) > self::MAX_ITEMS || !array_is_list($items)) {
            json_error('invalid_items', 400);
        }

        $clean = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                json_error('invalid_items', 400);
            }
            $itemId = $item['id'] ?? '';
            $text = $item['text'] ?? null;
            $completed = $item['completed'] ?? null;
            $createdAt = $item['createdAt'] ?? null;

            if (!is_string($itemId) || $itemId === '' || strlen($itemId) > 64) {
                json_error('invalid_items', 400);
            }
            if (!is_string($text) || mb_strlen($text) > self::MAX_ITEM_TEXT) {
                json_error('invalid_items', 400);
            }
            if (!is_bool($completed)) {
                json_error('invalid_items', 400);
            }
            if (!is_string($createdAt) || iso_to_sql($createdAt) === null) {
                json_error('invalid_items', 400);
            }

            $clean[] = [
                'id' => $itemId,
                'text' => $text,
                'completed' => $completed,
                'createdAt' => $createdAt,
            ];
        }

        return json_encode($clean, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    private function fetchOne(string $id, string $userId, bool $orFail = false): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?');
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
            'items' => json_decode($row['items'], true) ?? [],
            'color' => $row['color'],
            'order' => (int) $row['sort_order'],
            'completedCount' => (int) $row['completed_count'],
            'totalCount' => (int) $row['total_count'],
            'createdAt' => sql_to_iso($row['created_at']),
            'updatedAt' => sql_to_iso($row['updated_at']),
        ];
    }
}
