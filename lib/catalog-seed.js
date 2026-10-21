export const categories = [
  { id: 'c1', slug: 'elektronik', name: 'Elektronik', emoji: '📱', hue: ['#0b7a3b', '#12b981'] },
  { id: 'c2', slug: 'komputer', name: 'Komputer & Aksesoris', emoji: '💻', hue: ['#166534', '#4ade80'] },
  { id: 'c3', slug: 'rumah-tangga', name: 'Rumah Tangga', emoji: '🏠', hue: ['#065f46', '#34d399'] },
  { id: 'c4', slug: 'fashion', name: 'Fashion Pria', emoji: '👕', hue: ['#14532d', '#86efac'] },
  { id: 'c5', slug: 'kecantikan', name: 'Kecantikan', emoji: '🧴', hue: ['#047857', '#6ee7b7'] },
  { id: 'c6', slug: 'hobi', name: 'Hobi & Olahraga', emoji: '⚽', hue: ['#15803d', '#a3e635'] },
  { id: 'c7', slug: 'ibu-anak', name: 'Ibu & Anak', emoji: '🍼', hue: ['#0d9488', '#5eead4'] },
  { id: 'c8', slug: 'makanan', name: 'Makanan & Minuman', emoji: '🍜', hue: ['#3f6212', '#bef264'] },
];

export const sellers = [
  { id: 's1', name: 'Madu Nusantara Official', city: 'Bandung', rating: 4.9, badge: 'Official Store', sold: 21450 },
  { id: 's2', name: 'BeeTech Store', city: 'Jakarta Pusat', rating: 4.8, badge: 'Power Merchant Pro', sold: 18320 },
  { id: 's3', name: 'Lebah Home Living', city: 'Surabaya', rating: 4.7, badge: 'Power Merchant', sold: 9120 },
  { id: 's4', name: 'Sari Bunga Fashion', city: 'Bandung', rating: 4.8, badge: 'Official Store', sold: 30210 },
  { id: 's5', name: 'Sarang Skincare', city: 'Yogyakarta', rating: 4.9, badge: 'Power Merchant Pro', sold: 45100 },
  { id: 's6', name: 'Propolis Sport', city: 'Medan', rating: 4.6, badge: 'Power Merchant', sold: 5120 },
];

export const shippingServices = [
  { code: 'reg', name: 'Reguler · Lebah Express', eta: '2-4 hari', price: 9000 },
  { code: 'sst', name: 'Same Day · Lebah Instan', eta: 'Hari ini (1-3 jam)', price: 24000 },
  { code: 'cargo', name: 'Kargo · Lebah Besar', eta: '3-6 hari', price: 15000 },
  { code: 'pick', name: 'Ambil di tempat penjual', eta: 'Siap dalam 1 hari', price: 0 },
];

export const paymentMethods = [
  { code: 'qris', name: 'QRIS (semua bank & e-wallet)', fee: 0, kind: 'scan' },
  { code: 'va_bca', name: 'Virtual Account BCA', fee: 4000, kind: 'transfer' },
  { code: 'va_bri', name: 'Virtual Account BRI', fee: 4000, kind: 'transfer' },
  { code: 'gopay', name: 'GoPay', fee: 1500, kind: 'wallet' },
  { code: 'dana', name: 'DANA', fee: 1000, kind: 'wallet' },
  { code: 'lebacash', name: 'Saldo LebaCash', fee: 0, kind: 'balance' },
  { code: 'cod', name: 'Bayar di tempat (COD)', fee: 2500, kind: 'cod' },
];

export const vouchers = [
  { code: 'LEBA10', kind: 'percent', value: 10, maxDiscount: 25000, minSubtotal: 50000, label: 'Diskon 10% (maks. Rp25.000)' },
  { code: 'ONGKIRGRATIS', kind: 'shipping', value: 10000, maxDiscount: 10000, minSubtotal: 100000, label: 'Potongan ongkir Rp10.000' },
];

const raw = [
  ['Smartphone Lebah Pro 5G 256GB', 'elektronik', 's2', 4299000, 4899000, 42, '📱'],
  ['TWS Earbuds Pollen Air 3', 'elektronik', 's2', 389000, 549000, 180, '🎧'],
  ['Smartwatch HoneyFit S2', 'elektronik', 's6', 749000, 999000, 65, '⌚'],
  ['Powerbank 20.000mAh Fast Charge', 'elektronik', 's2', 259000, 349000, 240, '🔋'],
  ['Laptop WorkHive 14 inci i5/16GB', 'komputer', 's2', 9899000, 11499000, 12, '💻'],
  ['Mechanical Keyboard 68 Key Hotswap', 'komputer', 's2', 629000, 799000, 88, '⌨️'],
  ['Mouse Ergonomis Nectar Grip', 'komputer', 's2', 189000, 259000, 156, '🖱️'],
  ['Monitor 27 inci QHD 165Hz', 'komputer', 's2', 2799000, 3299000, 25, '🖥️'],
  ['Rice Cooker Digital 1.8L', 'rumah-tangga', 's3', 449000, 599000, 96, '🍚'],
  ['Air Fryer 5L Low Watt', 'rumah-tangga', 's3', 699000, 949000, 54, '🍟'],
  ['Vacuum Cleaner Wireless 22kPa', 'rumah-tangga', 's3', 1249000, 1599000, 31, '🧹'],
  ['Set Alat Masak Granite 8pcs', 'rumah-tangga', 's3', 399000, 620000, 74, '🍳'],
  ['Kemeja Linen Pria Oversize', 'fashion', 's4', 159000, 249000, 320, '👔'],
  ['Sneakers Meadow Runner', 'fashion', 's4', 429000, 649000, 145, '👟'],
  ['Jaket Fieldwork Water Repellent', 'fashion', 's4', 289000, 420000, 98, '🧥'],
  ['Madu Hutan Murni 650ml', 'makanan', 's1', 145000, 199000, 500, '🍯'],
  ['Propolis Drop 30ml', 'makanan', 's1', 95000, 139000, 260, '💧'],
  ['Bee Pollen Granule 250g', 'makanan', 's1', 119000, 165000, 190, '🌾'],
  ['Serum Vitamin C Brightening', 'kecantikan', 's5', 79000, 129000, 430, '🧪'],
  ['Sunscreen Gel SPF 50 PA++++', 'kecantikan', 's5', 68000, 99000, 388, '☀️'],
  ['Lip Tint Honey Gloss', 'kecantikan', 's5', 49000, 79000, 610, '💄'],
  ['Sepeda Lipat 20 inci Alloy', 'hobi', 's6', 2199000, 2799000, 18, '🚲'],
  ['Raket Badminton Carbon', 'hobi', 's6', 359000, 520000, 87, '🏸'],
  ['Matras Yoga TPE 8mm', 'hobi', 's6', 219000, 320000, 132, '🧘'],
  ['Popok Celana Premium L-32', 'ibu-anak', 's3', 189000, 249000, 275, '👶'],
  ['Mainan Edukasi Balok Kayu 100pcs', 'ibu-anak', 's3', 129000, 189000, 205, '🧩'],
];

const reviewBank = [
  ['Rizky A.', 5, 'Barang original, packing aman pakai bubble wrap tebal. Sampai 2 hari, pengiriman secepat lebah!'],
  ['Dewi Lestari', 5, 'Sesuai deskripsi, penjual responsif. Recommended.'],
  ['Bagas P.', 4, 'Lumayan untuk harga segini, cuma warna sedikit berbeda. Fungsinya tetap oke.'],
  ['Nur Hidayah', 5, 'Udah repeat order yang ketiga, selalu puas.'],
];

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildCatalog() {
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));
  const sellerById = new Map(sellers.map((s) => [s.id, s]));

  const products = raw.map(([name, catSlug, sellerId, price, mrp, stock, emoji], i) => {
    const cat = catBySlug.get(catSlug);
    const seller = sellerById.get(sellerId);
    return {
      id: `p${String(i + 1).padStart(3, '0')}`,
      slug: slugify(name),
      name,
      categoryId: cat.id,
      categorySlug: cat.slug,
      categoryName: cat.name,
      sellerId,
      sellerName: seller.name,
      sellerBadge: seller.badge,
      city: seller.city,
      price,
      mrp,
      stock,
      emoji,
      hue: cat.hue,
      rating: Number((4.4 + (i % 6) / 10).toFixed(2)),
      sold: 40 + ((i * 137) % 3800),
      freeShipping: i % 4 !== 0,
      flashSale: i % 7 === 3,
      desc: `${name} dijual oleh ${seller.name}. Garansi resmi 12 bulan dan retur 7 hari bila tidak sesuai deskripsi. Dikemas rapat, dikirim dari ${seller.city} lewat Lebah Express.`,
      highlights: [
        'Garansi resmi 12 bulan',
        'Retur 7 hari tanpa pertanyaan',
        'Bisa COD & cicilan 0% 3 bulan',
        `Dikirim dari ${seller.city}`,
      ],
    };
  });

  const reviews = {};
  products.forEach((p, i) => {
    reviews[p.id] = [0, 1, 2].map((k) => {
      const r = reviewBank[(i + k) % reviewBank.length];
      return { author: r[0], rating: r[1], body: r[2], date: `2026-0${(i % 9) + 1}-${10 + k}` };
    });
  });

  return { categories, sellers, products, reviews, shippingServices, paymentMethods, vouchers };
}
