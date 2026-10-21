import Link from 'next/link';
import Bee from '@/components/Bee';
import { loadMyOrders } from '@/lib/orders';
import { formatIDR } from '@/lib/money';

export const dynamic = 'force-dynamic';

const LABEL = {
  pending: 'Menunggu pembayaran',
  paid: 'Dibayar',
  expired: 'Kedaluwarsa',
  failed: 'Gagal',
  refunded: 'Direfund',
};

export default async function OrdersPage() {
  const orders = await loadMyOrders();

  if (!orders.length) {
    return (
      <div className="container">
        <div className="panel empty" style={{ marginTop: 20 }}>
          <div className="mascot-wrap">
            <Bee size={88} />
          </div>
          <h3>Belum ada pesanan</h3>
          <p>Setelah kamu checkout, pesanan dan instruksi pembayarannya muncul di sini.</p>
          <Link className="btn btn-primary" href="/catalog">Mulai belanja</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="section-head" style={{ marginTop: 18 }}>
        <h2>Pesanan saya ({orders.length})</h2>
        <span className="space" />
        <span className="small muted">Hanya pesanan dari sesi browser ini.</span>
      </div>

      {orders.map((o) => (
        <article className="panel" key={o.orderNo} style={{ marginBottom: 12 }}>
          <div className="row">
            <div>
              <div className="small muted">{new Date(o.createdAt).toLocaleString('id-ID')}</div>
              <strong>{o.orderNo}</strong>
            </div>
            <span className="space" />
            <span className={`status-chip st-${o.status}`}>{LABEL[o.status] || o.status}</span>
          </div>
          <div className="row" style={{ marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
            {o.items.slice(0, 6).map((i) => (
              <span key={i.productId} className="chip" title={i.name}>
                {i.emoji} {i.name.slice(0, 20)} ×{i.qty}
              </span>
            ))}
            {o.items.length > 6 ? <span className="chip chip-gray">+{o.items.length - 6} lagi</span> : null}
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <div className="small muted">
              {o.paymentMethod?.name} · {o.service?.name}
            </div>
            <span className="space" />
            <strong style={{ color: 'var(--green-800)' }}>{formatIDR(o.total)}</strong>
            <Link className="btn btn-primary btn-sm" href={`/order/${o.orderNo}`}>
              {o.status === 'pending' ? 'Bayar sekarang' : 'Lihat detail'}
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
