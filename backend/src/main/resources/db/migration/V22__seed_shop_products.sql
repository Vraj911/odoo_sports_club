-- V22: Seed rich Pro Shop products and variants
-- Covers Rackets, Balls/Shuttles, Footwear, Grips, Strings, Bags, and Accessories

-- ============================================================================
-- 1. PRODUCTS
-- ============================================================================
INSERT INTO product (id, category, name, description, brand, tax_rate, is_active)
VALUES
    -- Rackets
    ('a0000001-0000-0000-0000-000000000001', 'rackets', 'Yonex Astrox 99 Pro', 'Head-heavy power racket with Namd graphite for explosive smashes. Preferred by international doubles players.', 'Yonex', 18.00, true),
    ('a0000001-0000-0000-0000-000000000002', 'rackets', 'Babolat Pure Aero 2024', 'The ultimate spin machine. Features Aeromodular beam and FSI Power tech for devastating topspin.', 'Babolat', 18.00, true),
    ('a0000001-0000-0000-0000-000000000003', 'rackets', 'Wilson Blade 98 v9', 'Control-oriented frame with unique Agiplast material for an enhanced feel. Tournament-level precision.', 'Wilson', 18.00, true),
    ('a0000001-0000-0000-0000-000000000004', 'rackets', 'Head Radical MP 2024', 'Balanced powerhouse with Auxetic 2.0 construction and graphene 360+ tech for all-court versatility.', 'Head', 18.00, true),
    ('a0000001-0000-0000-0000-000000000005', 'rackets', 'Bullpadel Vertex 04 2024', 'Maximum power diamond-shaped padel racket featuring Air React Channel and Curvaktiv system.', 'Bullpadel', 18.00, true),
    ('a0000001-0000-0000-0000-000000000006', 'rackets', 'Dunlop Sonic Core Revelation Pro', 'Aerodynamic frame engineered for incredible head speed and explosive shot-making on squash courts.', 'Dunlop', 18.00, true),

    -- Balls & Shuttles
    ('a0000001-0000-0000-0000-000000000010', 'balls', 'Yonex Aerosensa 30 Feather Shuttles', 'Official tournament grade goose feather shuttlecocks. Precise flight trajectory and unmatched durability.', 'Yonex', 18.00, true),
    ('a0000001-0000-0000-0000-000000000011', 'balls', 'Wilson US Open Extra Duty Tennis Balls', 'Official ball of the US Open Grand Slam. Premium woven felt for maximum durability on hard courts.', 'Wilson', 18.00, true),
    ('a0000001-0000-0000-0000-000000000012', 'balls', 'Dunlop Fort All Court Tennis Balls', 'Classic pressurized tennis ball with HD Core and Fluoro Cloth for tournament-grade responsiveness.', 'Dunlop', 18.00, true),
    ('a0000001-0000-0000-0000-000000000013', 'balls', 'Bullpadel Premium Pro Padel Balls', 'High-density rubber core and synthetic felt engineered for fast-paced padel court rallies.', 'Bullpadel', 18.00, true),
    ('a0000001-0000-0000-0000-000000000014', 'balls', 'Yonex Mavis 350 Nylon Shuttles', 'Precision nylon shuttlecocks with natural cork base. Accurate recovery and long-lasting flight.', 'Yonex', 18.00, true),

    -- Footwear
    ('a0000001-0000-0000-0000-000000000020', 'shoes', 'Asics Gel-Resolution 9', 'Flagship stability tennis shoe with Dynawall technology and AHAR+ high-abrasion outsole.', 'Asics', 18.00, true),
    ('a0000001-0000-0000-0000-000000000021', 'shoes', 'Yonex Power Cushion 65 Z3', 'All-around high performance badminton shoe with Power Cushion+ shock absorption and seamless upper.', 'Yonex', 18.00, true),
    ('a0000001-0000-0000-0000-000000000022', 'shoes', 'Babolat Jet Mach 3 All Court', 'Ultra-lightweight speed tennis shoe with Michelin rubber compound sole and Matryx EVO upper.', 'Babolat', 18.00, true),

    -- Grips & Overwraps
    ('a0000001-0000-0000-0000-000000000030', 'grips', 'Yonex Super Grap Overgrip', 'Industry standard tacky overgrip offering superior sweat absorption and comfortable racket feel.', 'Yonex', 18.00, true),
    ('a0000001-0000-0000-0000-000000000031', 'grips', 'Wilson Pro Overgrip 3-Pack', 'Thin, high-stretch felt for supreme feel. Preferred by Roger Federer and Serena Williams.', 'Wilson', 18.00, true),
    ('a0000001-0000-0000-0000-000000000032', 'grips', 'Babolat Syntec Pro Replacement Grip', 'Direct cushioned replacement grip with polyurethane construction for optimal court feedback.', 'Babolat', 18.00, true),

    -- Strings
    ('a0000001-0000-0000-0000-000000000040', 'strings', 'Yonex BG 80 Badminton String', 'High-modulus Vectran fibre provides crisp feel and ferocious hitting power on hard smashes.', 'Yonex', 18.00, true),
    ('a0000001-0000-0000-0000-000000000041', 'strings', 'Luxilon ALU Power 125 Tennis String', 'Legendary co-polyester monofilament offering unmatched spin, explosive power, and pinpoint precision.', 'Luxilon', 18.00, true),
    ('a0000001-0000-0000-0000-000000000042', 'strings', 'Babolat RPM Blast 125', 'Octagonal section co-polyester string delivering maximum ball bite and topspin trajectory.', 'Babolat', 18.00, true),

    -- Bags
    ('a0000001-0000-0000-0000-000000000050', 'bags', 'Yonex Pro 9-Racket Bag', 'Thermo-guard lining protects rackets from heat. Dedicated shoe tunnel and accessory organizer.', 'Yonex', 18.00, true),
    ('a0000001-0000-0000-0000-000000000051', 'bags', 'Wilson Tour 12-Pack Tennis Bag', 'Dual Thermoguard racket compartments, ventilated shoe compartment, and padded ergonomic straps.', 'Wilson', 18.00, true),

    -- Accessories
    ('a0000001-0000-0000-0000-000000000060', 'accessories', 'Champions Club Wristbands (Pair)', 'Extra-wide terrycloth moisture-absorbing wristbands with embroidered club emblem.', 'Champions Club', 18.00, true),
    ('a0000001-0000-0000-0000-000000000061', 'accessories', 'Champions Club Moisture Headband', 'Breathable performance headband designed to keep sweat out of eyes during high-intensity matches.', 'Champions Club', 18.00, true),
    ('a0000001-0000-0000-0000-000000000062', 'accessories', 'Fast&Up Reload Electrolyte Tube (20 Tabs)', 'Hypotonic hydration tabs packed with 5 vital electrolytes and vitamin C for instant game recovery.', 'Fast&Up', 18.00, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. PRODUCT VARIANTS (WITH STOCK & QUICK SALE FLAGS)
-- ============================================================================
INSERT INTO product_variant (id, product_id, sku, variant_name, attributes, price, tax_rate, on_hand, reserved, reorder_level, is_quick_sale, is_active)
VALUES
    -- Yonex Astrox 99 Pro
    ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'YNX-AX99P-G4', 'Grip G4 (4U)', '{"Grip Size": "G4", "Weight": "4U"}'::JSONB, 14999.00, 18.00, 12, 0, 3, false, true),
    ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'YNX-AX99P-G5', 'Grip G5 (4U)', '{"Grip Size": "G5", "Weight": "4U"}'::JSONB, 14999.00, 18.00, 8, 0, 3, false, true),

    -- Babolat Pure Aero 2024
    ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000002', 'BAB-PA24-G2', 'Grip 2 (4 1/4")', '{"Grip Size": "2"}'::JSONB, 22490.00, 18.00, 6, 0, 2, false, true),
    ('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002', 'BAB-PA24-G3', 'Grip 3 (4 3/8")', '{"Grip Size": "3"}'::JSONB, 22490.00, 18.00, 10, 0, 2, false, true),
    ('b0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000002', 'BAB-PA24-G4', 'Grip 4 (4 1/2")', '{"Grip Size": "4"}'::JSONB, 22490.00, 18.00, 4, 0, 2, false, true),

    -- Wilson Blade 98 v9
    ('b0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000003', 'WIL-BL98-G2', 'Grip 2 (4 1/4")', '{"Grip Size": "2"}'::JSONB, 19999.00, 18.00, 7, 0, 3, false, true),
    ('b0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000003', 'WIL-BL98-G3', 'Grip 3 (4 3/8")', '{"Grip Size": "3"}'::JSONB, 19999.00, 18.00, 5, 0, 3, false, true),

    -- Head Radical MP 2024
    ('b0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000004', 'HEAD-RAD-G2', 'Grip 2 (4 1/4")', '{"Grip Size": "2"}'::JSONB, 18990.00, 18.00, 8, 0, 2, false, true),
    ('b0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000004', 'HEAD-RAD-G3', 'Grip 3 (4 3/8")', '{"Grip Size": "3"}'::JSONB, 18990.00, 18.00, 6, 0, 2, false, true),

    -- Bullpadel Vertex 04 2024
    ('b0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000005', 'BUL-VRT04-STD', 'Standard 365-375g', '{"Weight": "365-375g"}'::JSONB, 24999.00, 18.00, 5, 0, 2, false, true),

    -- Dunlop Sonic Core Revelation Pro
    ('b0000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000006', 'DUN-SCPRO-STD', 'Standard 128g', '{"Weight": "128g"}'::JSONB, 12490.00, 18.00, 6, 0, 2, false, true),

    -- Balls & Shuttles (Quick Sale items!)
    ('b0000001-0000-0000-0000-000000000020', 'a0000001-0000-0000-0000-000000000010', 'YNX-AS30-TUBE', 'Tube of 12 (Speed 77)', '{"Quantity": "12", "Speed": "77"}'::JSONB, 2250.00, 18.00, 45, 0, 10, true, true),
    ('b0000001-0000-0000-0000-000000000021', 'a0000001-0000-0000-0000-000000000011', 'WIL-USOP-CAN3', 'Can of 3 Pressurized Balls', '{"Quantity": "3"}'::JSONB, 650.00, 18.00, 60, 0, 15, true, true),
    ('b0000001-0000-0000-0000-000000000022', 'a0000001-0000-0000-0000-000000000012', 'DUN-FORT-CAN4', 'Can of 4 All-Court Balls', '{"Quantity": "4"}'::JSONB, 799.00, 18.00, 40, 0, 10, true, true),
    ('b0000001-0000-0000-0000-000000000023', 'a0000001-0000-0000-0000-000000000013', 'BUL-PAD-CAN3', 'Can of 3 Padel Balls', '{"Quantity": "3"}'::JSONB, 599.00, 18.00, 35, 0, 8, true, true),
    ('b0000001-0000-0000-0000-000000000024', 'a0000001-0000-0000-0000-000000000014', 'YNX-M350-TUBE6', 'Tube of 6 (Yellow)', '{"Quantity": "6", "Color": "Yellow"}'::JSONB, 750.00, 18.00, 50, 0, 12, true, true),

    -- Footwear
    ('b0000001-0000-0000-0000-000000000030', 'a0000001-0000-0000-0000-000000000020', 'ASC-GELR9-UK8', 'UK 8 / White & Blue', '{"Size": "UK 8", "Color": "White/Blue"}'::JSONB, 11999.00, 18.00, 4, 0, 2, false, true),
    ('b0000001-0000-0000-0000-000000000031', 'a0000001-0000-0000-0000-000000000020', 'ASC-GELR9-UK9', 'UK 9 / White & Blue', '{"Size": "UK 9", "Color": "White/Blue"}'::JSONB, 11999.00, 18.00, 6, 0, 2, false, true),
    ('b0000001-0000-0000-0000-000000000032', 'a0000001-0000-0000-0000-000000000020', 'ASC-GELR9-UK10', 'UK 10 / White & Blue', '{"Size": "UK 10", "Color": "White/Blue"}'::JSONB, 11999.00, 18.00, 5, 0, 2, false, true),

    ('b0000001-0000-0000-0000-000000000033', 'a0000001-0000-0000-0000-000000000021', 'YNX-PC65Z3-UK8', 'UK 8 / White & Tiger', '{"Size": "UK 8", "Color": "White/Tiger"}'::JSONB, 10490.00, 18.00, 5, 0, 2, false, true),
    ('b0000001-0000-0000-0000-000000000034', 'a0000001-0000-0000-0000-000000000021', 'YNX-PC65Z3-UK9', 'UK 9 / White & Tiger', '{"Size": "UK 9", "Color": "White/Tiger"}'::JSONB, 10490.00, 18.00, 7, 0, 2, false, true),

    ('b0000001-0000-0000-0000-000000000035', 'a0000001-0000-0000-0000-000000000022', 'BAB-JM3-UK9', 'UK 9 / Strike Red', '{"Size": "UK 9", "Color": "Strike Red"}'::JSONB, 12999.00, 18.00, 4, 0, 2, false, true),

    -- Grips (Quick Sale items!)
    ('b0000001-0000-0000-0000-000000000040', 'a0000001-0000-0000-0000-000000000030', 'YNX-AC102-WHT', 'White (Pack of 3)', '{"Color": "White", "Pack": "3"}'::JSONB, 399.00, 18.00, 60, 0, 10, true, true),
    ('b0000001-0000-0000-0000-000000000041', 'a0000001-0000-0000-0000-000000000030', 'YNX-AC102-BLK', 'Black (Pack of 3)', '{"Color": "Black", "Pack": "3"}'::JSONB, 399.00, 18.00, 40, 0, 10, true, true),
    ('b0000001-0000-0000-0000-000000000042', 'a0000001-0000-0000-0000-000000000031', 'WIL-PRO-WHT3', 'White (Pack of 3)', '{"Color": "White", "Pack": "3"}'::JSONB, 499.00, 18.00, 45, 0, 10, true, true),
    ('b0000001-0000-0000-0000-000000000043', 'a0000001-0000-0000-0000-000000000032', 'BAB-SYNPRO-BLK', 'Black Replacement Grip', '{"Color": "Black"}'::JSONB, 599.00, 18.00, 20, 0, 5, true, true),

    -- Strings (Quick Sale items!)
    ('b0000001-0000-0000-0000-000000000050', 'a0000001-0000-0000-0000-000000000040', 'YNX-BG80-YEL', 'Yellow (0.68mm gauge)', '{"Color": "Yellow", "Gauge": "0.68mm"}'::JSONB, 750.00, 18.00, 30, 0, 5, true, true),
    ('b0000001-0000-0000-0000-000000000051', 'a0000001-0000-0000-0000-000000000041', 'LUX-ALU-125', 'Silver (1.25mm gauge)', '{"Color": "Silver", "Gauge": "1.25mm"}'::JSONB, 1599.00, 18.00, 25, 0, 5, true, true),
    ('b0000001-0000-0000-0000-000000000052', 'a0000001-0000-0000-0000-000000000042', 'BAB-RPM-125', 'Black (1.25mm gauge)', '{"Color": "Black", "Gauge": "1.25mm"}'::JSONB, 1399.00, 18.00, 22, 0, 5, true, true),

    -- Bags
    ('b0000001-0000-0000-0000-000000000060', 'a0000001-0000-0000-0000-000000000050', 'YNX-BAG9-BLK', '9-Racket / Black & Volt', '{"Capacity": "9 Rackets", "Color": "Black/Volt"}'::JSONB, 6490.00, 18.00, 5, 0, 2, false, true),
    ('b0000001-0000-0000-0000-000000000061', 'a0000001-0000-0000-0000-000000000051', 'WIL-TOUR12-RED', '12-Racket / Classic Red', '{"Capacity": "12 Rackets", "Color": "Red"}'::JSONB, 7990.00, 18.00, 4, 0, 2, false, true),

    -- Accessories (Quick Sale items!)
    ('b0000001-0000-0000-0000-000000000070', 'a0000001-0000-0000-0000-000000000060', 'CC-WRIST-NVY', 'Navy / Volt (Pair)', '{"Color": "Navy/Volt"}'::JSONB, 349.00, 18.00, 50, 0, 10, true, true),
    ('b0000001-0000-0000-0000-000000000071', 'a0000001-0000-0000-0000-000000000061', 'CC-HBAND-WHT', 'White / Navy Accent', '{"Color": "White/Navy"}'::JSONB, 299.00, 18.00, 45, 0, 10, true, true),
    ('b0000001-0000-0000-0000-000000000072', 'a0000001-0000-0000-0000-000000000062', 'FUP-REL-ORG', 'Orange Flavour (20 Tabs)', '{"Flavour": "Orange", "Pack": "20 Tabs"}'::JSONB, 330.00, 18.00, 80, 0, 15, true, true)
ON CONFLICT (id) DO NOTHING;
