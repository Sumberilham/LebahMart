import Link from 'next/link';
import Bee from './Bee';
import CartBadge from './CartBadge';
import { getCatalog } from '@/lib/db';

export default async function Header() {
  const catalog = await getCatalog();
  return (
    <>
      <div className="topstrip">
        <div className="container">
          <Link href="/orders">Pesanan Saya</Link>
          <Link href="/#promo">Promo Lebah</Link>
          <Link href="/#cara">Cara Belanja</Link>
          <span className="space" />
          <span>Masuk / Daftar — demo ini memakai sesi tanpa login</span>
        </div>
      </div>
      <header className="header">
        <div className="container">
          <Link href="/" className="logo" aria-label="LebahMart beranda">
            <Bee size={40} label="Logo LebahMart" />
            <span className="logo-text">
              Lebah<span>Mart</span>
            </span>
          </Link>
          <form className="search" action="/catalog" method="get" role="search">
            <label className="small muted" htmlFor="q" style={{ position: 'absolute', left: -9999 }}>
              Cari produk
            </label>
            <input id="q" name="q" type="search" maxLength={80} placeholder="Cari produk, toko, atau kategori…" autoComplete="off" />
            <button type="submit" aria-label="Cari">🔍</button>
          </form>
          <nav className="header-actions">
            <Link className="icon-btn" href="/orders">
              📦 <span className="small">Pesanan</span>
            </Link>
            <Link className="icon-btn" href="/cart">
              🛒 Keranjang <CartBadge />
            </Link>
          </nav>
        </div>
      </header>
      <nav className="catnav" aria-label="Kategori">
        <div className="container">
          <Link href="/catalog">Semua Kategori</Link>
          {catalog.categories.map((c) => (
            <Link key={c.id} href={`/catalog?category=${c.slug}`}>
              {c.emoji} {c.name}
            </Link>
          ))}
          <Link href="/catalog?sort=diskon">🔥 Diskon</Link>
        </div>
      </nav>
    </>
  );
}
