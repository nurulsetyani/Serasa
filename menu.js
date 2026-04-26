// ============================================================
//  DATA WARUNG & MENU
//  Edit file ini untuk mengubah informasi warung dan daftar menu.
//  Tidak perlu sentuh file lain.
// ============================================================

const MENU_DATA = {
  warung: {
    nama: "Warung Nusantara",
    tagline: "Cita Rasa Indonesia di Tanah Arab",
    whatsapp: "6289501099831", // format internasional, tanpa + atau spasi
    mataUang: "SAR",
  },

  kategori: [
    { id: "utama",      nama: "Makanan Utama", icon: "🍛" },
    { id: "soto",       nama: "Sup & Soto",    icon: "🍲" },
    { id: "cemilan",    nama: "Cemilan",       icon: "🥟" },
    { id: "minuman",    nama: "Minuman",       icon: "🥤" },
    { id: "cuci_mulut", nama: "Cuci Mulut",    icon: "🍮" },
  ],

  menu: [
    // ───────── Makanan Utama ─────────
    {
      id: "nasi-goreng-spesial",
      kategori: "utama",
      nama: "Nasi Goreng Spesial",
      deskripsi: "Nasi goreng dengan ayam, telur mata sapi, kerupuk & acar",
      harga: 25,
      favorit: true,
    },
    {
      id: "mie-goreng",
      kategori: "utama",
      nama: "Mie Goreng Jawa",
      deskripsi: "Mie goreng kampung dengan bakso, ayam, dan sayuran segar",
      harga: 22,
    },
    {
      id: "rendang",
      kategori: "utama",
      nama: "Nasi Rendang Padang",
      deskripsi: "Daging sapi rendang dimasak 6 jam, sambal hijau, daun singkong",
      harga: 38,
      favorit: true,
    },
    {
      id: "ayam-penyet",
      kategori: "utama",
      nama: "Ayam Penyet Sambal",
      deskripsi: "Ayam goreng penyet dengan sambal terasi, lalapan & nasi putih",
      harga: 28,
    },
    {
      id: "sate-ayam",
      kategori: "utama",
      nama: "Sate Ayam (10 tusuk)",
      deskripsi: "Sate ayam bumbu kacang, lontong, acar & kerupuk",
      harga: 30,
      favorit: true,
    },
    {
      id: "gado-gado",
      kategori: "utama",
      nama: "Gado-Gado Jakarta",
      deskripsi: "Sayuran rebus, tahu, tempe, telur, siram bumbu kacang",
      harga: 20,
    },

    // ───────── Sup & Soto ─────────
    {
      id: "soto-ayam",
      kategori: "soto",
      nama: "Soto Ayam Lamongan",
      deskripsi: "Kuah kuning, suwiran ayam, koya, telur, nasi",
      harga: 22,
    },
    {
      id: "bakso-malang",
      kategori: "soto",
      nama: "Bakso Malang Komplit",
      deskripsi: "Bakso urat, tahu, pangsit goreng, mie kuning, daun bawang",
      harga: 24,
    },
    {
      id: "rawon",
      kategori: "soto",
      nama: "Rawon Surabaya",
      deskripsi: "Sup daging hitam khas Jawa Timur dengan tauge & sambal",
      harga: 28,
    },

    // ───────── Cemilan ─────────
    {
      id: "pisang-goreng",
      kategori: "cemilan",
      nama: "Pisang Goreng Crispy",
      deskripsi: "Pisang raja goreng tepung, taburan keju & cokelat",
      harga: 12,
    },
    {
      id: "tahu-tempe",
      kategori: "cemilan",
      nama: "Tahu Tempe Goreng",
      deskripsi: "Tahu & tempe goreng, sambal kecap pedas",
      harga: 10,
    },
    {
      id: "martabak-mini",
      kategori: "cemilan",
      nama: "Martabak Telur Mini",
      deskripsi: "Kulit tipis, telur, daging cincang, bawang, acar",
      harga: 15,
    },

    // ───────── Minuman ─────────
    {
      id: "es-teh-manis",
      kategori: "minuman",
      nama: "Es Teh Manis",
      deskripsi: "Teh tubruk asli Indonesia dengan es batu",
      harga: 5,
      favorit: true,
    },
    {
      id: "es-jeruk",
      kategori: "minuman",
      nama: "Es Jeruk Peras",
      deskripsi: "Jeruk peras segar dengan es batu",
      harga: 8,
    },
    {
      id: "kopi-tubruk",
      kategori: "minuman",
      nama: "Kopi Tubruk",
      deskripsi: "Kopi hitam asli Jawa, manis atau pahit",
      harga: 7,
    },
    {
      id: "es-cendol",
      kategori: "minuman",
      nama: "Es Cendol Durian",
      deskripsi: "Cendol hijau, santan, gula merah, durian asli",
      harga: 14,
    },
    {
      id: "air-mineral",
      kategori: "minuman",
      nama: "Air Mineral",
      deskripsi: "Botol 500ml dingin",
      harga: 3,
    },

    // ───────── Cuci Mulut ─────────
    {
      id: "klepon",
      kategori: "cuci_mulut",
      nama: "Klepon (5 buah)",
      deskripsi: "Bola ketan isi gula merah, balut kelapa parut",
      harga: 10,
    },
    {
      id: "bubur-sumsum",
      kategori: "cuci_mulut",
      nama: "Bubur Sumsum",
      deskripsi: "Bubur tepung beras lembut dengan kuah gula merah",
      harga: 12,
    },
  ],
};
