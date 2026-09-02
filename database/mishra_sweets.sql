-- ============================================================
-- Meetha Tales - Sweet Shop Management System
-- Database: mishra_sweets
-- For XAMPP / phpMyAdmin (MySQL)
-- ============================================================
-- HOW TO USE:
-- 1. Open http://localhost/phpmyadmin
-- 2. Click "Import" tab
-- 3. Choose this file and click "Go"
-- This script creates the database, all tables, and sample data.
-- ============================================================

CREATE DATABASE IF NOT EXISTS mishra_sweets;
USE mishra_sweets;

-- Drop tables in reverse dependency order (for clean re-import)
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS cart;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS gallery;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS admins;

-- ============================================================
-- 1. admins table
-- ============================================================
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. customers table
-- ============================================================
CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  password VARCHAR(255) NOT NULL,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. categories table
-- ============================================================
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image VARCHAR(255),
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. products table
-- ============================================================
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category_id INT,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'kg',
  image VARCHAR(255),
  rating DECIMAL(2,1) DEFAULT 4.5,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ============================================================
-- 5. cart table
-- ============================================================
CREATE TABLE cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- ============================================================
-- 6. cart_items table
-- ============================================================
CREATE TABLE cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================
-- 7. orders table
-- ============================================================
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cod','upi','card') DEFAULT 'cod',
  payment_status ENUM('pending','paid','failed') DEFAULT 'pending',
  order_status ENUM('pending','confirmed','preparing','ready','delivered','cancelled') DEFAULT 'pending',
  delivery_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- ============================================================
-- 8. order_items table
-- ============================================================
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- ============================================================
-- 9. payments table
-- ============================================================
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  payment_method ENUM('cod','upi','card') DEFAULT 'cod',
  amount DECIMAL(10,2) NOT NULL,
  payment_status ENUM('pending','paid','failed') DEFAULT 'pending',
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ============================================================
-- 10. inventory table
-- ============================================================
CREATE TABLE inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  min_stock INT NOT NULL DEFAULT 5,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================
-- 11. gallery table
-- ============================================================
CREATE TABLE gallery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  image VARCHAR(255),
  category VARCHAR(50) DEFAULT 'sweets',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 12. contact_messages table
-- ============================================================
CREATE TABLE contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(200),
  message TEXT NOT NULL,
  status ENUM('new','read','replied') DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INSERT SAMPLE DATA
-- ============================================================

-- Default admin (password: admin123, hashed with bcrypt)
INSERT INTO admins (name, email, password, phone) VALUES
('Admin', 'admin@meethatales.com', '$2a$10$8K1p/a0dRTllRX1Nlx2QyOQIYxQX7vBBkKQmGkRrMZpJx.LFq8fHe', '9876543210');

-- Sample customers (password: customer123, hashed with bcrypt)
INSERT INTO customers (full_name, email, phone, address, password) VALUES
('Rahul Sharma', 'rahul@example.com', '9876543211', 'MG Road, Bengaluru, Karnataka', '$2a$10$8K1p/a0dRTllRX1Nlx2QyOQIYxQX7vBBkKQmGkRrMZpJx.LFq8fHe'),
('Priya Patel', 'priya@example.com', '9876543212', 'Indiranagar, Bengaluru, Karnataka', '$2a$10$8K1p/a0dRTllRX1Nlx2QyOQIYxQX7vBBkKQmGkRrMZpJx.LFq8fHe');

-- Categories
INSERT INTO categories (name, description, image, status) VALUES
('Pedha', 'Traditional milk pedha sweets', 'pedha.jpg', 'active'),
('Laddu', 'Round sweet laddus in various flavors', 'laddu.jpg', 'active'),
('Jalebi', 'Crispy syrup-soaked jalebi', 'jalebi.jpg', 'active'),
('Mysore Pak', 'Ghee-rich Mysore Pak', 'mysore-pak.jpg', 'active'),
('Kaju Sweets', 'Cashew-based premium sweets', 'kaju-sweets.jpg', 'active'),
('Bengali Sweets', 'Authentic Bengali sweets', 'bengali-sweets.jpg', 'active'),
('Milk Sweets', 'Milk-based traditional sweets', 'milk-sweets.jpg', 'active'),
('Dry Fruits', 'Dry fruit sweets and nuts', 'dry-fruits.jpg', 'active'),
('Snacks', 'Savory snacks and namkeen', 'snacks.jpg', 'active'),
('Gift Boxes', 'Assorted sweet gift boxes', 'gift-boxes.jpg', 'active');

-- Products (15 sample products)
INSERT INTO products (name, category_id, description, price, quantity, unit, image, rating, status) VALUES
('Mishra Special Pedha', 1, 'Our signature pedha made from pure milk and ghee, flavored with cardamom.', 420.00, 50, 'kg', 'pedha.jpg', 4.8, 'active'),
('Kaju Katli', 5, 'Diamond-cut cashew fudge topped with silver leaf. A festival favorite.', 920.00, 30, 'kg', 'kaju-katli.jpg', 4.9, 'active'),
('Motichoor Laddu', 2, 'Tiny boondi laddus soaked in sugar syrup, garnished with chopped almonds.', 480.00, 40, 'kg', 'motichoor-laddu.jpg', 4.7, 'active'),
('Besan Laddu', 2, 'Roasted gram flour laddus with ghee and sugar, melts in your mouth.', 380.00, 35, 'kg', 'besan-laddu.jpg', 4.5, 'active'),
('Mysore Pak', 4, 'Authentic Mysore Pak made with generous ghee and gram flour.', 520.00, 25, 'kg', 'mysore-pak.jpg', 4.8, 'active'),
('Jalebi', 3, 'Crispy golden jalebi dipped in saffron sugar syrup. Best served warm.', 280.00, 60, 'kg', 'jalebi.jpg', 4.6, 'active'),
('Rasgulla', 6, 'Soft spongy rasgulla in light sugar syrup, a Bengali classic.', 360.00, 45, 'kg', 'rasgulla.jpg', 4.7, 'active'),
('Gulab Jamun', 6, 'Deep-fried milk dumplings soaked in rose-flavored sugar syrup.', 400.00, 55, 'kg', 'gulab-jamun.jpg', 4.9, 'active'),
('Milk Cake', 7, 'Rich milk cake with caramelized flavor, traditionally known as Kalakand.', 460.00, 20, 'kg', 'milk-cake.jpg', 4.6, 'active'),
('Dharwad Pedha', 1, 'Famous Dharwad pedha with a unique caramelized milk flavor.', 500.00, 28, 'kg', 'dharwad-pedha.jpg', 4.7, 'active'),
('Kaju Roll', 5, 'Cashew roll with pistachio filling, a premium dry fruit sweet.', 980.00, 15, 'kg', 'kaju-roll.jpg', 4.8, 'active'),
('Badam Halwa', 8, 'Almond halwa made with ground almonds, ghee, and saffron.', 720.00, 18, 'kg', 'badam-halwa.jpg', 4.5, 'active'),
('Coconut Burfi', 7, 'Coconut fudge made with fresh coconut, milk, and cardamom.', 340.00, 42, 'kg', 'coconut-burfi.jpg', 4.4, 'active'),
('Dry Fruit Laddu', 8, 'Nutritious laddu packed with dates, almonds, cashews, and pistachios.', 850.00, 22, 'box', 'dry-fruit-laddu.jpg', 4.7, 'active'),
('Special Sweet Box', 10, 'Assorted sweet box containing 5 varieties of our finest sweets.', 1200.00, 12, 'box', 'sweet-box.jpg', 4.9, 'active');

-- Inventory for each product
INSERT INTO inventory (product_id, min_stock) VALUES
(1, 10), (2, 8), (3, 10), (4, 10), (5, 5),
(6, 15), (7, 10), (8, 15), (9, 5), (10, 5),
(11, 5), (12, 5), (13, 10), (14, 5), (15, 3);

-- Gallery images
INSERT INTO gallery (title, description, image, category) VALUES
('Assorted Indian Sweets', 'A beautiful assortment of our finest Indian sweets', 'gallery-1.jpg', 'sweets'),
('Festive Sweet Platter', 'Sweets arranged on brass platters for celebrations', 'gallery-2.jpg', 'festivals'),
('Traditional Laddu', 'Laddu elegantly arranged in a gift box', 'gallery-3.jpg', 'laddu'),
('Sweet Shop Display', 'Our shop display with vibrant sweets', 'gallery-4.jpg', 'shop'),
('Gulab Jamun Special', 'Fresh gulab jamun soaked in syrup', 'gallery-5.jpg', 'sweets'),
('Diwali Gift Hampers', 'Special gift hampers for Diwali', 'gallery-6.jpg', 'gift'),
('Premium Kaju Sweets', 'Cashew-based premium sweets selection', 'gallery-7.jpg', 'sweets'),
('Festive Celebration', 'Sweets for traditional celebrations', 'gallery-8.jpg', 'festivals');

-- Contact messages
INSERT INTO contact_messages (name, email, phone, subject, message) VALUES
('Arjun Reddy', 'arjun@example.com', '9876512345', 'Bulk Order Inquiry', 'I want to order 20 kg of mixed sweets for a wedding. Can you provide a discount?'),
('Sneha Iyer', 'sneha@example.com', '9876523456', 'Gift Box Customization', 'Do you offer customized gift boxes for corporate events?');

-- Sample orders
INSERT INTO orders (customer_id, total_amount, payment_method, payment_status, order_status, delivery_address) VALUES
(1, 1340.00, 'cod', 'pending', 'confirmed', 'MG Road, Bengaluru, Karnataka'),
(2, 920.00, 'upi', 'paid', 'delivered', 'Indiranagar, Bengaluru, Karnataka');

-- Order items for order 1
INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) VALUES
(1, 1, 2, 420.00, 840.00),
(1, 6, 1, 280.00, 280.00),
(1, 8, 1, 220.00, 220.00);

-- Order items for order 2
INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) VALUES
(2, 2, 1, 920.00, 920.00);

-- Payments
INSERT INTO payments (order_id, payment_method, amount, payment_status) VALUES
(1, 'cod', 1340.00, 'pending'),
(2, 'upi', 920.00, 'paid');

-- ============================================================
-- END OF SQL FILE
-- ============================================================
