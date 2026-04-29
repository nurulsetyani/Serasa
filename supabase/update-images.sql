-- ============================================================
-- UPDATE MENU IMAGES — Run in Supabase SQL Editor
-- ============================================================

UPDATE menu SET image = 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=300&fit=crop&q=80'
WHERE name_en = 'Chicken Fried Noodles';

UPDATE menu SET image = 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop&q=80'
WHERE name_en = 'Seafood Fried Noodles';

UPDATE menu SET image = 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop&q=80'
WHERE name_en = 'Special Fried Vermicelli';

UPDATE menu SET image = 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop&q=80'
WHERE name_en = 'Special Fried Rice';

UPDATE menu SET image = 'https://images.unsplash.com/photo-1563897539633-7374c5f9a41b?w=400&h=300&fit=crop&q=80'
WHERE name_en = 'Complete Coconut Rice';

UPDATE menu SET image = 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&q=80'
WHERE name_en = 'Beef Rendang';

UPDATE menu SET image = 'https://images.unsplash.com/photo-1555939594-58329b49afa4?w=400&h=300&fit=crop&q=80'
WHERE name_en = 'Madura Chicken Satay';

UPDATE menu SET image = 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=400&h=300&fit=crop&q=80'
WHERE name_en = 'Balinese Grilled Chicken';

UPDATE menu SET image = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&q=80'
WHERE name_en = 'Jakarta Gado-Gado';

UPDATE menu SET image = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop&q=80'
WHERE name_en = 'Cendol Ice';

UPDATE menu SET image = 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop&q=80'
WHERE name_en = 'Sweet Iced Tea';

UPDATE menu SET image = 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop&q=80'
WHERE name_en = 'Avocado Juice';

UPDATE menu SET image = 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=400&h=300&fit=crop&q=80'
WHERE name_en = 'Dawet Ayu Ice';

-- Verify
SELECT name_en, image FROM menu ORDER BY category, name_en;
