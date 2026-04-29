import { MenuItem } from '@/types'

// Real food photos from Unsplash (free to use)
const IMG = {
  mieAyam:    'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=300&fit=crop&q=80',
  mieSeafood: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop&q=80',
  bihun:      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop&q=80',
  nasiGoreng: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop&q=80',
  nasiUduk:   'https://images.unsplash.com/photo-1563897539633-7374c5f9a41b?w=400&h=300&fit=crop&q=80',
  rendang:    'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&q=80',
  sate:       'https://images.unsplash.com/photo-1555939594-58329b49afa4?w=400&h=300&fit=crop&q=80',
  ayamBakar:  'https://images.unsplash.com/photo-1562802378-063ec186a863?w=400&h=300&fit=crop&q=80',
  gadoGado:   'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&q=80',
  cendol:     'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop&q=80',
  icedTea:    'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop&q=80',
  alpukat:    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop&q=80',
  dawet:      'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=400&h=300&fit=crop&q=80',
}

export const MOCK_MENU: MenuItem[] = [
  // NOODLES
  {
    id: 'mock-1', restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
    name_id: 'Mie Goreng Ayam', name_en: 'Chicken Fried Noodles', name_ar: 'نودلز مقلية بالدجاج',
    description_id: 'Mie kuning ditumis dengan ayam marinasi dan sayuran renyah',
    description_en: 'Indonesian stir-fried noodles with marinated chicken and crunchy vegetables',
    description_ar: 'نودلز إندونيسية مقلية مع دجاج متبّل وخضروات مقرمشة',
    price: 25, cook_time: 15, image: IMG.mieAyam, is_best_seller: true, category: 'noodles', is_available: true,
  },
  {
    id: 'mock-2', restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
    name_id: 'Mie Goreng Seafood', name_en: 'Seafood Fried Noodles', name_ar: 'نودلز مقلية بالمأكولات البحرية',
    description_id: 'Mie goreng dengan udang, cumi, dan sayuran segar',
    description_en: 'Stir-fried noodles with fresh shrimp, squid and vegetables',
    description_ar: 'نودلز مقلية مع الروبيان والحبار والخضروات الطازجة',
    price: 30, cook_time: 18, image: IMG.mieSeafood, is_best_seller: false, category: 'noodles', is_available: true,
  },
  {
    id: 'mock-2b', restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
    name_id: 'Bihun Goreng Spesial', name_en: 'Special Fried Vermicelli', name_ar: 'شعيرية مقلية خاصة',
    description_id: 'Bihun goreng dengan telur, ayam, dan bumbu spesial',
    description_en: 'Fried rice vermicelli with egg, chicken and special spices',
    description_ar: 'شعيرية مقلية مع البيض والدجاج والتوابل الخاصة',
    price: 22, cook_time: 12, image: IMG.bihun, is_best_seller: false, category: 'noodles', is_available: true,
  },
  // RICE
  {
    id: 'mock-3', restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
    name_id: 'Nasi Goreng Spesial', name_en: 'Special Fried Rice', name_ar: 'أرز مقلي خاص',
    description_id: 'Nasi goreng dengan telur mata sapi, ayam suwir, dan sambal terasi',
    description_en: 'Fried rice with sunny-side egg, shredded chicken and sambal',
    description_ar: 'أرز مقلي مع البيض والدجاج المبشور وصلصة السمبال',
    price: 22, cook_time: 12, image: IMG.nasiGoreng, is_best_seller: true, category: 'rice', is_available: true,
  },
  {
    id: 'mock-4', restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
    name_id: 'Nasi Uduk Komplit', name_en: 'Complete Coconut Rice', name_ar: 'أرز بجوز الهند الكامل',
    description_id: 'Nasi dimasak dengan santan, dilengkapi ayam goreng dan sambal',
    description_en: 'Fragrant coconut rice with fried chicken and sambal',
    description_ar: 'أرز معطر بحليب جوز الهند مع الدجاج المقلي',
    price: 28, cook_time: 10, image: IMG.nasiUduk, is_best_seller: false, category: 'rice', is_available: true,
  },
  // MAIN
  {
    id: 'mock-5', restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
    name_id: 'Rendang Sapi', name_en: 'Beef Rendang', name_ar: 'ريندانق لحم البقر',
    description_id: 'Daging sapi empuk dimasak dengan santan dan 40 rempah pilihan',
    description_en: 'Tender slow-cooked beef in coconut milk with 40 aromatic spices',
    description_ar: 'لحم بقر طري مطبوخ ببطء في حليب جوز الهند مع 40 توابل عطرة',
    price: 35, cook_time: 25, image: IMG.rendang, is_best_seller: true, category: 'main', is_available: true,
  },
  {
    id: 'mock-6', restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
    name_id: 'Sate Ayam Madura', name_en: 'Madura Chicken Satay', name_ar: 'ساتيه الدجاج مادورا',
    description_id: 'Sate ayam khas Madura dengan bumbu kacang special dan lontong',
    description_en: 'Authentic chicken skewers with special peanut sauce and rice cake',
    description_ar: 'أسياخ دجاج أصيلة مع صلصة الفول السوداني الخاصة',
    price: 28, cook_time: 20, image: IMG.sate, is_best_seller: true, category: 'main', is_available: true,
  },
  {
    id: 'mock-7', restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
    name_id: 'Ayam Bakar Bumbu Bali', name_en: 'Balinese Grilled Chicken', name_ar: 'دجاج مشوي بالي',
    description_id: 'Ayam bakar bumbu Bali yang kaya rempah, disajikan dengan lalapan',
    description_en: 'Bali-style grilled chicken marinated in rich spices',
    description_ar: 'دجاج مشوي على طريقة بالي مع الخضروات الطازجة',
    price: 32, cook_time: 22, image: IMG.ayamBakar, is_best_seller: false, category: 'main', is_available: true,
  },
  {
    id: 'mock-8', restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
    name_id: 'Gado-Gado Jakarta', name_en: 'Jakarta Gado-Gado', name_ar: 'سلطة غادو غادو جاكرتا',
    description_id: 'Sayuran segar dengan bumbu kacang khas Jakarta dan kerupuk udang',
    description_en: 'Fresh vegetables with peanut sauce and prawn crackers',
    description_ar: 'خضروات طازجة مع صلصة الفول السوداني والكراكر',
    price: 20, cook_time: 10, image: IMG.gadoGado, is_best_seller: false, category: 'main', is_available: true,
  },
  // DRINKS
  {
    id: 'mock-9', restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
    name_id: 'Es Cendol', name_en: 'Cendol Ice', name_ar: 'مشروب سيندول المثلج',
    description_id: 'Minuman segar dengan cendol pandan, santan, dan gula merah Jawa',
    description_en: 'Refreshing pandan jelly drink with coconut milk and palm sugar',
    description_ar: 'مشروب منعش بجيلي الباندان وحليب جوز الهند',
    price: 12, cook_time: 5, image: IMG.cendol, is_best_seller: true, category: 'drinks', is_available: true,
  },
  {
    id: 'mock-10', restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
    name_id: 'Es Teh Manis', name_en: 'Sweet Iced Tea', name_ar: 'شاي مثلج محلى',
    description_id: 'Teh hitam manis diseduh segar dengan es batu',
    description_en: 'Freshly brewed sweet Indonesian black tea over ice',
    description_ar: 'شاي أسود إندونيسي محلى طازج مع الثلج',
    price: 8, cook_time: 3, image: IMG.icedTea, is_best_seller: false, category: 'drinks', is_available: true,
  },
  {
    id: 'mock-11', restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
    name_id: 'Jus Alpukat', name_en: 'Avocado Juice', name_ar: 'عصير الأفوكادو',
    description_id: 'Jus alpukat segar diblender dengan susu full cream',
    description_en: 'Fresh avocado blended with full cream milk and sugar',
    description_ar: 'أفوكادو طازج ممزوج بالحليب الكامل الدسم',
    price: 15, cook_time: 5, image: IMG.alpukat, is_best_seller: false, category: 'drinks', is_available: true,
  },
  {
    id: 'mock-12', restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
    name_id: 'Es Dawet Ayu', name_en: 'Dawet Ayu Ice', name_ar: 'مشروب داووت أيو',
    description_id: 'Minuman tradisional Jawa dengan dawet hijau dan santan',
    description_en: 'Traditional Javanese sweet drink with green dawet and coconut milk',
    description_ar: 'مشروب جاوي تقليدي بالداووت الأخضر وحليب جوز الهند',
    price: 12, cook_time: 5, image: IMG.dawet, is_best_seller: false, category: 'drinks', is_available: true,
  },
]

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const IS_MOCK_MODE =
  process.env.NEXT_PUBLIC_MOCK_MODE === 'true' ||
  !supabaseUrl ||
  supabaseUrl.includes('placeholder') ||
  !supabaseUrl.startsWith('https://')
