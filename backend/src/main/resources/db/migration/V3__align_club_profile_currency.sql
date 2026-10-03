ALTER TABLE club_profile
    ALTER COLUMN currency TYPE VARCHAR(3)
    USING BTRIM(currency);
