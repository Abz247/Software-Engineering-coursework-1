CREATE DATABASE IF NOT EXISTS `sd2-db`;
USE `sd2-db`;

DROP TABLE IF EXISTS `listings`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE `listings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `category_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `price` DECIMAL(10,2),
    `size` VARCHAR(50),
    `condition` VARCHAR(100),
    `image_url` TEXT,
    `status` VARCHAR(50) DEFAULT 'Available',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
);

INSERT INTO `users` (`username`, `email`, `password_hash`) VALUES
('Abdullahi', 'abdullahi@email.com', '$2a$10$8KzaNdKIMyOkASCkGfmyaeDM7wCnMBxOSXFJ5RVVb4FPxPz5GVbYe'),
('Obaida', 'obaida@email.com', '$2a$10$8KzaNdKIMyOkASCkGfmyaeDM7wCnMBxOSXFJ5RVVb4FPxPz5GVbYe'),
('Abdalla', 'abdalla@email.com', '$2a$10$8KzaNdKIMyOkASCkGfmyaeDM7wCnMBxOSXFJ5RVVb4FPxPz5GVbYe'),
('Meshari', 'meshari@email.com', '$2a$10$8KzaNdKIMyOkASCkGfmyaeDM7wCnMBxOSXFJ5RVVb4FPxPz5GVbYe'),
('Eder', 'eder@email.com', '$2a$10$8KzaNdKIMyOkASCkGfmyaeDM7wCnMBxOSXFJ5RVVb4FPxPz5GVbYe');

INSERT INTO `categories` (`name`) VALUES
('Women - Tops'),
('Women - Bottoms'),
('Women - Dresses'),
('Women - Shoes'),
('Women - Accessories'),
('Men - Tops'),
('Men - Bottoms'),
('Men - Outerwear'),
('Men - Shoes'),
('Men - Accessories');

INSERT INTO `listings` (`user_id`, `category_id`, `title`, `description`, `price`, `size`, `condition`, `image_url`, `status`) VALUES
(1, 1, 'Women’s White Blouse', 'Smart white blouse suitable for lectures and presentations.', 12.99, 'M', 'Excellent', 'https://images.pexels.com/photos/4971269/pexels-photo-4971269.jpeg', 'Available'),
(2, 2, 'Women’s Black Skirt', 'Comfortable black skirt in good condition.', 10.50, 'S', 'Good', 'https://images.pexels.com/photos/30334299/pexels-photo-30334299.jpeg', 'Available'),
(3, 6, 'Men’s Black Hoodie', 'Warm hoodie ideal for everyday use on campus.', 14.99, 'L', 'Good', 'https://images.pexels.com/photos/19461563/pexels-photo-19461563.jpeg', 'Available'),
(4, 8, 'Men’s Black Jacket', 'Stylish outerwear for colder weather.', 22.00, 'M', 'Excellent', 'https://images.pexels.com/photos/9286993/pexels-photo-9286993.jpeg', 'Available'),
(5, 9, 'Men’s White Trainers', 'Comfortable trainers for daily wear.', 16.50, '42', 'Good', 'https://images.pexels.com/photos/5730519/pexels-photo-5730519.jpeg', 'Available');
