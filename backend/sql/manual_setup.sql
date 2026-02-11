-- Manual SQL commands to run in MySQL Workbench
-- Connect to MySQL with: mysql -u root -pMolli@1020

USE cu_harvest;

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('USER', 'ADMIN') DEFAULT 'USER',
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_addresses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    category_id INT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    discount_percent DECIMAL(5,2) DEFAULT 0,
    stock_quantity INT DEFAULT 0,
    unit VARCHAR(50),
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') DEFAULT 'PLACED',
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50),
    payment_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS cart_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS inventory_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    change_type ENUM('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT') NOT NULL,
    quantity_change INT NOT NULL,
    reason VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS admin_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- Insert default data
INSERT IGNORE INTO users (name, email, password_hash, role, phone) VALUES 
('Admin User', 'admin@cu-harvest.com', '$2a$10$8K1p/a0dhrxiowP.dnkgNORTWgdEDHn5L2/xjpEWuC.QQv4rKO9jO', 'ADMIN', '9999999999'),
('John Doe', 'john@example.com', '$2a$10$8K1p/a0dhrxiowP.dnkgNORTWgdEDHn5L2/xjpEWuC.QQv4rKO9jO', 'USER', '8888888888'),
('Jane Smith', 'jane@example.com', '$2a$10$8K1p/a0dhrxiowP.dnkgNORTWgdEDHn5L2/xjpEWuC.QQv4rKO9jO', 'USER', '7777777777');

INSERT IGNORE INTO categories (name, description, image_url) VALUES 
('Vegetables', 'Fresh vegetables directly from farms', 'https://picsum.photos/seed/veg/200/200'),
('Fruits', 'Organic and fresh fruits', 'https://picsum.photos/seed/fruit/200/200'),
('Dairy & Bread', 'Milk, bread and dairy products', 'https://picsum.photos/seed/dairy/200/200'),
('Snacks', 'Chips, cookies and other snacks', 'https://picsum.photos/seed/snack/200/200'),
('Beverages', 'Soft drinks, juices and beverages', 'https://picsum.photos/seed/drink/200/200'),
('Personal Care', 'Personal hygiene and care products', 'https://picsum.photos/seed/care/200/200');

INSERT IGNORE INTO products (name, category_id, description, price, original_price, discount_percent, stock_quantity, unit, image_url) VALUES 
('Fresh Spinach', 1, 'Fresh organic spinach leaves, washed and ready to cook.', 20.00, 25.00, 20.00, 50, '250g', 'https://picsum.photos/seed/spinach/300/300'),
('Organic Bananas', 2, 'Sweet and ripe organic bananas.', 45.00, 50.00, 10.00, 100, '1 dozen', 'https://picsum.photos/seed/banana/300/300'),
('Full Cream Milk', 3, 'Pasteurized full cream milk.', 33.00, 35.00, 5.00, 200, '500ml', 'https://picsum.photos/seed/milk/300/300'),
('Potato Chips', 4, 'Crispy salted potato chips.', 20.00, 20.00, 0.00, 150, '50g', 'https://picsum.photos/seed/chips/300/300'),
('Coca Cola', 5, 'Refreshing carbonated soft drink.', 40.00, 45.00, 11.00, 80, '750ml', 'https://picsum.photos/seed/coke/300/300'),
('Red Onions', 1, 'Fresh red onions directly from farms.', 40.00, 45.00, 11.00, 300, '1kg', 'https://picsum.photos/seed/onion/300/300');

-- Insert sample addresses
INSERT IGNORE INTO user_addresses (user_id, address_line1, address_line2, city, state, zip_code, is_default) VALUES 
(2, '123 Main Street', 'Apartment 4B', 'New York', 'NY', '10001', TRUE),
(3, '456 Oak Avenue', '', 'Los Angeles', 'CA', '90210', TRUE);