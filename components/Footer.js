import Link from 'next/link';
import Bee from './Bee';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="row">
              <Bee size={44} />
              <span className="logo-text" style={{ color: '#fff' }}>
                Lebah<span style={{ color: '#f5b301' }}>Mart</span>
              </span>
            </div>
            <p className="small" style={{ opacity: 0.85 }}>
              Marketplace demo bergaya Tokopedia. Maskot kami Leba, lebah hijau yang mengantar pesanan secepat serangga
              penyerbuk.
            </p>
            <p className="small" style={{ opacity: 0.75 }}>
              Pembayaran memakai <strong>mock gateway</strong> bertanda tangan HMAC-SHA256 — bukan gerbang pembayaran
              sungguhan, tidak ada dana yang bergerak.
            </p>
          </div>
          <div>
            <h4>Jelajah</h4>
            <Link href="/catalog">Semua Produk</Link>
            <Link href="/catalog?sort=terbaru">Produk Terbaru</Link>
            <Link href="/#promo">Promo Lebah</Link>
            <Link href="/cart">Keranjang</Link>
          </div>
          <div>
            <h4>Bantuan</h4>
            <Link href="/orders">Lacak Pesanan</Link>
            <Link href="/#cara">Cara Belanja</Link>
            <Link href="/#aman">Keamanan Bayar</Link>
            <span className="small">Pusat Bantuan (demo)</span>
          </div>
          <div>
            <h4>Layanan</h4>
            <span className="small">Buka toko di LebahMart</span>
            <span className="small">Lebah Express</span>
            <span className="small">LebaCash &amp; PayLater</span>
            <span className="small">Adu Lagi (komplain)</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 LebahMart — proyek demo edukasi.</span>
          <span>Harga, stok, dan toko fiktif.</span>
          <span className="space" />
          <span>QRIS · VA BCA · VA BRI · GoPay · DANA · COD</span>
        </div>
      </div>
    </footer>
  );
}
