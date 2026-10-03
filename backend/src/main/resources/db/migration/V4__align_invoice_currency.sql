ALTER TABLE invoice
    ALTER COLUMN currency TYPE VARCHAR(3)
    USING BTRIM(currency);
