-- Migration: Add Rider fields
-- 1. Modify users table to add RIDER role and is_online status
ALTER TABLE users MODIFY COLUMN role ENUM('USER', 'ADMIN', 'RIDER') DEFAULT 'USER';
ALTER TABLE users ADD COLUMN is_online BOOLEAN DEFAULT FALSE AFTER phone;

-- 2. Modify orders table to add rider_id and assigned_at
ALTER TABLE orders ADD COLUMN rider_id INT AFTER user_id;
ALTER TABLE orders ADD COLUMN assigned_at TIMESTAMP AFTER notes;
ALTER TABLE orders ADD CONSTRAINT fk_orders_rider FOREIGN KEY (rider_id) REFERENCES users(id);
