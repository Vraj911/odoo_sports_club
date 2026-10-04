-- V20: Add missing columns for bar_order_line and menu_item

ALTER TABLE bar_order_line ADD COLUMN IF NOT EXISTS notes VARCHAR(200);
ALTER TABLE menu_item ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE menu_item ADD COLUMN IF NOT EXISTS station VARCHAR(20) NOT NULL DEFAULT 'KITCHEN';
