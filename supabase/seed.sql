-- ============================================================
-- SERASA QR MENU — Seed Data
-- Run AFTER schema.sql
-- ============================================================

-- ── Restaurant ────────────────────────────────────────────
INSERT INTO restaurants (id, name) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Serasa Indonesian Restaurant')
ON CONFLICT (id) DO NOTHING;

-- ── Tables ────────────────────────────────────────────────
INSERT INTO tables (restaurant_id, table_number) VALUES
('550e8400-e29b-41d4-a716-446655440000', '1'),
('550e8400-e29b-41d4-a716-446655440000', '2'),
('550e8400-e29b-41d4-a716-446655440000', '3'),
('550e8400-e29b-41d4-a716-446655440000', '4'),
('550e8400-e29b-41d4-a716-446655440000', '5'),
('550e8400-e29b-41d4-a716-446655440000', '6'),
('550e8400-e29b-41d4-a716-446655440000', '7'),
('550e8400-e29b-41d4-a716-446655440000', '8')
ON CONFLICT DO NOTHING;

-- ── Menu Items ────────────────────────────────────────────
INSERT INTO menu
  (restaurant_id, name_id, name_en, name_ar,
   description_id, description_en, description_ar,
   price, cook_time, image, is_best_seller, category)
VALUES

-- NOODLES ─────────────────────────────────────────────────
('550e8400-e29b-41d4-a716-446655440000',
 'Mie Goreng Ayam', 'Chicken Fried Noodles', 'نودلز مقلية بالدجاج',
 'Mie kuning ditumis dengan ayam marinasi dan sayuran renyah',
 'Indonesian stir-fried noodles with marinated chicken and crunchy vegetables',
 'نودلز إندونيسية مقلية مع دجاج متبّل وخضروات مقرمشة',
 25, 15,
 'https://placehold.co/400x300/1a1a1a/D4AF37?text=Mie+Goreng+Ayam',
 true, 'noodles'),

('550e8400-e29b-41d4-a716-446655440000',
 'Mie Goreng Seafood', 'Seafood Fried Noodles', 'نودلز مقلية بالمأكولات البحرية',
 'Mie goreng dengan udang, cumi, dan sayuran segar pilihan',
 'Stir-fried noodles with fresh shrimp, squid and vegetables',
 'نودلز مقلية مع الروبيان والحبار والخضروات الطازجة',
 30, 18,
 'https://placehold.co/400x300/1a1a1a/D4AF37?text=Mie+Seafood',
 false, 'noodles'),

('550e8400-e29b-41d4-a716-446655440000',
 'Bihun Goreng Spesial', 'Special Fried Vermicelli', 'شعيرية مقلية خاصة',
 'Bihun goreng dengan telur, ayam, dan bumbu spesial',
 'Fried rice vermicelli with egg, chicken and special spices',
 'شعيرية مقلية مع البيض والدجاج والتوابل الخاصة',
 22, 12,
 'https://placehold.co/400x300/1a1a1a/D4AF37?text=Bihun+Goreng',
 false, 'noodles'),

-- RICE ────────────────────────────────────────────────────
('550e8400-e29b-41d4-a716-446655440000',
 'Nasi Goreng Spesial', 'Special Fried Rice', 'أرز مقلي خاص',
 'Nasi goreng dengan telur mata sapi, ayam suwir, dan sambal terasi',
 'Fried rice with sunny-side egg, shredded chicken and sambal shrimp paste',
 'أرز مقلي مع البيض والدجاج المبشور وصلصة السمبال',
 22, 12,
 'https://placehold.co/400x300/1a1a1a/D4AF37?text=Nasi+Goreng',
 true, 'rice'),

('550e8400-e29b-41d4-a716-446655440000',
 'Nasi Uduk Komplit', 'Complete Coconut Rice', 'أرز بجوز الهند الكامل',
 'Nasi dimasak dengan santan, dilengkapi ayam goreng, tempe, dan sambal',
 'Fragrant coconut rice with fried chicken, tempe and sambal',
 'أرز معطر بحليب جوز الهند مع الدجاج المقلي والتيمبي والصلصة',
 28, 10,
 'https://placehold.co/400x300/1a1a1a/D4AF37?text=Nasi+Uduk',
 false, 'rice'),

-- MAINS ───────────────────────────────────────────────────
('550e8400-e29b-41d4-a716-446655440000',
 'Rendang Sapi', 'Beef Rendang', 'ريندانق لحم البقر',
 'Daging sapi empuk dimasak dengan santan dan 40 rempah pilihan, khas Padang',
 'Tender slow-cooked beef in coconut milk with 40 aromatic Padang spices',
 'لحم بقر طري مطبوخ ببطء في حليب جوز الهند مع 40 توابل عطرة من باتانق',
 35, 25,
 'https://placehold.co/400x300/1a1a1a/D4AF37?text=Rendang+Sapi',
 true, 'main'),

('550e8400-e29b-41d4-a716-446655440000',
 'Sate Ayam Madura', 'Madura Chicken Satay', 'ساتيه الدجاج مادورا',
 'Sate ayam khas Madura dengan bumbu kacang special dan lontong',
 'Authentic Madura chicken skewers with special peanut sauce and rice cake',
 'أسياخ الدجاج الأصيلة مع صلصة الفول السوداني الخاصة وكعكة الأرز',
 28, 20,
 'https://placehold.co/400x300/1a1a1a/D4AF37?text=Sate+Ayam',
 true, 'main'),

('550e8400-e29b-41d4-a716-446655440000',
 'Ayam Bakar Bumbu Bali', 'Balinese Grilled Chicken', 'دجاج مشوي بالي',
 'Ayam bakar bumbu Bali yang kaya rempah, disajikan dengan lalapan',
 'Bali-style grilled chicken marinated in rich spices, served with fresh vegetables',
 'دجاج مشوي على طريقة بالي مع الخضروات الطازجة',
 32, 22,
 'https://placehold.co/400x300/1a1a1a/D4AF37?text=Ayam+Bakar',
 false, 'main'),

('550e8400-e29b-41d4-a716-446655440000',
 'Gado-Gado Jakarta', 'Jakarta Gado-Gado', 'سلطة غادو غادو جاكرتا',
 'Sayuran segar dengan bumbu kacang khas Jakarta dan kerupuk udang',
 'Fresh vegetables with Jakarta-style peanut sauce and prawn crackers',
 'خضروات طازجة مع صلصة الفول السوداني على طريقة جاكرتا والكراكر',
 20, 10,
 'https://placehold.co/400x300/1a1a1a/D4AF37?text=Gado+Gado',
 false, 'main'),

-- DRINKS ──────────────────────────────────────────────────
('550e8400-e29b-41d4-a716-446655440000',
 'Es Cendol', 'Cendol Ice', 'مشروب سيندول المثلج',
 'Minuman segar dengan cendol pandan, santan, dan gula merah Jawa',
 'Refreshing pandan jelly drink with coconut milk and Javanese palm sugar',
 'مشروب منعش بجيلي الباندان وحليب جوز الهند وسكر النخيل',
 12, 5,
 'https://placehold.co/400x300/1a1a1a/D4AF37?text=Es+Cendol',
 true, 'drinks'),

('550e8400-e29b-41d4-a716-446655440000',
 'Es Teh Manis', 'Sweet Iced Tea', 'شاي مثلج محلى',
 'Teh hitam manis diseduh segar dengan es batu pilihan',
 'Freshly brewed sweet Indonesian black tea over ice',
 'شاي أسود إندونيسي محلى طازج مع الثلج',
 8, 3,
 'https://placehold.co/400x300/1a1a1a/D4AF37?text=Es+Teh',
 false, 'drinks'),

('550e8400-e29b-41d4-a716-446655440000',
 'Jus Alpukat', 'Avocado Juice', 'عصير الأفوكادو',
 'Jus alpukat segar diblender dengan susu full cream dan sedikit gula',
 'Fresh avocado blended with full cream milk and a touch of sugar',
 'أفوكادو طازج ممزوج بالحليب الكامل الدسم وقليل من السكر',
 15, 5,
 'https://placehold.co/400x300/1a1a1a/D4AF37?text=Jus+Alpukat',
 false, 'drinks'),

('550e8400-e29b-41d4-a716-446655440000',
 'Es Dawet Ayu', 'Dawet Ayu Ice', 'مشروب داووت أيو',
 'Minuman tradisional Jawa dengan dawet hijau, santan, dan gula merah cair',
 'Traditional Javanese sweet drink with green dawet, coconut milk and palm syrup',
 'مشروب جاوي تقليدي بالداووت الأخضر وحليب جوز الهند وشراب النخيل',
 12, 5,
 'https://placehold.co/400x300/1a1a1a/D4AF37?text=Es+Dawet',
 false, 'drinks');
