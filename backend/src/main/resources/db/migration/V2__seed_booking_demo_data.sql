INSERT INTO plan (name, description, validity_days, advance_booking_days, max_bookings_per_day)
VALUES
    ('GOLD', 'Demo Gold membership', 365, 14, 2),
    ('SILVER', 'Demo Silver membership', 365, 10, 2),
    ('JUNIOR', 'Demo Junior membership', 365, 7, 2)
ON CONFLICT (name) DO NOTHING;

INSERT INTO court (name, sport, indoor_outdoor, location, slot_duration_minutes, slot_interval_minutes)
VALUES
    ('Tennis 1', 'TENNIS', 'OUTDOOR', 'North court', 60, 30),
    ('Tennis 2', 'TENNIS', 'OUTDOOR', 'North court', 60, 30),
    ('Padel 1', 'PADEL', 'INDOOR', 'Main hall', 60, 30),
    ('Badminton 1', 'BADMINTON', 'INDOOR', 'Main hall', 60, 30),
    ('Cricket Net 1', 'CRICKET_NET', 'OUTDOOR', 'Training yard', 60, 30)
ON CONFLICT (name) DO NOTHING;
