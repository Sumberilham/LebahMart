import Link from 'next/link';
import PayPanel from '@/components/PayPanel';
import Bee from '@/components/Bee';
import { loadOwnedOrder, normalizeNo, publicOrder } from '@/lib/orders';

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }) {
  const { orderNo } = await params;
  let no;
  try {
    no = normalizeNo(orderNo);
  } catch {
    no = null;
  }

  if (!no) {
    return (
      <div className="container">
        <div className="panel empty" style={{ marginTop: 20 }}>
          <h3>Format nomor pesanan salah</h3>
          <p>Nomor pesanan berbentuk <code>LM</code> diikuti 10 huruf/angka.</p>
          <Link className="btn btn-primary" href="/orders">Lihat pesanan saya</Link>
        </div>
      </div>
    );
  }

  const { order } = await loadOwnedOrder(no);

  if (!order) {
    return (
      <div className="container">
        <div className="panel empty" style={{ marginTop: 20 }}>
          <div className="mascot-wrap">
            <Bee size={86} />
          </div>
          <h3>Pesanan {no} tidak tersedia di sesi ini</h3>
          <p className="small">
            Halaman pembayaran hanya bisa dibuka dari sesi yang membuat pesanan — nomor saja tidak cukup. Kalau kamu
            membuka browser lain atau membersihkan cookie, buat pesanan baru.
          </p>
          <Link className="btn btn-primary" href="/catalog">Kembali belanja</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="small muted" style={{ padding: '12px 0 0' }}>
        <Link href="/">Beranda</Link> › <Link href="/orders">Pesanan</Link> › <span>{order.orderNo}</span>
      </div>
      <PayPanel order={publicOrder(order)} />
    </div>
  );
}
