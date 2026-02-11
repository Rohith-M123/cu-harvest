USE cu_harvest;

-- Create a working admin user with proper password hash
DELETE FROM users WHERE email='properadmin@example.com';

INSERT INTO users (name, email, password_hash, role, phone) VALUES 
('Proper Admin', 'properadmin@example.com', '$2a$10$c.5VWI/cL03nT.o/mjdD6eqAuk2kGw5ptA5lDYL115RiUNWvyOXzW', 'ADMIN', '7777777777');

SELECT id, name, email, role FROM users WHERE email='properadmin@example.com';