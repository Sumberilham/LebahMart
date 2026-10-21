'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Bee from './Bee';
import PseudoQr from './PseudoQr';
import { formatIDR } from '@/lib/money';

const STATUS_LABEL = {
  pending: 'Menunggu pembayaran',
  paid: 'Dibayar',
  expired: 'Kedaluwarsa',
  failed: 'Pembayaran gagal',
  refunded: 'Dana dikembalikan',
};

export default function PayPanel({ order: initial }) {
  const [order, setOrder] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [left, setLeft] = useState(Math.max(0, Math.floor((initial.expiresAt - Date.now()) / 1000)));
  const no = initial.orderNo;
  const inited = useRef(false);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/orders/${no}`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) setOrder(data.order);
    return data;
  }, [no]);

  useEffect(() => {
    if (order.status !== 'pending' || inited.current) return;
    inited.current = true;
    if (order.charge) return;
    fetch(`/api/orders/${no}/charge`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'init' }),
    })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.ok) setOrder(d.order);
        else setMsg(d.error || 'Gagal menyiapkan instruksi pembayaran');
      })
      .catch(() => setMsg('Koneksi terputus, coba lagi'));
  }, [order.status, order.charge, no]);

  useEffect(() => {
    if (order.status !== 'pending') return undefined;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [order.status]);

  useEffect(() => {
    if (order.status !== 'pending') return undefined;
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [order.status, refresh]);

  useEffect(() => {
    if (order.status === 'pending' && left === 0) refresh();
  }, [left, order.status, refresh]);

  async function act(action) {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/orders/${no}/charge`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Permintaan ditolak');
      setOrder(data.order);
      if (action === 'pay') setMsg('Pembayaran diterima gateway ✅');
      if (action === 'fail') setMsg('Gateway menolak pembayaran (simulasi).');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  const paid = order.status === 'paid';
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className="pay-grid">
      <div>
        <section className="panel">
          <div className="row">
            <div>
              <div className="small muted">Nomor pesanan</div>
              <h2 style={{ margin: 0 }}>{order.orderNo}</h2>
            </div>
            <span className="space" />
            <span className={`status-chip st-${order.status}`}>{STATUS_LABEL[order.status] || order.status}</span>
          </div>

          <div className="row small muted" style={{ marginTop: 6 }}>
            <span>Dibuat {new Date(order.createdAt).toLocaleString('id-ID')}</span>
          </div>

          {order.status === 'pending' ? (
            <>
              <div className="row" style={{ marginTop: 12 }}>
                <span className="count">⏱ Sisa waktu {mm}:{ss}</span>
                <span className="small muted">Pesanan otomatis kedaluwarsa dari sisi server.</span>
              </div>

              {msg ? <div className="alert alert-warn small" style={{ marginTop: 12 }}>{msg}</div> : null}

              <div style={{ marginTop: 14 }}>
                {order.charge?.instruction?.type === 'va' ? (
                  <div className="va-box">
                    <div className="small muted">{order.charge.instruction.label}</div>
                    <div className="va-number">{order.charge.instruction.number}</div>
                    <div className="small">
                      Transfer tepat <strong>{formatIDR(order.total)}</strong> sebelum batas waktu.
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ marginTop: 10 }}
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(order.charge.instruction.number);
                          setMsg('Nomor Virtual Account disalin.');
                        } catch {
                          setMsg('Browser menolak akses clipboard, salin manual.');
                        }
                      }}
                    >
                      Salin nomor
                    </button>
                  </div>
                ) : null}

                {order.charge?.instruction?.type === 'qris' ? (
                  <div className="center">
                    <PseudoQr value={order.charge.instruction.payload} size={186} />
                    <div className="small muted" style={{ marginTop: 8 }}>
                      Pindai dengan aplikasi bank/e-wallet apa pun. Kode QR ini gambar simulasi, bukan QR asli.
                    </div>
                  </div>
                ) : null}

                {order.charge?.instruction?.type === 'wallet' ? (
                  <div className="va-box">
                    <div className="small muted">{order.charge.instruction.label}</div>
                    <div className="va-number" style={{ fontSize: 18 }}>
                      Konfirmasi di aplikasi {order.charge.instruction.label}
                    </div>
                    <div className="small">Tagihan {formatIDR(order.total)} dikirim ke aplikasimu (simulasi).</div>
                  </div>
                ) : null}

                {order.charge?.instruction?.type === 'balance' ? (
                  <div className="alert alert-info">Saldo LebaCash akan didebet {formatIDR(order.total)} begitu kamu konfirmasi.</div>
                ) : null}

                {order.charge?.instruction?.type === 'cod' ? (
                  <div className="alert alert-warn">
                    COD: bayar {formatIDR(order.total)} ke kurir saat paket tiba. Tekan tombol di bawah untuk
                    mengonfirmasi (simulasi).
                  </div>
                ) : null}
              </div>

              <div className="row" style={{ marginTop: 16, flexWrap: 'wrap', gap: 10 }}>
                <button className="btn btn-primary" type="button" disabled={busy} onClick={() => act('pay')}>
                  {busy ? 'Memproses…' : order.charge?.instruction?.type === 'cod' ? 'Konfirmasi bayar ke kurir' : 'Saya sudah bayar'}
                </button>
                <button className="btn btn-ghost" type="button" disabled={busy} onClick={() => act('fail')}>
                  Simulasikan gagal
                </button>
                <button className="btn btn-outline" type="button" disabled={busy} onClick={() => refresh()}>
                  Cek status
                </button>
              </div>
              <p className="small muted" style={{ marginBottom: 0 }}>
                Tombol di atas meminta mock gateway menerbitkan notifikasi bertanda tangan HMAC ke{' '}
                <code>/api/gateway/webhook</code>. Status pesanan hanya bisa berubah lewat jalur itu.
              </p>
            </>
          ) : null}

          {paid ? (
            <>
              <div className="panel" style={{ background: 'var(--green-50)', marginTop: 14, textAlign: 'center' }}>
                <div className="mascot-wrap">
                  <Bee size={78} />
                </div>
                <h3 style={{ margin: '6px 0' }}>Pembayaran diterima 🎉</h3>
                <div className="small muted">
                  Nomor settlement <code>{order.settlementRef}</code> · {order.paidAt ? new Date(order.paidAt).toLocaleString('id-ID') : ''}
                </div>
                <p className="small">Penjual sudah menerima dana escrow dan memulai proses pengemasan.</p>
              </div>
              {msg ? <div className="alert alert-info small">{msg}</div> : null}
            </>
          ) : null}

          {order.status === 'expired' || order.status === 'failed' ? (
            <div className="alert alert-error small" style={{ marginTop: 14 }}>
              {msg || (order.status === 'expired' ? 'Batas waktu pembayaran habis. Stok sudah dikembalikan, silakan pesan lagi.' : 'Pembayaran gagal. Stok sudah dikembalikan.')}
              <div style={{ marginTop: 10 }}>
                <Link className="btn btn-primary btn-sm" href="/catalog">
                  Belanja lagi
                </Link>
              </div>
            </div>
          ) : null}
        </section>

        <section className="panel" style={{ marginTop: 14 }}>
          <h3 style={{ marginTop: 0 }}>Status pesanan</h3>
          <ul className="timeline">
            <li className={order.status === 'pending' ? '' : ''}>
              <div className="tl-title">Pesanan dibuat</div>
              <div className="small muted">{new Date(order.createdAt).toLocaleString('id-ID')}</div>
            </li>
            <li className={paid || order.status === 'refunded' ? '' : 'dim'}>
              <div className="tl-title">{STATUS_LABEL[order.status] || order.status}</div>
              <div className="small muted">
                {order.paymentEvents?.length
                  ? order.paymentEvents.map((e) => `${e.status} · ${new Date(e.at).toLocaleString('id-ID')}`).join(' → ')
                  : 'Menunggu notifikasi gateway'}
              </div>
            </li>
            <li className={paid ? '' : 'dim'}>
              <div className="tl-title">Diproses penjual</div>
              <div className="small muted">{paid ? 'Paket sedang dikemas di gudang penjual.' : 'Menunggu pembayaran'}</div>
            </li>
            <li className="dim">
              <div className="tl-title">Dikirim {order.service?.name}</div>
              <div className="small muted">Estimasi {order.service?.eta}</div>
            </li>
            <li className="dim">
              <div className="tl-title">Sampai di tujuan</div>
              <div className="small muted">{order.address.city} {order.address.postal}</div>
            </li>
          </ul>
        </section>
      </div>

      <aside>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Rincian pembayaran</h3>
          {order.items.map((i) => (
            <div className="sumline small" key={i.productId}>
              <span>
                {i.emoji} {i.name.slice(0, 24)} × {i.qty}
              </span>
              <span>{formatIDR(i.lineTotal)}</span>
            </div>
          ))}
          <div className="sumline" style={{ marginTop: 8 }}>
            <span className="muted">Subtotal</span>
            <span>{formatIDR(order.subtotal)}</span>
          </div>
          {order.discount ? (
            <div className="sumline" style={{ color: 'var(--green-700)' }}>
              <span>Diskon {order.voucher?.code}</span>
              <span>−{formatIDR(order.discount)}</span>
            </div>
          ) : null}
          <div className="sumline">
            <span className="muted">Ongkir</span>
            <span>{order.shippingFee ? formatIDR(order.shippingFee) : 'Gratis'}</span>
          </div>
          <div className="sumline">
            <span className="muted">Biaya admin</span>
            <span>{formatIDR(order.adminFee)}</span>
          </div>
          <div className="sumline total">
            <span>Total</span>
            <span>{formatIDR(order.total)}</span>
          </div>

          <div className="alert alert-info small" style={{ margin: '12px 0' }}>
            Ditagih dengan <strong>{order.paymentMethod?.name}</strong>. Nilai notifikasi gateway harus sama persis dengan
            total di atas, kalau beda event ditolak.
          </div>

          <h4 style={{ marginBottom: 4 }}>Dikirim ke</h4>
          <div className="small">
            <div style={{ fontWeight: 700 }}>{order.address.recipient}</div>
            <div>{order.address.detail}</div>
            <div className="muted">
              {order.address.city} {order.address.postal} · {order.address.phone}
            </div>
          </div>

          <Link className="btn btn-ghost btn-block" href="/orders" style={{ marginTop: 12 }}>
            Riwayat pesanan
          </Link>
        </div>
      </aside>
    </div>
  );
}
