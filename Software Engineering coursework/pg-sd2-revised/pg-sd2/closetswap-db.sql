DROP TABLE IF EXISTS `listings`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `test_table`;

CREATE TABLE IF NOT EXISTS `users` (
    `id`            INT AUTO_INCREMENT PRIMARY KEY,
    `username`      VARCHAR(50)  NOT NULL UNIQUE,
    `emaiDROP TABLE IF EXISTS ` listings `;
DROP TABLE IF EXISTS ` categories `;
DROP TABLE IF EXISTS ` users `;
DROP TABLE IF EXISTS ` test_table `;

CREATE TABLE IF NOT EXISTS ` users ` (
    ` id `            INT AUTO_INCREMENT PRIMARY KEY,
    ` username `      VARCHAR(50)  NOT NULL UNIQUE,
    ` email `         VARCHAR(100) NOT NULL UNIQUE,
    ` password_hash ` VARCHAR(255) NOT NULL,
    ` created_at `    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ` categories ` (
    ` id `   INT AUTO_INCREMENT PRIMARY KEY,
    ` name ` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ` listings ` (
    ` id `          INT AUTO_INCREMENT PRIMARY KEY,
    ` title `       VARCHAR(150) NOT NULL,
    ` description ` TEXT,
    ` price `       DECIMAL(10,2) NOT NULL,
    ` size `        VARCHAR(20),
    ` condition `   VARCHAR(30),
    ` image_url `   VARCHAR(255),
    ` category_id ` INT,
    ` user_id `     INT NOT NULL,
    ` status `      VARCHAR(20) NOT NULL DEFAULT ''available'',
    ` created_at `  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (` category_id `) REFERENCES ` categories `(` id `)
        ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (` user_id `) REFERENCES ` users `(` id `)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO ` categories ` (` name `) VALUES
    (''Tops''), (''Bottoms''), (''Jackets''), (''Dresses''), (''Shoes''), (''Accessories'');

INSERT INTO ` users ` (` username `, ` email `, ` password_hash `) VALUES
    (''testuser1'', ''test1@roehampton.ac.uk'',
     ''$2a$10$8KzaNdKIMyOkASCkGfmyaeDM7wCnMBxOSXFJ5RVVb4FPxPz5GVbYe''),
    (''testuser2'', ''test2@roehampton.ac.uk'',
     ''$2a$10$8KzaNdKIMyOkASCkGfmyaeDM7wCnMBxOSXFJ5RVVb4FPxPz5GVbYe'');

INSERT INTO ` listings ` (` title `, ` description `, ` price `, ` size `, ` condition `, ` image_url `, ` category_id `, ` user_id `) VALUES
    (''Nike Windbreaker'', ''Barely worn, great for layering'', 18.00, ''M'', ''Like New'', ''/images/placeholder.png'', 3, 1),
    (''Levi 501 Jeans'', ''Classic straight fit, slight fade'', 25.00, ''32W'', ''Good'', ''/images/placeholder.png'', 2, 1),
    (''Adidas Hoodie'', ''Warm and cosy, small logo on chest'', 15.00, ''L'', ''Good'', ''/images/placeholder.png'', 1, 1),
    (''Converse Hi-Tops'', ''White, UK size 9, minor scuffing'', 12.00, ''UK 9'', ''Fair'', ''/images/placeholder.png'', 5, 2);
l`         VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `categories` (
    `id`   INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `listings` (
    `id`          INT AUTO_INCREMENT PRIMARY KEY,
    `title`       VARCHAR(150) NOT NULL,
    `description` TEXT,
    `price`       DECIMAL(10,2) NOT NULL,
    `size`        VARCHAR(20),
    `condition`   VARCHAR(30),
    `image_url`   VARCHAR(255),
    `category_id` INT,
    `user_id`     INT NOT NULL,
    `status`      VARCHAR(20) NOT NULL DEFAULT 'available',
    `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `categories` (`name`) VALUES
    ('Tops'), ('Bottoms'), ('Jackets'), ('Dresses'), ('Shoes'), ('Accessories');

INSERT INTO `users` (`username`, `email`, `password_hash`) VALUES
    ('testuser1', 'test1@roehampton.ac.uk',
     '$2a$10$8KzaNdKIMyOkASCkGfmyaeDM7wCnMBxOSXFJ5RVVb4FPxPz5GVbYe'),
    ('testuser2', 'test2@roehampton.ac.uk',
     '$2a$10$8KzaNdKIMyOkASCkGfmyaeDM7wCnMBxOSXFJ5RVVb4FPxPz5GVbYe');

INSERT INTO `listings` (`title`, `description`, `price`, `size`, `condition`, `image_url`, `category_id`, `user_id`) VALUES
    ('Nike Windbreaker', 'Barely worn, great for layering', 18.00, 'M', 'Like New', '/images/placeholder.png', 3, 1),
    ('Levi 501 Jeans', 'Classic straight fit, slight fade', 25.00, '32W', 'Good', '/images/placeholder.png', 2, 1),
    ('Adidas Hoodie', 'Warm and cosy, small logo on chest', 15.00, 'L', 'Good', '/images/placeholder.png', 1, 1),
    ('Converse Hi-Tops', 'White, UK size 9, minor scuffing', 12.00, 'UK 9', 'Fair', '/images/placeholder.png', 5, 2);
