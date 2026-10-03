-- V10: Align payroll_run month column to VARCHAR(7)

ALTER TABLE payroll_run ALTER COLUMN month TYPE VARCHAR(7);
