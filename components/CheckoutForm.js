'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Bee from './Bee';
import { getServerSnapshot, getSnapshot, subscribe, clearCart } from '@/lib/cart-client';
import { formatIDR } from '@/lib/money';

const ADDR_KEY = 'lm_alamat_v1';

function loadAddress() {
  try {
    const raw = window.localStorage.getItem(ADDR_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function CheckoutForm({ services, methods, vouchers }) {
  const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const router = useRouter();
  const saved = useRef(typeof window !== 'undefined' ? loadAddress() : null);

  const [address, setAddress] = useState(
    saved.current || {
      recipient: '',
      phone: '',
      city: '',
      postal: '',
      detail: '',
    },
  );
  const [serviceCode, setServiceCode] = useState(services[0].code);
  const [methodCode, setMethodCode] = useState(methods[0].code);
  const [voucherCode, setVoucherCode] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const lines = cart;

  const fingerprint = useMemo(
    () => `${lines.map((l) => `${l.productId}:${l.qty}`).join(',')}|${serviceCode}|${methodCode}|${voucherCode}`,
    [lines, serviceCode, methodCode, voucherCode],
  );

  useEffect(() => {
    if (!lines.length) {
      setQuote(null);
      return;
    }
    let alive = true;
    const t = setTimeout(() => {
      fetch('/api/quote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lines, serviceCode, paymentMethodCode: methodCode, voucherCode: voucherCode || undefined }),
      })
        .then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok || !data.ok) throw new Error(data.error || 'Gagal menghitung total');
          return data;
        })
        .then((data) => {
          if (!alive) return;
          setQuote(data.quote);
          setQuoteError('');
        })
        .catch((e) => {
          if (!alive) return;
          setQuote(null);
          setQuoteError(e.message);
        });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [fingerprint, lines, serviceCode, methodCode, voucherCode]);

  if (!lines.length) {
    return (
      <div className="panel empty" style={{ marginTop: 20 }}>
        <div className="mascot-wrap">
          <Bee size={90} />
        </div>
        <h3>Belum ada yang mau dibeli?</h3>
        <p>Keranjangmu kosong, jadi checkout belum bisa dijalankan.</p>
        <Link className="btn btn-primary" href="/catalog">Cari produk</Link>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      window.localStorage.setItem(ADDR_KEY, JSON.stringify(address));
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lines,
          serviceCode,
          paymentMethodCode: methodCode,
          voucherCode: voucherCode || undefined,
          address,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Pesanan gagal dibuat');
      clearCart();
      router.push(data.next);
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  }

  const set = (k) => (e) => setAddress((a) => ({ ...a, [k]: e.target.value }));

  return (
    <form className="two-col" style={{ marginTop: 16 }} onSubmit={submit}>
      <div>
        <section className="panel">
          <h3 style={{ marginTop: 0 }}>📍 Alamat pengiriman</h3>
          <div className="grid2">
            <div className="form-field">
              <label htmlFor="rec">Nama penerima</label>
              <input id="rec" value={address.recipient} onChange={set('recipient')} maxLength={60} required placeholder="Nama lengkap" />
            </div>
            <div className="form-field">
              <label htmlFor="ph">Nomor HP</label>
              <input id="ph" value={address.phone} onChange={set('phone')} maxLength={16} required inputMode="tel" placeholder="0812xxxxxxx" />
            </div>
          </div>
          <div className="grid2">
            <div className="form-field">
              <label htmlFor="city">Kota / Kabupaten</label>
              <input id="city" value={address.city} onChange={set('city')} maxLength={60} required placeholder="Bandung" />
            </div>
            <div className="form-field">
              <label htmlFor="pos">Kode pos</label>
              <input id="pos" value={address.postal} onChange={set('postal')} maxLength={5} minLength={5} required inputMode="numeric" placeholder="40123" />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="det">Alamat lengkap</label>
            <textarea id="det" value={address.detail} onChange={set('detail')} maxLength={300} required placeholder="Jalan, nomor rumah, RT/RW, kecamatan, patokan…" />
          </div>
        </section>

        <section className="panel" style={{ marginTop: 14 }}>
          <h3 style={{ marginTop: 0 }}>🚚 Pemilihan pengiriman</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {services.map((s) => (
              <label className={`opt ${serviceCode === s.code ? 'on' : ''}`} key={s.code}>
                <input type="radio" name="svc" value={s.code} checked={serviceCode === s.code} onChange={() => setServiceCode(s.code)} />
                <div>
                  <div className="t">{s.name}</div>
                  <div className="small muted">Estimasi {s.eta}</div>
                </div>
                <span className="space" />
                <strong>{s.price ? formatIDR(s.price) : 'Gratis'}</strong>
              </label>
            ))}
          </div>
        </section>

        <section className="panel" style={{ marginTop: 14 }}>
          <h3 style={{ marginTop: 0 }}>💳 Metode pembayaran</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {methods.map((m) => (
              <label className={`opt ${methodCode === m.code ? 'on' : ''}`} key={m.code}>
                <input type="radio" name="pay" value={m.code} checked={methodCode === m.code} onChange={() => setMethodCode(m.code)} />
                <div>
                  <div className="t">{m.name}</div>
                  <div className="small muted">Biaya admin {m.fee ? formatIDR(m.fee) : 'Rp0'}</div>
                </div>
              </label>
            ))}
          </div>
          <div className="small muted" style={{ marginTop: 10 }}>
            Demo ini tidak meminta nomor kartu — penyimpanan data kartu butuh lingkup PCI DSS.
          </div>
        </section>
      </div>

      <aside>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Ringkasan ({quote?.itemCount ?? lines.length} barang)</h3>
          <div className="form-field">
            <label htmlFor="vrc">Kode voucher</label>
            <div className="row">
              <input
                id="vrc"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20))}
                placeholder="LEBA10"
                style={{ flex: 1, border: '1.5px solid var(--line)', borderRadius: 10, padding: '9px 11px' }}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setVoucherCode('')}
                disabled={!voucherCode}
              >
                Hapus
              </button>
            </div>
            <div className="small muted" style={{ marginTop: 6 }}>
              {vouchers.map((v) => (
                <div key={v.code}>
                  <button type="button" className="chip" style={{ border: 0, cursor: 'pointer', marginBottom: 4 }} onClick={() => setVoucherCode(v.code)}>
                    {v.code} — {v.label}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {quoteError ? <div className="alert alert-error small">{quoteError}</div> : null}

          {quote ? (
            <>
              {quote.items.map((i) => (
                <div className="sumline small" key={i.productId}>
                  <span>
                    {i.emoji} {i.name.slice(0, 26)} × {i.qty}
                  </span>
                  <span>{formatIDR(i.lineTotal)}</span>
                </div>
              ))}
              <div className="sumline" style={{ marginTop: 8 }}>
                <span className="muted">Subtotal</span>
                <span>{formatIDR(quote.subtotal)}</span>
              </div>
              {quote.discount > 0 ? (
                <div className="sumline" style={{ color: 'var(--green-700)' }}>
                  <span>Diskon {quote.voucher?.code}</span>
                  <span>−{formatIDR(quote.discount)}</span>
                </div>
              ) : null}
              <div className="sumline">
                <span className="muted">Ongkir ({quote.service.code})</span>
                <span>
                  {quote.shippingListPrice > quote.shippingFee ? <span className="strike">{formatIDR(quote.shippingListPrice)}</span> : null}{' '}
                  {quote.shippingFee ? formatIDR(quote.shippingFee) : 'Gratis'}
                </span>
              </div>
              <div className="sumline">
                <span className="muted">Biaya admin</span>
                <span>{formatIDR(quote.adminFee)}</span>
              </div>
              <div className="sumline total">
                <span>Total bayar</span>
                <span>{formatIDR(quote.total)}</span>
              </div>
              <div className="alert alert-info small" style={{ margin: '10px 0' }}>
                Angka di atas dihitung ulang di server dari harga katalog saat ini.
              </div>
            </>
          ) : (
            <p className="small muted">Menghitung total di server…</p>
          )}

          {submitError ? <div className="alert alert-error small">{submitError}</div> : null}

          <button className="btn btn-primary btn-block" type="submit" disabled={submitting || !quote}>
            {submitting ? 'Membuat pesanan…' : 'Buat Pesanan & Bayar'}
          </button>
          <Link className="btn btn-ghost btn-block" href="/cart" style={{ marginTop: 8 }}>
            Kembali ke keranjang
          </Link>
        </div>
      </aside>
    </form>
  );
}
