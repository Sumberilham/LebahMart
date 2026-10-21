import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import BuyButtons from '@/components/BuyButtons';
import { getCatalog } from '@/lib/db';
import { formatIDR, compactCount } from '@/lib/money';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const product = catalog.products.find((p) => p.slug === slug);
  if (!product) return { title: 'Produk tidak ditemukan — LebahMart' };
  return { title: `${product.name} — ${formatIDR(product.price)} | LebahMart`, description: product.desc.slice(0, 150) };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const product = catalog.products.find((p) => p.slug === slug);
  if (!product) notFound();

  const seller = catalog.sellers.find((s) => s.id === product.sellerId);
  const reviews = catalog.reviews[product.id] || [];
  const related = catalog.products.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 6);
  const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  return (
    <div className="container">
      <div className="small muted" style={{ padding: '12px 0' }}>
        <Link href="/">Beranda</Link> › <Link href={`/catalog?category=${product.categorySlug}`}>{product.categoryName}</Link> ›{' '}
        <span>{product.name}</span>
      </div>

      <div className="pdp">
        <div>
          <div className="pdp-art">
            <div className="stage" style={{ background: `linear-gradient(140deg, ${product.hue[0]}, ${product.hue[1]})` }}>
              <span className="emoji">{product.emoji}</span>
            </div>
            <div className="pdp-thumbs">
              <div>{product.emoji}</div>
              <div>📦</div>
              <div>🐝</div>
              <div>🧾</div>
            </div>
          </div>
        </div>

        <div className="panel">
          {product.flashSale ? <span className="chip chip-honey">⚡ Flash Sale Lebah</span> : null}
          <h1 className="pdp-title" style={{ marginTop: 8 }}>{product.name}</h1>
          <div className="row small muted">
            <span>⭐ {product.rating.toFixed(1)}</span>
            <span>·</span>
            <span>{compactCount(product.sold)} terjual</span>
            <span>·</span>
            <span>Stok {product.stock}</span>
          </div>

          <div className="pdp-pricebox">
            <div>
              <div className="small muted">Harga coret {formatIDR(product.mrp)}</div>
              <div className="pdp-price">{formatIDR(product.price)}</div>
            </div>
            {discount > 0 ? <span className="chip">Hemat {discount}%</span> : null}
          </div>

          <BuyButtons product={{ id: product.id, stock: product.stock }} />

          <div className="row" style={{ marginTop: 14, gap: 8, flexWrap: 'wrap' }}>
            <span className="chip">🔒 Transaksi aman</span>
            <span className="chip">↩️ Retur 7 hari</span>
            <span className="chip chip-honey">💵 Bisa COD</span>
            {product.freeShipping ? <span className="chip">🚚 Gratis ongkir</span> : null}
          </div>

          <div className="sellerbox" style={{ marginTop: 14 }}>
            <div className="seller-avatar">{seller.name.slice(0, 2).toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 800 }}>{seller.name}</div>
              <div className="small muted">
                📍 {seller.city} · ⭐ {seller.rating.toFixed(1)} · {compactCount(seller.sold)} penjualan
              </div>
              <div className="small">
                <span className="chip">{seller.badge}</span>
              </div>
            </div>
          </div>

          <h3 style={{ marginBottom: 4 }}>Deskripsi</h3>
          <p className="small" style={{ marginTop: 0 }}>{product.desc}</p>
          <ul className="ul">
            {product.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="two-col" style={{ marginTop: 20 }}>
        <section className="panel">
          <h3 style={{ marginTop: 0 }}>Ulasan pembeli ({reviews.length})</h3>
          {reviews.map((r, i) => (
            <div className="review" key={`${r.author}-${i}`}>
              <div className="row">
                <strong>{r.author}</strong>
                <span className="chip">⭐ {r.rating}.0</span>
                <span className="space" />
                <span className="small muted">{r.date}</span>
              </div>
              <p className="small" style={{ margin: '6px 0 0' }}>{r.body}</p>
            </div>
          ))}
        </section>
        <section className="panel">
          <h3 style={{ marginTop: 0 }}>Pengiriman &amp; pembayaran</h3>
          {catalog.shippingServices.map((s) => (
            <div className="sumline" key={s.code}>
              <span>{s.name}</span>
              <span>{s.price ? formatIDR(s.price) : 'Gratis'}</span>
            </div>
          ))}
          <div className="alert alert-info small" style={{ marginTop: 12 }}>
            Bayar dengan QRIS, Virtual Account BCA/BRI, GoPay, DANA, LebaCash, atau COD. Nomor pembayaran dibuat di
            halaman pesanan dan batas waktunya 20 menit.
          </div>
        </section>
      </div>

      {related.length ? (
        <section className="section">
          <div className="section-head">
            <h2>Produk serupa</h2>
            <Link href={`/catalog?category=${product.categorySlug}`}>Semua →</Link>
          </div>
          <div className="grid-products cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
