import { Language } from '@/types'

const translations = {
  id: {
    // Nav
    menu: 'Menu', cart: 'Keranjang', myOrder: 'Pesanan Saya', admin: 'Admin', kitchen: 'Dapur',
    // Menu page
    bestSeller: 'Terlaris', addToCart: 'Tambah', all: 'Semua',
    estTime: 'Est.', minutes: 'mnt', promo: 'Promo', noItems: 'Tidak ada menu',
    search: 'Cari menu...', table: 'Meja',
    // Categories
    noodles: 'Mie', rice: 'Nasi', main: 'Lauk', drinks: 'Minuman', snacks: 'Camilan',
    // Cart
    yourCart: 'Keranjang Anda', emptyCart: 'Keranjang masih kosong',
    emptyCartSub: 'Yuk pilih menu favoritmu!',
    remove: 'Hapus', subtotal: 'Subtotal', discount: 'Diskon', total: 'Total',
    checkout: 'Pesan Sekarang', continueShopping: 'Lanjut Pilih Menu', qty: 'Qty',
    // Upsell
    addDrink: 'Tambah minuman?', addDrinkSub: 'Lengkapi pesananmu dengan minuman segar',
    noThanks: 'Tidak, terima kasih',
    // Checkout
    checkoutTitle: 'Konfirmasi Pesanan', yourName: 'Nama Anda',
    namePlaceholder: 'cth: Ahmad', tableNumber: 'Nomor Meja',
    notes: 'Catatan', notesPlaceholder: 'cth: Tidak pedas, tanpa bawang...',
    placeOrder: 'Buat Pesanan', processing: 'Memproses...',
    orderSummary: 'Ringkasan Pesanan',
    // Order tracking
    trackOrder: 'Lacak Pesanan', orderStatus: 'Status Pesanan',
    estimatedReady: 'Estimasi Siap', orderItems: 'Item Pesanan',
    thankYou: 'Terima Kasih!', orderPlaced: 'Pesanan Dibuat',
    thanksMsg: 'Pesananmu sedang diproses. Kami akan segera menyajikannya!',
    // Status labels
    pending: 'Menunggu', cooking: 'Sedang Dimasak', ready: 'Siap Diambil', delivered: 'Selesai',
    pendingDesc: 'Pesanan diterima, segera diproses',
    cookingDesc: 'Chef sedang memasak pesananmu',
    readyDesc: 'Pesananmu siap, segera disajikan!',
    deliveredDesc: 'Selamat menikmati!',
    // Review
    rateExperience: 'Bagaimana pengalamanmu?', writeReview: 'Tulis ulasanmu...',
    submitReview: 'Kirim Ulasan', thankYouReview: 'Terima kasih atas ulasanmu!',
    reviewSent: 'Ulasan terkirim', skipReview: 'Lewati',
    // Admin
    allOrders: 'Semua Pesanan', filterStatus: 'Filter', updateStatus: 'Update Status',
    noOrders: 'Tidak ada pesanan', ordersCount: 'pesanan', refresh: 'Refresh',
    // Kitchen
    startCooking: 'Mulai Masak', markReady: 'Tandai Siap', newOrder: 'Pesanan Baru',
    // Common
    loading: 'Memuat...', error: 'Terjadi kesalahan', tryAgain: 'Coba lagi',
    close: 'Tutup', confirm: 'Konfirmasi', cancel: 'Batal', save: 'Simpan',
    backToMenu: 'Kembali ke Menu', viewOrder: 'Lihat Pesanan',
    orderNumber: 'No. Pesanan', at: 'di', items: 'item',
  },
  en: {
    menu: 'Menu', cart: 'Cart', myOrder: 'My Order', admin: 'Admin', kitchen: 'Kitchen',
    bestSeller: 'Best Seller', addToCart: 'Add', all: 'All',
    estTime: 'Est.', minutes: 'min', promo: 'Promo', noItems: 'No items available',
    search: 'Search menu...', table: 'Table',
    noodles: 'Noodles', rice: 'Rice', main: 'Mains', drinks: 'Drinks', snacks: 'Snacks',
    yourCart: 'Your Cart', emptyCart: 'Your cart is empty',
    emptyCartSub: "Let's add some delicious food!",
    remove: 'Remove', subtotal: 'Subtotal', discount: 'Discount', total: 'Total',
    checkout: 'Order Now', continueShopping: 'Continue Shopping', qty: 'Qty',
    addDrink: 'Add a drink?', addDrinkSub: 'Complete your order with a refreshing drink',
    noThanks: 'No, thanks',
    checkoutTitle: 'Confirm Order', yourName: 'Your Name',
    namePlaceholder: 'e.g. Ahmad', tableNumber: 'Table Number',
    notes: 'Notes', notesPlaceholder: 'e.g. No spicy, extra sauce...',
    placeOrder: 'Place Order', processing: 'Processing...',
    orderSummary: 'Order Summary',
    trackOrder: 'Track Order', orderStatus: 'Order Status',
    estimatedReady: 'Est. Ready', orderItems: 'Order Items',
    thankYou: 'Thank You!', orderPlaced: 'Order Placed',
    thanksMsg: "Your order is being processed. We'll serve it shortly!",
    pending: 'Pending', cooking: 'Cooking', ready: 'Ready', delivered: 'Delivered',
    pendingDesc: 'Order received, being queued',
    cookingDesc: 'Our chef is cooking your order',
    readyDesc: 'Your order is ready to be served!',
    deliveredDesc: 'Enjoy your meal!',
    rateExperience: 'How was your experience?', writeReview: 'Write a review...',
    submitReview: 'Submit Review', thankYouReview: 'Thank you for your review!',
    reviewSent: 'Review submitted', skipReview: 'Skip',
    allOrders: 'All Orders', filterStatus: 'Filter', updateStatus: 'Update Status',
    noOrders: 'No orders', ordersCount: 'orders', refresh: 'Refresh',
    startCooking: 'Start Cooking', markReady: 'Mark Ready', newOrder: 'New Order',
    loading: 'Loading...', error: 'An error occurred', tryAgain: 'Try again',
    close: 'Close', confirm: 'Confirm', cancel: 'Cancel', save: 'Save',
    backToMenu: 'Back to Menu', viewOrder: 'View Order',
    orderNumber: 'Order', at: 'at', items: 'items',
  },
  ar: {
    menu: 'القائمة', cart: 'السلة', myOrder: 'طلبي', admin: 'الإدارة', kitchen: 'المطبخ',
    bestSeller: 'الأكثر مبيعاً', addToCart: 'أضف', all: 'الكل',
    estTime: 'الوقت', minutes: 'دقيقة', promo: 'عرض', noItems: 'لا توجد عناصر',
    search: 'ابحث في القائمة...', table: 'الطاولة',
    noodles: 'نودلز', rice: 'أرز', main: 'أطباق رئيسية', drinks: 'مشروبات', snacks: 'وجبات خفيفة',
    yourCart: 'سلة التسوق', emptyCart: 'السلة فارغة',
    emptyCartSub: 'أضف أطباقاً لذيذة الآن!',
    remove: 'إزالة', subtotal: 'المجموع الجزئي', discount: 'خصم', total: 'الإجمالي',
    checkout: 'اطلب الآن', continueShopping: 'تابع التسوق', qty: 'الكمية',
    addDrink: 'إضافة مشروب؟', addDrinkSub: 'أكمل طلبك بمشروب منعش',
    noThanks: 'لا، شكراً',
    checkoutTitle: 'تأكيد الطلب', yourName: 'اسمك',
    namePlaceholder: 'مثال: أحمد', tableNumber: 'رقم الطاولة',
    notes: 'ملاحظات', notesPlaceholder: 'مثال: بدون حار، صلصة إضافية...',
    placeOrder: 'تقديم الطلب', processing: 'جارٍ المعالجة...',
    orderSummary: 'ملخص الطلب',
    trackOrder: 'تتبع الطلب', orderStatus: 'حالة الطلب',
    estimatedReady: 'الوقت المتوقع', orderItems: 'عناصر الطلب',
    thankYou: 'شكراً لك!', orderPlaced: 'تم تقديم الطلب',
    thanksMsg: 'طلبك قيد المعالجة. سنقدمه لك قريباً!',
    pending: 'قيد الانتظار', cooking: 'يُطبخ الآن', ready: 'جاهز', delivered: 'تم التسليم',
    pendingDesc: 'تم استلام الطلب، في قائمة الانتظار',
    cookingDesc: 'يقوم الشيف بطهي طلبك',
    readyDesc: 'طلبك جاهز للتقديم!',
    deliveredDesc: 'بالهناء والشفاء!',
    rateExperience: 'كيف كانت تجربتك؟', writeReview: 'اكتب تقييماً...',
    submitReview: 'إرسال التقييم', thankYouReview: 'شكراً على تقييمك!',
    reviewSent: 'تم الإرسال', skipReview: 'تخطي',
    allOrders: 'جميع الطلبات', filterStatus: 'تصفية', updateStatus: 'تحديث الحالة',
    noOrders: 'لا توجد طلبات', ordersCount: 'طلبات', refresh: 'تحديث',
    startCooking: 'ابدأ الطبخ', markReady: 'تحديد كجاهز', newOrder: 'طلب جديد',
    loading: 'جارٍ التحميل...', error: 'حدث خطأ', tryAgain: 'حاول مرة أخرى',
    close: 'إغلاق', confirm: 'تأكيد', cancel: 'إلغاء', save: 'حفظ',
    backToMenu: 'العودة للقائمة', viewOrder: 'عرض الطلب',
    orderNumber: 'طلب', at: 'في', items: 'عناصر',
  },
}

export type TranslationKey = keyof typeof translations.en

export function t(lang: Language, key: TranslationKey): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key
}

export function getItemName(item: { name_id: string; name_en: string; name_ar: string }, lang: Language): string {
  if (lang === 'ar') return item.name_ar
  if (lang === 'id') return item.name_id
  return item.name_en
}

export function getItemDescription(
  item: { description_id?: string; description_en?: string; description_ar?: string },
  lang: Language
): string {
  if (lang === 'ar') return item.description_ar ?? ''
  if (lang === 'id') return item.description_id ?? ''
  return item.description_en ?? ''
}

export function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('ar')) return 'ar'
  if (lang.startsWith('id') || lang.startsWith('ms')) return 'id'
  return 'en'
}
