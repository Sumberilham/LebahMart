import Link from 'next/link';
import Bee from '@/components/Bee';

export default function NotFound() {
  return (
    <div className="container">
      <div className="panel empty" style={{ marginTop: 20 }}>
        <div className="mascot-wrap">
          <Bee size={90} />
        </div>
        <h3>404 — Leba nyasar 🐝</h3>
        <p>Halaman atau produk yang kamu cari tidak ada di sini.</p>
        <Link className="btn btn-primary" href="/">Kembali ke beranda</Link>
      </div>
    </div>
  );
}
