-- Clean up any legacy seeded mock notifications
DELETE FROM notification
WHERE title IN (
    'Welcome to Champions Club!',
    'Tournament Floodlights Active',
    'Exclusive Pro Shop Privilege',
    'Zero Double-Booking Engine'
);
