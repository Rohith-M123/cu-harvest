-- Seed data for CU Harvest Database
USE cu_harvest;

SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE order_items;
TRUNCATE TABLE cart_items;
TRUNCATE TABLE inventory_logs;
TRUNCATE TABLE admin_logs;
TRUNCATE TABLE orders;
TRUNCATE TABLE products;
TRUNCATE TABLE categories;
TRUNCATE TABLE user_addresses;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS=1;

-- Insert default admin user (password: admin123)
INSERT INTO users (name, email, password_hash, role, phone) VALUES 
('Admin User', 'admin@cu-harvest.com', '$2a$10$8K1p/a0dhrxiowP.dnkgNORTWgdEDHn5L2/xjpEWuC.QQv4rKO9jO', 'ADMIN', '9999999999'),
('John Doe', 'john@example.com', '$2a$10$8K1p/a0dhrxiowP.dnkgNORTWgdEDHn5L2/xjpEWuC.QQv4rKO9jO', 'USER', '8888888888'),
('Jane Smith', 'jane@example.com', '$2a$10$8K1p/a0dhrxiowP.dnkgNORTWgdEDHn5L2/xjpEWuC.QQv4rKO9jO', 'USER', '7777777777');

-- Insert categories
INSERT INTO categories (name, description, image_url) VALUES 
('Vegetables', 'Fresh vegetables directly from farms', '/veg logo.jpeg'),
('Fruits', 'Organic and fresh fruits', '/fruits logo.jpeg'),
('Dairy & Bread', 'Milk, bread and dairy products', '/dairy&bread.jpeg'),
('Snacks', 'Chips, cookies and other snacks', '/snacks logoo.jpeg'),
('Beverages', 'Soft drinks, juices and beverages', '/beverages logo.jpeg'),
('Personal Care', 'Personal hygiene and care products', '/personal car logo.jpeg');

-- Insert products
INSERT INTO products (name, category_id, description, price, original_price, discount_percent, stock_quantity, unit, image_url) VALUES 
('Fresh Spinach', 1, 'Fresh organic spinach leaves, washed and ready to cook.', 20.00, 25.00, 20.00, 50, '250g', '/spinach.jpeg'),
('Organic Bananas', 2, 'Sweet and ripe organic bananas.', 45.00, 50.00, 10.00, 100, '1 dozen', '/banana.jpeg'),
('Full Cream Milk', 3, 'Pasteurized full cream milk.', 33.00, 35.00, 5.00, 200, '500ml', '/milk.jpeg'),
('Potato Chips', 4, 'Crispy salted potato chips.', 20.00, 20.00, 0.00, 150, '50g', '/chips.jpeg'),
('Coca Cola', 5, 'Refreshing carbonated soft drink.', 40.00, 45.00, 11.00, 80, '750ml', '/coco cola.jpeg'),
('Red Onions', 1, 'Fresh red onions directly from farms.', 40.00, 45.00, 11.00, 300, '1kg', '/onions.jpeg'),
('Apple Juice', 5, '100% pure apple juice, no added sugar.', 65.00, 70.00, 7.00, 60, '1L', '/beverages logo.jpeg'),
('Whole Wheat Bread', 3, 'Freshly baked whole wheat bread.', 25.00, 30.00, 17.00, 40, '400g', '/dairy&bread.jpeg'),
('Mixed Fruit Salad', 2, 'Fresh seasonal fruits in a delicious mix.', 85.00, 100.00, 15.00, 25, '500g', '/fruits logo.jpeg'),
('Dairy Milk Chocolate', 4, 'Rich and creamy dairy milk chocolate bar.', 15.00, 20.00, 25.00, 200, '40g', '/snacks logoo.jpeg');

-- Insert sample user addresses
INSERT INTO user_addresses (user_id, address_line1, address_line2, city, state, zip_code, is_default) VALUES 
(2, '123 Main Street', 'Apartment 4B', 'New York', 'NY', '10001', TRUE),
(3, '456 Oak Avenue', '', 'Los Angeles', 'CA', '90210', TRUE);

-- Insert sample orders
INSERT INTO orders (user_id, order_number, total_amount, status, shipping_address, payment_method, payment_status) VALUES 
(2, 'ORD-001', 138.00, 'DELIVERED', '123 Main Street, Apartment 4B, New York, NY 10001', 'Credit Card', 'COMPLETED'),
(3, 'ORD-002', 85.00, 'OUT_FOR_DELIVERY', '456 Oak Avenue, Los Angeles, CA 90210', 'Cash on Delivery', 'PENDING');

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES 
(1, 1, 2, 20.00, 40.00), -- 2x Fresh Spinach
(1, 3, 1, 33.00, 33.00), -- 1x Full Cream Milk
(1, 5, 1, 40.00, 40.00), -- 1x Coca Cola
(1, 10, 1, 15.00, 15.00), -- 1x Dairy Milk Chocolate
(2, 9, 1, 85.00, 85.00); -- 1x Mixed Fruit Salad

-- Insert sample cart items
INSERT INTO cart_items (user_id, product_id, quantity) VALUES 
(2, 2, 1), -- John has 1 Organic Banana in cart
(3, 4, 2); -- Jane has 2 Potato Chips in cart

-- Insert inventory logs
INSERT INTO inventory_logs (product_id, change_type, quantity_change, reason, created_by) VALUES 
(1, 'STOCK_OUT', -2, 'Order #ORD-001', 1),
(3, 'STOCK_OUT', -1, 'Order #ORD-001', 1),
(5, 'STOCK_OUT', -1, 'Order #ORD-001', 1),
(10, 'STOCK_OUT', -1, 'Order #ORD-001', 1),
(9, 'STOCK_OUT', -1, 'Order #ORD-002', 1);