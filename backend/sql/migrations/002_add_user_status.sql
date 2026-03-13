-- Migration: Add status column to users table
ALTER TABLE users ADD COLUMN status ENUM('ACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE' AFTER is_online;
