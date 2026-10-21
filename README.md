# LebahMart 🐝 — marketplace demo dengan mock payment gateway

Marketplace bergaya Tokopedia: tema hijau, maskot lebah bernama **Leba**, katalog produk, pencarian & filter,
keranjang, checkout, dan halaman pembayaran dengan **mock payment gateway** yang meniru perilaku gerbang
pembayaran asli (instruksi VA/QRIS, batas waktu, notifikasi webhook bertanda tangan).

Dibangun dengan **Next.js 15 App Router** (JavaScript, tanpa database eksternal — data disimpan sebagai JSON
file di `data/`).

## Lokasi

Salinan lengkap (termasuk `node_modules` + Node portable di `.toolchain/`) ada di **`D:\LebarMart`** — bisa
langsung dijalankan tanpa `npm install`. Folder sumber aslinya tetap di
`C:\Users\USER\Documents\Qoder\2026-10-21\6e840e61`. Kalau mengedit di satu tempat, salin ulang ke yang lain
sebelum dijalankan (`.next/` sengaja tidak ikut disalin, dibuat ulang saat build).

## Menjalankan

Mesin ini tidak punya Node.js global, jadi runtime portable sudah diunduh ke `.toolchain/`:

```bash
export PATH="$PWD/.toolchain/node-v24.22.0-win-x64:$PATH"
cp .env.example .env.local       # isi APP_SECRET & GATEWAY_SECRET (acak, >= 32 karakter)
npm install
npm run dev                      # http://127.0.0.1:3000
# atau build produksi:
npm run build && npm start
```

Tanpa `.env.local`, dev server tetap jalan tapi kuncinya acak per proses (sesi & webhook tidak valid setelah
restart — ada peringatan di log).

### Uji end-to-end + uji keamanan

Server harus sudah jalan, lalu:

```bash
node scripts/flow-test.mjs
```

37 pemeriksaan: harga klien diabaikan, voucher dibatasi, CSRF, IDOR, replay webhook, tanda tangan HMAC salah,
body diubah setelah ditandatangani, jumlah tidak cocok, oversell, rilis stok, escaping HTML, rate limit.

## Struktur

| Lokasi | Isi |
| --- | --- |
| `app/page.js` | beranda: banner, kategori, flash sale, best seller |
| `app/catalog/page.js` | daftar produk + pencarian, filter harga, urutan, paginasi |
| `app/product/[slug]/page.js` | detail produk, penjual, ulasan, produk serupa |
| `app/cart/page.js` | keranjang (localStorage) |
| `app/checkout/page.js` + `components/CheckoutForm.js` | alamat, kurir, metode bayar, voucher |
| `app/order/[orderNo]/page.js` + `components/PayPanel.js` | instruksi bayar, hitung mundur, status |
| `app/orders/page.js` | riwayat pesanan sesi ini |
| `app/api/quote`, `app/api/checkout`, `app/api/orders/*`, `app/api/gateway/webhook` | backend |
| `lib/pricing.js` | **satu-satunya** tempat angka pesanan dihitung |
| `lib/gateway.js` | mock gateway: terbit event, verifikasi HMAC, idempotensi, transisi status |
| `lib/db.js` | penyimpanan JSON atomik + mutex per file |
| `lib/session.js` | cookie sesi `httpOnly` bertanda tangan |

## Alur pembayaran

```
keranjang → POST /api/quote   (server menghitung total)
          → POST /api/checkout (reservasi stok, order = pending, expiresAt +20 menit)
          → halaman /order/...  → POST /api/orders/.../charge {action:"init"} (instruksi VA/QRIS)
          → mock gateway menerbitkan event -> ingest() -> /api/gateway/webhook
          → status: pending → paid | expired | failed
```

Status pembayaran **hanya** bisa berubah lewat `ingest()`, yaitu jalur yang memverifikasi tanda tangan. Tidak ada
endpoint "ubah status" yang bisa dipanggil klien.

## Keamanan yang diterapkan

- **Integritas harga** — klien mengirim `productId` + `qty` saja; harga, ongkir, diskon, biaya admin, dan total
  dihitung ulang di server dari katalog (`lib/pricing.js`). Uang disimpan sebagai integer rupiah.
- **Webhook HMAC-SHA256** — tanda tangan atas `timestamp + raw body`, dibandingkan dengan
  `crypto.timingSafeEqual`; beda 1 byte → 401.
- **Anti-replay** — selisih waktu maksimal 5 menit, dan `eventId` dicatat sekali pakai (idempoten: pengiriman ulang
  mengembalikan `duplicate: true`, bukan membayar dua kali).
- **Mesin status** — transisi dibatasi (`pending → paid|expired|failed`, `paid → refunded`). `paid → expired`
  ditolak, jadi pembayaran tidak bisa dibatalkan diam-diam.
- **Cocok jumlah** — event `paid` yang nominalnya tidak sama dengan tagihan ditolak (422).
- **Otorisasi kepemilikan** — nomor pesanan saja tidak cukup; harus cookie sesi yang cocok (403 jika bukan
  pemilik). Nomor pesanan acak 10 karakter.
- **Stok** — dikurangi saat pesanan dibuat (reservasi) dan dikembalikan saat kedaluwarsa/gagal, di bawah mutex.
- **CSRF** — cookie `SameSite=Lax` + validasi `Origin` vs `Host` untuk semua endpoint mutasi browser.
- **Validasi input di batas sistem** — tipe, panjang, rentang, regex (qty 1–99, maksimal 50 baris, kode pos 5
  digit, payload ≤ 64 KB).
- **XSS** — semua teks dirender React (ter-escape), tidak ada `dangerouslySetInnerHTML`; CSP `default-src 'self'`,
  `frame-ancestors 'none'`, `object-src 'none'`.
- **Header** — CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, Referrer-Policy,
  Permissions-Policy, `poweredByHeader: false`.
- **Rate limit** — per IP + per sesi untuk checkout, quote, cek status, dan webhook.
- **Rahasia** — `APP_SECRET`/`GATEWAY_SECRET` hanya di server; `GATEWAY_SECRET` tidak pernah dikirim ke browser.
  `x-forwarded-for` hanya dipercaya kalau `TRUST_PROXY=1` (mencegah lolos rate limit dengan memalsukan header).
- **Tanpa data kartu** — metode bayar memakai VA/QRIS/e-wallet/COD; menyimpan PAN butuh lingkup PCI DSS.

## Batasan yang harus diketahui (jangan dianggap "tanpa celah")

1. **Ini simulasi.** Tidak ada uang sungguhan. Untuk produksi, ganti pemanggil event di `lib/gateway.js` dengan
   webhook Midtrans/Xendit/TRIPAY asli dan arahkan notifikasinya ke `/api/gateway/webhook` — verifikasi tanda
   tangan, idempotensi, mesin status, dan pencocokan nominal sudah siap. Tanda tangan Midtrans berbeda format
   (`SHA512(order_id+status_code+gross_amount+server_key)`), jadi sesuaikan fungsi `signBody`.
2. **Penyimpanan JSON file.** Cocok untuk demo satu proses. Bergabungnya beberapa proses (mis. `next start` dengan
   beberapa worker atau server ganda) membuat mutex in-memory tidak cukup — pindah ke PostgreSQL/SQLite dengan
   transaksi baris (`SELECT ... FOR UPDATE`) sebelum dipakai nyata.
3. **Rate limiter in-memory**, hilang saat restart dan tidak antar-instance. Pakai Redis/Upstash untuk produksi.
4. **Tidak ada login.** Sesi = cookie acak bertanda tangan. Kalau nanti ditambah autentikasi, rotasi ID sesi saat
   login/logout wajib dilakukan (pencegahan session fixation), dan `secure: true` sudah otomatis aktif di build
   produksi.
5. **Belum ada pengujian penetrasi.** "Tidak ada celah" tidak bisa dijamin untuk perangkat lunak apa pun. Yang ada
   di sini: daftar mitigasi di atas + 37 uji otomatis di `scripts/flow-test.mjs`. Untuk rilis publik, jalankan
   dependency audit (`npm audit`), scan CSP/headers, dan uji manual alur refund/komplain.
6. **Fitur yang belum dibuat** (sesuai lingkup yang disepakati): akun penjual & dashboard toko, ulasan yang bisa
   ditulis pembeli, pelacakan kurir sungguhan, refund dari UI, dan notifikasi email.

## Maskot

`components/Bee.js` — Leba digambar sebagai SVG (sayap hijau, tubuh kuning madu, pola sarang heksagon di banner).
Muncul di logo, keadaan kosong keranjang/pesanan/404, dan layar pembayaran berhasil.
