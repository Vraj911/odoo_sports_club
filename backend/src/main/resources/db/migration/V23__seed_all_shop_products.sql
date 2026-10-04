-- V23: Seed remaining Pro Shop products and variants
-- Adds NOX Padel, Li-Ning Badminton, Yonex Nanoflare, SG Cricket balls, Nike Footwear, Apparel, Towels, Bottles, etc.

INSERT INTO product (id, category, name, description, brand, tax_rate, is_active)
VALUES
    ('a0000002-0000-0000-0000-000000000005', 'rackets', 'NOX ML10 Pro Cup', 'Professional padel racket with diamond shape and carbon frame for aggressive play.', 'NOX', 18.00, true),
    ('a0000002-0000-0000-0000-000000000006', 'rackets', 'Li-Ning Axforce 80', 'Competition-grade badminton racket with dynamic optimum frame for maximum power transfer.', 'Li-Ning', 18.00, true),
    ('a0000002-0000-0000-0000-000000000007', 'rackets', 'Yonex Nanoflare 700', 'Speed-focused racket with Torayca M40X graphite for lightning-fast drives.', 'Yonex', 18.00, true),

    ('a0000002-0000-0000-0000-000000000010', 'balls', 'Yonex Mavis 350', 'Premium nylon shuttles with consistent flight and durability. Medium speed for indoor play.', 'Yonex', 18.00, true),
    ('a0000002-0000-0000-0000-000000000011', 'balls', 'Wilson US Open Tennis Ball', 'Official ball of the US Open. ITF-approved felt with extra durability for hard court play.', 'Wilson', 18.00, true),
    ('a0000002-0000-0000-0000-000000000012', 'balls', 'Head Padel Pro Ball', 'WPT-approved padel ball with controlled bounce and premium felt.', 'Head', 18.00, true),
    ('a0000002-0000-0000-0000-000000000013', 'balls', 'Yonex Aerosensa 50', 'Tournament-grade goose feather shuttlecocks. Used in BWF-sanctioned events.', 'Yonex', 18.00, true),
    ('a0000002-0000-0000-0000-000000000014', 'balls', 'SG Club Cricket Ball', 'Premium red leather cricket ball for net practice sessions. 4-piece construction.', 'SG', 18.00, true),

    ('a0000002-0000-0000-0000-000000000020', 'shoes', 'Nike Court Air Zoom Vapor Pro 2', 'Tour-level tennis shoe featuring Zoom Air unit and modified herringbone outsole.', 'Nike', 18.00, true),

    ('a0000002-0000-0000-0000-000000000030', 'apparel', 'Champions Club Training Polo', 'Official club polo with moisture-wicking DryFit fabric and embroidered club crest.', 'Champions Club', 18.00, true),
    ('a0000002-0000-0000-0000-000000000031', 'apparel', 'Yonex Tournament Shorts', 'Lightweight tournament shorts with stretch fabric and built-in ball pocket.', 'Yonex', 18.00, true),
    ('a0000002-0000-0000-0000-000000000032', 'apparel', 'Champions Club Wristband Set', 'Cotton-blend wristband and headband set with embroidered club logo.', 'Champions Club', 18.00, true),

    ('a0000002-0000-0000-0000-000000000040', 'grips', 'Yonex Super Grap Overgrip Original', 'Ultra-thin overgrip with excellent sweat absorption. Tour player favourite.', 'Yonex', 18.00, true),
    ('a0000002-0000-0000-0000-000000000041', 'grips', 'Wilson Pro Overgrip Original', 'The worlds #1 selling overgrip. Ultra-thin and absorbent.', 'Wilson', 18.00, true),

    ('a0000002-0000-0000-0000-000000000050', 'strings', 'Yonex BG65 String', 'The most popular badminton string in the world. Excellent durability and repulsion.', 'Yonex', 18.00, true),
    ('a0000002-0000-0000-0000-000000000051', 'strings', 'Luxilon ALU Power Original', 'The #1 string on the ATP Tour. Aluminium-infused co-polyester for control and spin.', 'Luxilon', 18.00, true),

    ('a0000002-0000-0000-0000-000000000060', 'bags', 'Wilson Super Tour Backpack', 'Compact backpack with thermoguard and space for 2 rackets.', 'Wilson', 18.00, true),

    ('a0000002-0000-0000-0000-000000000070', 'accessories', 'Yonex Vibration Stopper', 'Compact vibration dampener for comfortable string bed feel.', 'Yonex', 18.00, true),
    ('a0000002-0000-0000-0000-000000000071', 'accessories', 'Champions Club Sports Towel', 'Quick-dry microfibre sports towel with embroidered club logo. 40x80cm.', 'Champions Club', 18.00, true),
    ('a0000002-0000-0000-0000-000000000072', 'accessories', 'Yonex Sports Bottle 750ml', 'BPA-free sports bottle with leak-proof lid and measuring marks.', 'Yonex', 18.00, true),
    ('a0000002-0000-0000-0000-000000000073', 'accessories', 'Kookaburra Bat Grip Cone', 'Professional bat grip applicator cone for easy cricket bat regripping.', 'Kookaburra', 18.00, true),
    ('a0000002-0000-0000-0000-000000000074', 'accessories', 'Champions Club Headband', 'Moisture-wicking headband with club branding. Keeps sweat out of your eyes.', 'Champions Club', 18.00, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_variant (id, product_id, sku, variant_name, attributes, price, tax_rate, on_hand, reserved, reorder_level, is_quick_sale, is_active)
VALUES
    -- NOX ML10 Pro Cup
    ('b0000002-0000-0000-0000-000000000001', 'a0000002-0000-0000-0000-000000000005', 'NOX-ML10-355', '355g', '{"Weight": "355g"}'::JSONB, 15999.00, 18.00, 4, 0, 2, false, true),
    ('b0000002-0000-0000-0000-000000000002', 'a0000002-0000-0000-0000-000000000005', 'NOX-ML10-365', '365g', '{"Weight": "365g"}'::JSONB, 15999.00, 18.00, 2, 0, 2, false, true),

    -- Li-Ning Axforce 80
    ('b0000002-0000-0000-0000-000000000003', 'a0000002-0000-0000-0000-000000000006', 'LIN-AX80-S1', 'Grip S1', '{"Grip Size": "S1"}'::JSONB, 8999.00, 18.00, 8, 0, 2, false, true),
    ('b0000002-0000-0000-0000-000000000004', 'a0000002-0000-0000-0000-000000000006', 'LIN-AX80-S2', 'Grip S2', '{"Grip Size": "S2"}'::JSONB, 8999.00, 18.00, 6, 0, 2, false, true),

    -- Yonex Nanoflare 700
    ('b0000002-0000-0000-0000-000000000005', 'a0000002-0000-0000-0000-000000000007', 'YNX-NF700-4U-G5', '4U / Grip G5', '{"Weight": "4U", "Grip Size": "G5"}'::JSONB, 11499.00, 18.00, 5, 0, 2, false, true),
    ('b0000002-0000-0000-0000-000000000006', 'a0000002-0000-0000-0000-000000000007', 'YNX-NF700-4U-G6', '4U / Grip G6', '{"Weight": "4U", "Grip Size": "G6"}'::JSONB, 11499.00, 18.00, 4, 0, 2, false, true),

    -- Yonex Mavis 350
    ('b0000002-0000-0000-0000-000000000010', 'a0000002-0000-0000-0000-000000000010', 'YNX-MV350-MED', 'Medium Speed', '{"Speed": "Medium"}'::JSONB, 699.00, 18.00, 35, 0, 10, true, true),
    ('b0000002-0000-0000-0000-000000000011', 'a0000002-0000-0000-0000-000000000010', 'YNX-MV350-FST', 'Fast Speed', '{"Speed": "Fast"}'::JSONB, 699.00, 18.00, 20, 0, 10, true, true),

    -- Wilson US Open Tennis Ball
    ('b0000002-0000-0000-0000-000000000012', 'a0000002-0000-0000-0000-000000000011', 'WIL-USO-3PK', '3 Balls Pack', '{"Pack": "3 Balls"}'::JSONB, 599.00, 18.00, 45, 0, 15, true, true),
    ('b0000002-0000-0000-0000-000000000013', 'a0000002-0000-0000-0000-000000000011', 'WIL-USO-4PK', '4 Balls Pack', '{"Pack": "4 Balls"}'::JSONB, 749.00, 18.00, 30, 0, 10, true, true),

    -- Head Padel Pro Ball
    ('b0000002-0000-0000-0000-000000000014', 'a0000002-0000-0000-0000-000000000012', 'HEAD-PPB-3', '3 Balls Can', '{"Pack": "3 Balls"}'::JSONB, 499.00, 18.00, 50, 0, 10, true, true),

    -- Yonex Aerosensa 50
    ('b0000002-0000-0000-0000-000000000015', 'a0000002-0000-0000-0000-000000000013', 'YNX-AS50-77', 'Speed 77', '{"Speed": "77"}'::JSONB, 2399.00, 18.00, 18, 0, 5, true, true),

    -- SG Club Cricket Ball
    ('b0000002-0000-0000-0000-000000000016', 'a0000002-0000-0000-0000-000000000014', 'SG-CLB-RED', 'Red Leather', '{"Color": "Red"}'::JSONB, 899.00, 18.00, 25, 0, 5, false, true),

    -- Nike Vapor Pro 2
    ('b0000002-0000-0000-0000-000000000020', 'a0000002-0000-0000-0000-000000000020', 'NIK-VP2-9', 'UK 9', '{"Size": "9"}'::JSONB, 13499.00, 18.00, 4, 0, 2, false, true),
    ('b0000002-0000-0000-0000-000000000021', 'a0000002-0000-0000-0000-000000000020', 'NIK-VP2-10', 'UK 10', '{"Size": "10"}'::JSONB, 13499.00, 18.00, 3, 0, 2, false, true),

    -- Apparel: Champions Club Polo
    ('b0000002-0000-0000-0000-000000000030', 'a0000002-0000-0000-0000-000000000030', 'CC-POLO-M-NVY', 'Size M / Navy', '{"Size": "M", "Color": "Navy"}'::JSONB, 1999.00, 18.00, 12, 0, 3, false, true),
    ('b0000002-0000-0000-0000-000000000031', 'a0000002-0000-0000-0000-000000000030', 'CC-POLO-L-NVY', 'Size L / Navy', '{"Size": "L", "Color": "Navy"}'::JSONB, 1999.00, 18.00, 10, 0, 3, false, true),
    ('b0000002-0000-0000-0000-000000000032', 'a0000002-0000-0000-0000-000000000030', 'CC-POLO-M-WHT', 'Size M / White', '{"Size": "M", "Color": "White"}'::JSONB, 1999.00, 18.00, 9, 0, 3, false, true),

    -- Yonex Tournament Shorts
    ('b0000002-0000-0000-0000-000000000033', 'a0000002-0000-0000-0000-000000000031', 'YNX-SHRT-M-BLK', 'Size M / Black', '{"Size": "M", "Color": "Black"}'::JSONB, 1799.00, 18.00, 10, 0, 2, false, true),
    ('b0000002-0000-0000-0000-000000000034', 'a0000002-0000-0000-0000-000000000031', 'YNX-SHRT-L-BLK', 'Size L / Black', '{"Size": "L", "Color": "Black"}'::JSONB, 1799.00, 18.00, 8, 0, 2, false, true),

    -- Wristband Set
    ('b0000002-0000-0000-0000-000000000035', 'a0000002-0000-0000-0000-000000000032', 'CC-WB-WHT', 'White', '{"Color": "White"}'::JSONB, 499.00, 18.00, 20, 0, 5, true, true),
    ('b0000002-0000-0000-0000-000000000036', 'a0000002-0000-0000-0000-000000000032', 'CC-WB-NVY', 'Navy', '{"Color": "Navy"}'::JSONB, 499.00, 18.00, 15, 0, 5, true, true),

    -- Grips
    ('b0000002-0000-0000-0000-000000000040', 'a0000002-0000-0000-0000-000000000040', 'YNX-SG-WHT', 'White', '{"Color": "White"}'::JSONB, 349.00, 18.00, 40, 0, 10, true, true),
    ('b0000002-0000-0000-0000-000000000041', 'a0000002-0000-0000-0000-000000000040', 'YNX-SG-BLK', 'Black', '{"Color": "Black"}'::JSONB, 349.00, 18.00, 35, 0, 10, true, true),
    ('b0000002-0000-0000-0000-000000000042', 'a0000002-0000-0000-0000-000000000041', 'WIL-POG-WHT', 'White', '{"Color": "White"}'::JSONB, 399.00, 18.00, 30, 0, 10, true, true),

    -- Strings
    ('b0000002-0000-0000-0000-000000000050', 'a0000002-0000-0000-0000-000000000050', 'YNX-BG65-WHT', 'White', '{"Color": "White"}'::JSONB, 299.00, 18.00, 50, 0, 10, true, true),
    ('b0000002-0000-0000-0000-000000000051', 'a0000002-0000-0000-0000-000000000050', 'YNX-BG65-BLU', 'Blue', '{"Color": "Blue"}'::JSONB, 299.00, 18.00, 35, 0, 10, true, true),
    ('b0000002-0000-0000-0000-000000000052', 'a0000002-0000-0000-0000-000000000051', 'LUX-ALP-125-ORIG', '1.25mm', '{"Gauge": "1.25mm"}'::JSONB, 1499.00, 18.00, 15, 0, 5, true, true),

    -- Backpack
    ('b0000002-0000-0000-0000-000000000060', 'a0000002-0000-0000-0000-000000000060', 'WIL-STB-BG', 'Black/Green', '{"Color": "Black/Green"}'::JSONB, 4499.00, 18.00, 5, 0, 2, false, true),

    -- Accessories
    ('b0000002-0000-0000-0000-000000000070', 'a0000002-0000-0000-0000-000000000070', 'YNX-VS-BLK', 'Black', '{"Color": "Black"}'::JSONB, 199.00, 18.00, 30, 0, 5, true, true),
    ('b0000002-0000-0000-0000-000000000071', 'a0000002-0000-0000-0000-000000000071', 'CC-TWL-NVY', 'Navy', '{"Color": "Navy"}'::JSONB, 799.00, 18.00, 15, 0, 5, false, true),
    ('b0000002-0000-0000-0000-000000000072', 'a0000002-0000-0000-0000-000000000072', 'YNX-BTL-BLK', 'Black 750ml', '{"Color": "Black"}'::JSONB, 599.00, 18.00, 18, 0, 5, false, true),
    ('b0000002-0000-0000-0000-000000000073', 'a0000002-0000-0000-0000-000000000073', 'KOO-GRIP-CONE', 'Standard', '{}'::JSONB, 249.00, 18.00, 12, 0, 3, false, true),
    ('b0000002-0000-0000-0000-000000000074', 'a0000002-0000-0000-0000-000000000074', 'CC-HB-WHT', 'White', '{"Color": "White"}'::JSONB, 299.00, 18.00, 20, 0, 5, true, true)
ON CONFLICT (id) DO NOTHING;
