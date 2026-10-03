-- V16: Add price column to plan and seed tier pricing
ALTER TABLE plan ADD COLUMN IF NOT EXISTS price NUMERIC(12,2) NOT NULL DEFAULT 0;

UPDATE plan SET price = 12000.00 WHERE name = 'GOLD' AND price = 0;
UPDATE plan SET price = 8000.00 WHERE name = 'SILVER' AND price = 0;
UPDATE plan SET price = 5000.00 WHERE name = 'JUNIOR' AND price = 0;
