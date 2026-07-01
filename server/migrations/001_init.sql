-- Notizz MySQL schema — initial migration
-- MySQL 8 compatible. DATETIME(3) everywhere: the client compares updatedAt
-- with millisecond precision (change detection uses getTime()).

CREATE TABLE users (
  id                CHAR(36)     NOT NULL PRIMARY KEY,
  email             VARCHAR(255) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  email_verified_at DATETIME(3)  NULL,
  created_at        DATETIME(3)  NOT NULL,
  updated_at        DATETIME(3)  NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auth_tokens (
  token_hash   CHAR(64)    NOT NULL PRIMARY KEY,
  user_id      CHAR(36)    NOT NULL,
  created_at   DATETIME(3) NOT NULL,
  last_used_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_auth_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE one_time_tokens (
  token_hash CHAR(64)    NOT NULL PRIMARY KEY,
  user_id    CHAR(36)    NOT NULL,
  type       ENUM('verify_email','password_reset') NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_ott_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notes (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  user_id    CHAR(36)     NOT NULL,
  title      VARCHAR(500) NOT NULL DEFAULT '',
  content    MEDIUMTEXT   NOT NULL,
  color      VARCHAR(16)  NOT NULL,
  sort_order BIGINT       NOT NULL,
  created_at DATETIME(3)  NOT NULL,
  updated_at DATETIME(3)  NOT NULL,
  INDEX idx_notes_user_order (user_id, sort_order),
  CONSTRAINT fk_notes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE todos (
  id              CHAR(36)     NOT NULL PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  title           VARCHAR(500) NOT NULL DEFAULT '',
  items           JSON         NOT NULL,
  color           VARCHAR(16)  NOT NULL,
  sort_order      BIGINT       NOT NULL,
  completed_count INT          NOT NULL DEFAULT 0,
  total_count     INT          NOT NULL DEFAULT 0,
  created_at      DATETIME(3)  NOT NULL,
  updated_at      DATETIME(3)  NOT NULL,
  INDEX idx_todos_user_order (user_id, sort_order),
  CONSTRAINT fk_todos_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rate_limits (
  rl_key       VARCHAR(191) NOT NULL PRIMARY KEY,
  window_start DATETIME(3)  NOT NULL,
  attempts     INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
