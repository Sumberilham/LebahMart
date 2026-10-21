import Link from 'next/link';
import Bee, { HexPattern } from '@/components/Bee';
import ProductCard from '@/components/ProductCard';
import { getCatalog } from '@/lib/db';
import { formatIDR } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const catalog = await getCatalog();
  const popular = [...catalog.products].sort((a, b) => b.sold - a.sold).slice(0, 12);
  const fresh = [...catalog.products].sort((a, b) => b.rating - a.rating).slice(0, 6);
  const flash = catalog.products.filter((p) => p.flashSale).slice(0, 6);
  const cheapest = [...catalog.products].sort((a, b) => a.price - b.price).slice(0, 6);

  return (
    <div className="container">
      <section className="hero">
        <div className="banner">
          <HexPattern />
          <span className="chip chip-honey" style={{ alignSelf: 'flex-start' }}>🐝 Promo Lebah · hemat sampai 45%</span>
          <h1>Belanja apa saja,<br />secepat lebah mengantar.</h1>
          <p>
            Jutaan produk dari toko lokal. Bayar pakai QRIS, Virtual Account, e-wallet, saldo LebaCash, atau COD — semua
            diproses gateway dengan tanda tangan HMAC dan verifikasi server.
          </p>
          <div className="row" style={{ marginTop: 6 }}>
            <Link className="btn btn-honey" href="/catalog">Mulai Belanja</Link>
            <Link className="btn btn-ghost" href="/#cara" style={{ color: '#0b3d24', background: 'rgba(255,255,255,.9)' }}>
              Cara Belanja
            </Link>
          </div>
        </div>
        <aside className="banner-side">
          <div className="row">
            <Bee size={54} />
            <div>
              <div style={{ fontWeight: 800 }}>Kenalin, Leba 🐝</div>
              <div className="small muted">Maskot yang jagain pesananmu sampai depan rumah.</div>
            </div>
          </div>
          <div className="honeycomb-note">
            <div className="small" style={{ fontWeight: 800 }}>Voucher aktif</div>
            {catalog.vouchers.map((v) => (
              <div key={v.code} className="small">
                <code>{v.code}</code> — {v.label}
              </div>
            ))}
          </div>
          <div className="small muted" id="aman">
            <strong>Keamanan:</strong> harga &amp; total selalu dihitung ulang di server. Tanda tangan webhook memakai
            HMAC-SHA256 + batas waktu 5 menit + idempoten.
          </div>
        </aside>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Kategori Pilihan</h2>
          <Link href="/catalog">Lihat semua →</Link>
        </div>
        <div className="catgrid">
          {catalog.categories.map((c) => (
            <Link key={c.id} className="catcard" href={`/catalog?category=${c.slug}`}>
              <span className="emoji">{c.emoji}</span>
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="section" id="promo">
        <div className="section-head">
          <h2>⚡ Flash Sale Lebah</h2>
          <Link href="/catalog?sort=diskon">Semua diskon →</Link>
        </div>
        <div className="grid-products cols-4">
          {flash.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Best Seller</h2>
          <Link href="/catalog?sort=populer">Selengkapnya →</Link>
        </div>
        <div className="grid-products">
          {popular.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Rating Tertinggi</h2>
          <Link href="/catalog?sort=rating">Selengkapnya →</Link>
        </div>
        <div className="grid-products cols-4">
          {fresh.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Mulai dari {formatIDR(cheapest[0].price)}</h2>
        </div>
        <div className="grid-products cols-4">
          {cheapest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="section panel" id="cara">
        <h2 style={{ marginTop: 0 }}>Cara belanja di LebahMart</h2>
        <ol className="ul">
          <li>Pilih produk, atur jumlah, lalu <strong>masukkan keranjang</strong> atau langsung <strong>Beli Sekarang</strong>.</li>
          <li>Isi alamat, pilih kurir Lebah Express &amp; metode bayar. Ongkir, diskon, dan biaya admin dihitung server.</li>
          <li>Bayar lewat halaman pesanan: QRIS / Virtual Account / e-wallet / COD, dengan batas waktu 20 menit.</li>
          <li>Setelah gateway mengirim notifikasi sah, pesanan berubah jadi <strong>Dibayar</strong> dan masuk tahap Diproses.</li>
        </ol>
        <p className="small muted">
          Ini proyek demo: gateway-nya simulasi lokal. Untuk produksi, ganti pemanggil event di
          <code> lib/gateway.js</code> dengan webhook Midtrans/Xendit asli dan arahkan ke
          <code> /api/gateway/webhook</code> — verifikasi tanda tangan, idempotensi, dan batas waktunya sudah siap.
        </p>
      </section>
    </div>
  );
}
