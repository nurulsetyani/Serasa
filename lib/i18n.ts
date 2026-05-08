import { Language } from '@/types'

const translations = {
  id: {
    // Nav
    menu: 'Menu', cart: 'Keranjang', myOrder: 'Pesanan Saya', admin: 'Admin', kitchen: 'Dapur',
    // Menu page
    bestSeller: 'Terlaris', addToCart: 'Tambah', all: 'Semua',
    estTime: 'Est.', minutes: 'mnt', promo: 'Promo', noItems: 'Tidak ada menu',
    search: 'Cari menu...', table: 'Meja',
    featured: 'Unggulan', fullMenu: 'Semua Menu',
    // Categories
    noodles: 'Mie', rice: 'Nasi', main: 'Lauk', drinks: 'Minuman', snacks: 'Camilan',
    signature: 'Signature', mix_rice: 'Nasi Campur', fried_rice: 'Nasi Goreng',
    satay: 'Sate', appetizer: 'Pembuka', meat: 'Daging', chicken: 'Ayam',
    bebek: 'Bebek', rice_bowl: 'Rice Bowl', extra: 'Tambahan',
    seafood: 'Seafood', soup: 'Sup',
    // Cart
    yourCart: 'Keranjang', emptyCart: 'Keranjang masih kosong',
    emptyCartSub: 'Yuk pilih menu favoritmu!',
    remove: 'Hapus', subtotal: 'Subtotal', discount: 'Diskon', total: 'Total',
    checkout: 'Pesan Sekarang', continueShopping: 'Lanjut Pilih Menu', qty: 'Qty',
    continueOrder: 'Lanjut Pesan',
    // Checkout
    checkoutTitle: 'Konfirmasi Pesanan', yourName: 'Nama Anda',
    namePlaceholder: 'cth: Ahmad', tableNumber: 'Nomor Meja',
    notes: 'Catatan', notesPlaceholder: 'cth: Tidak pedas, tanpa bawang...',
    notesOptional: 'Catatan (opsional)',
    placeOrder: 'Buat Pesanan', processing: 'Memproses...',
    orderSummary: 'Ringkasan Pesanan',
    // Order success
    orderReceived: 'Pesanan Diterima!',
    orderProcessing: 'Dapur sedang memproses pesananmu',
    // Order tracking
    trackOrder: 'Lacak Pesanan', orderStatus: 'Status Pesanan',
    estimatedReady: 'Estimasi Siap', orderItems: 'Item Pesanan',
    thankYou: 'Terima Kasih!', orderPlaced: 'Pesanan Dibuat',
    thanksMsg: 'Pesananmu sedang diproses. Kami akan segera menyajikannya!',
    liveUpdate: 'Diperbarui otomatis',
    // Status labels
    pending: 'Menunggu', cooking: 'Sedang Dimasak', ready: 'Siap Diambil', delivered: 'Selesai',
    pendingDesc: 'Pesanan diterima, segera diproses',
    cookingDesc: 'Chef sedang memasak pesananmu',
    readyDesc: 'Pesananmu siap, segera disajikan!',
    deliveredDesc: 'Selamat menikmati!',
    // Payment info
    paymentInfo: 'Instruksi Pembayaran',
    paymentInfoDesc: 'Silakan transfer sesuai jumlah pesanan, lalu kirim bukti ke WhatsApp admin.',
    transferAmount: 'Jumlah Transfer',
    phoneNumber: 'Nomor HP',
    accountNumber: 'No. Rekening',
    accountName: 'Atas Nama',
    sendProof: 'Kirim Bukti Transfer ke Admin',
    downloadReceipt: 'Download Struk',
    // Review
    rateExperience: 'Bagaimana pengalamanmu?', writeReview: 'Tulis ulasanmu...',
    submitReview: 'Kirim Ulasan', thankYouReview: 'Terima kasih atas ulasanmu!',
    reviewSent: 'Ulasan terkirim', skipReview: 'Lewati',
    // Order type & payment
    orderType: 'Jenis Pesanan', dineIn: 'Makan di Tempat', takeAway: 'Bawa Pulang',
    paymentMethod: 'Metode Pembayaran', cash: 'Tunai', online: 'Transfer Bank', qris: 'QRIS',
    // Admin / Kitchen
    allOrders: 'Semua Pesanan', filterStatus: 'Filter', updateStatus: 'Update Status',
    noOrders: 'Tidak ada pesanan', ordersCount: 'pesanan', refresh: 'Refresh',
    startCooking: 'Mulai Masak', markReady: 'Tandai Siap', newOrder: 'Pesanan Baru',
    // Common
    loading: 'Memuat...', error: 'Terjadi kesalahan', tryAgain: 'Coba lagi',
    close: 'Tutup', confirm: 'Konfirmasi', cancel: 'Batal', save: 'Simpan',
    backToMenu: 'Kembali ke Menu', viewOrder: 'Lihat Pesanan',
    orderNumber: 'No. Pesanan', at: 'di', items: 'item',
    orderAgain: 'Pesan Lagi',
    // Upsell
    addDrink: 'Tambah minuman?', addDrinkSub: 'Lengkapi pesananmu dengan minuman segar',
    noThanks: 'Tidak, terima kasih',
  },

  en: {
    menu: 'Menu', cart: 'Cart', myOrder: 'My Order', admin: 'Admin', kitchen: 'Kitchen',
    bestSeller: 'Best Seller', addToCart: 'Add', all: 'All',
    estTime: 'Est.', minutes: 'min', promo: 'Promo', noItems: 'No items available',
    search: 'Search menu...', table: 'Table',
    featured: 'Featured', fullMenu: 'Full Menu',
    noodles: 'Noodles', rice: 'Rice', main: 'Mains', drinks: 'Drinks', snacks: 'Snacks',
    signature: 'Signature', mix_rice: 'Mix Rice', fried_rice: 'Fried Rice',
    satay: 'Satay', appetizer: 'Appetizer', meat: 'Meat', chicken: 'Chicken',
    bebek: 'Bebek', rice_bowl: 'Rice Bowl', extra: 'Extra',
    seafood: 'Seafood', soup: 'Soup',
    yourCart: 'Cart', emptyCart: 'Your cart is empty',
    emptyCartSub: "Let's add some delicious food!",
    remove: 'Remove', subtotal: 'Subtotal', discount: 'Discount', total: 'Total',
    checkout: 'Order Now', continueShopping: 'Continue Shopping', qty: 'Qty',
    continueOrder: 'Continue to Order',
    checkoutTitle: 'Confirm Order', yourName: 'Your Name',
    namePlaceholder: 'e.g. Ahmad', tableNumber: 'Table Number',
    notes: 'Notes', notesPlaceholder: 'e.g. No spicy, extra sauce...',
    notesOptional: 'Notes (optional)',
    placeOrder: 'Place Order', processing: 'Processing...',
    orderSummary: 'Order Summary',
    orderReceived: 'Order Received!',
    orderProcessing: 'The kitchen is preparing your order',
    trackOrder: 'Track Order', orderStatus: 'Order Status',
    estimatedReady: 'Est. Ready', orderItems: 'Order Items',
    thankYou: 'Thank You!', orderPlaced: 'Order Placed',
    thanksMsg: "Your order is being processed. We'll serve it shortly!",
    liveUpdate: 'Auto-updating',
    pending: 'Pending', cooking: 'Cooking', ready: 'Ready', delivered: 'Delivered',
    pendingDesc: 'Order received, being queued',
    cookingDesc: 'Our chef is cooking your order',
    readyDesc: 'Your order is ready to be served!',
    deliveredDesc: 'Enjoy your meal!',
    paymentInfo: 'Payment Instructions',
    paymentInfoDesc: 'Please transfer the exact amount, then send proof to admin WhatsApp.',
    transferAmount: 'Transfer Amount',
    phoneNumber: 'Phone Number',
    accountNumber: 'Account Number',
    accountName: 'Account Name',
    sendProof: 'Send Transfer Proof to Admin',
    downloadReceipt: 'Download Receipt',
    rateExperience: 'How was your experience?', writeReview: 'Write a review...',
    submitReview: 'Submit Review', thankYouReview: 'Thank you for your review!',
    reviewSent: 'Review submitted', skipReview: 'Skip',
    orderType: 'Order Type', dineIn: 'Dine In', takeAway: 'Take Away',
    paymentMethod: 'Payment Method', cash: 'Cash', online: 'Bank Transfer', qris: 'QRIS',
    allOrders: 'All Orders', filterStatus: 'Filter', updateStatus: 'Update Status',
    noOrders: 'No orders', ordersCount: 'orders', refresh: 'Refresh',
    startCooking: 'Start Cooking', markReady: 'Mark Ready', newOrder: 'New Order',
    loading: 'Loading...', error: 'An error occurred', tryAgain: 'Try again',
    close: 'Close', confirm: 'Confirm', cancel: 'Cancel', save: 'Save',
    backToMenu: 'Back to Menu', viewOrder: 'View Order',
    orderNumber: 'Order No.', at: 'at', items: 'items',
    orderAgain: 'Order Again',
    addDrink: 'Add a drink?', addDrinkSub: 'Complete your order with a refreshing drink',
    noThanks: 'No, thanks',
  },

  ar: {
    menu: 'القائمة', cart: 'السلة', myOrder: 'طلبي', admin: 'الإدارة', kitchen: 'المطبخ',
    bestSeller: 'الأكثر مبيعاً', addToCart: 'أضف', all: 'الكل',
    estTime: 'الوقت', minutes: 'دقيقة', promo: 'عرض', noItems: 'لا توجد عناصر',
    search: 'ابحث في القائمة...', table: 'الطاولة',
    featured: 'مميز', fullMenu: 'القائمة الكاملة',
    noodles: 'نودلز', rice: 'أرز', main: 'أطباق رئيسية', drinks: 'مشروبات', snacks: 'وجبات خفيفة',
    signature: 'مميز', mix_rice: 'أرز مخلوط', fried_rice: 'أرز مقلي',
    satay: 'ساتيه', appetizer: 'مقبلات', meat: 'لحوم', chicken: 'دجاج',
    bebek: 'بطة', rice_bowl: 'وعاء الأرز', extra: 'إضافات',
    seafood: 'مأكولات بحرية', soup: 'شوربة',
    yourCart: 'السلة', emptyCart: 'السلة فارغة',
    emptyCartSub: 'أضف أطباقاً لذيذة الآن!',
    remove: 'إزالة', subtotal: 'المجموع الجزئي', discount: 'خصم', total: 'الإجمالي',
    checkout: 'اطلب الآن', continueShopping: 'تابع التسوق', qty: 'الكمية',
    continueOrder: 'متابعة الطلب',
    checkoutTitle: 'تأكيد الطلب', yourName: 'اسمك',
    namePlaceholder: 'مثال: أحمد', tableNumber: 'رقم الطاولة',
    notes: 'ملاحظات', notesPlaceholder: 'مثال: بدون حار، صلصة إضافية...',
    notesOptional: 'ملاحظات (اختياري)',
    placeOrder: 'تقديم الطلب', processing: 'جارٍ المعالجة...',
    orderSummary: 'ملخص الطلب',
    orderReceived: 'تم استلام طلبك!',
    orderProcessing: 'المطبخ يحضّر طلبك الآن',
    trackOrder: 'تتبع الطلب', orderStatus: 'حالة الطلب',
    estimatedReady: 'الوقت المتوقع', orderItems: 'عناصر الطلب',
    thankYou: 'شكراً لك!', orderPlaced: 'تم تقديم الطلب',
    thanksMsg: 'طلبك قيد المعالجة. سنقدمه لك قريباً!',
    liveUpdate: 'يتحدث تلقائياً',
    pending: 'قيد الانتظار', cooking: 'يُطبخ الآن', ready: 'جاهز', delivered: 'تم التسليم',
    pendingDesc: 'تم استلام الطلب، في قائمة الانتظار',
    cookingDesc: 'يقوم الشيف بطهي طلبك',
    readyDesc: 'طلبك جاهز للتقديم!',
    deliveredDesc: 'بالهناء والشفاء!',
    paymentInfo: 'تعليمات الدفع',
    paymentInfoDesc: 'يرجى التحويل بالمبلغ المحدد، ثم إرسال الإثبات على WhatsApp.',
    transferAmount: 'مبلغ التحويل',
    phoneNumber: 'رقم الهاتف',
    accountNumber: 'رقم الحساب',
    accountName: 'اسم صاحب الحساب',
    sendProof: 'أرسل إثبات التحويل للمدير',
    downloadReceipt: 'تحميل الإيصال',
    rateExperience: 'كيف كانت تجربتك؟', writeReview: 'اكتب تقييماً...',
    submitReview: 'إرسال التقييم', thankYouReview: 'شكراً على تقييمك!',
    reviewSent: 'تم الإرسال', skipReview: 'تخطي',
    orderType: 'نوع الطلب', dineIn: 'تناول في المطعم', takeAway: 'سفري',
    paymentMethod: 'طريقة الدفع', cash: 'نقداً', online: 'تحويل بنكي', qris: 'QRIS',
    allOrders: 'جميع الطلبات', filterStatus: 'تصفية', updateStatus: 'تحديث الحالة',
    noOrders: 'لا توجد طلبات', ordersCount: 'طلبات', refresh: 'تحديث',
    startCooking: 'ابدأ الطبخ', markReady: 'تحديد كجاهز', newOrder: 'طلب جديد',
    loading: 'جارٍ التحميل...', error: 'حدث خطأ', tryAgain: 'حاول مرة أخرى',
    close: 'إغلاق', confirm: 'تأكيد', cancel: 'إلغاء', save: 'حفظ',
    backToMenu: 'العودة للقائمة', viewOrder: 'عرض الطلب',
    orderNumber: 'رقم الطلب', at: 'في', items: 'عناصر',
    orderAgain: 'اطلب مجدداً',
    addDrink: 'إضافة مشروب؟', addDrinkSub: 'أكمل طلبك بمشروب منعش',
    noThanks: 'لا، شكراً',
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
