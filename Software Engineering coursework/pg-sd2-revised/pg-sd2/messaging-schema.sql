-- ============================================================
-- Messaging System Schema – Sprint 4
-- Run this in phpMyAdmin AFTER your existing closetswap-db.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS `messages` (
    `id`          INT AUTO_INCREMENT PRIMARY KEY,
    `sender_id`   INT NOT NULL,
    `receiver_id` INT NOT NULL,
    `content`     TEXT NOT NULL,
    `is_read`     BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_sender (`sender_id`),
    INDEX idx_receiver (`receiver_id`),
    INDEX idx_conversation (`sender_id`, `receiver_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample messages between testuser1 and testuser2
INSERT INTO `messages` (`sender_id`, `receiver_id`, `content`, `created_at`) VALUES
    (1, 2, 'Hey, is the Nike Windbreaker still available?', NOW() - INTERVAL 2 HOUR),
    (2, 1, 'Yes it is! Are you interested?', NOW() - INTERVAL 1 HOUR),
    (1, 2, 'Yeah, does the size M fit true to size?', NOW() - INTERVAL 30 MINUTE),
    (2, 1, 'Yes it runs true to size. I can meet on campus if you want.', NOW() - INTERVAL 15 MINUTE);
