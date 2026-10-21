'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Bee from '@/components/Bee';
import { getServerSnapshot, getSnapshot, setQty, removeLine, clearCart, subscribe, cartCount } from '@/lib/cart-client';
import { formatIDR } from '@/lib/money';

export default function CartPage() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');

  const ids = items.map((i) => i.productId).join(',');

  useEffect(() => {
    if (!ids) {
      setProducts({});
      return;
    }
    let alive = true;
    fetch(`/api/catalog?ids=${encodeURIComponent(ids)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('gagal'))))
      .then((data) => {
        if (!alive) return;
        const map = {};
        for (const p of data.items) map[p.id] = p;
        setProducts(map);
      })
      .catch(() => alive && setError('Gagal memuat harga terbaru. Muat ulang halaman.'));
    return () => {
      alive = false;
    };
  }, [ids]);

  const lines = items
    .map((i) => ({ ...i, product: products?.[i.productId] }))
    .filter((l) => l.product);

  const subtotal = lines.reduce((n, l) => n + l.product.price * l.qty, 0);

  if (!items.length) {
    return (
      <div className="container">
        <div className="panel empty" style={{ marginTop: 20 }}>
          <div className="mascot-wrap">
            <Bee size={92} />
          </div>
          <h3>Keranjangmu masih kosong</h3>
          <p>Leba belum bawa apa-apa. Yuk isi dengan produk favorit.</p>
          <Link className="btn btn-primary" href="/catalog">Mulai belanja</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="two-col">
        <section className="panel">
          <div className="row">
            <h3 style={{ margin: 0 }}>Keranjang ({cartCount(items)} barang)</h3>
            <span className="space" />
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => clearCart()}>
              Kosongkan
            </button>
          </div>
          {error ? <div className="alert alert-error small" style={{ marginTop: 10 }}>{error}</div> : null}
          {!products ? <p className="small muted">Memuat produk…</p> : null}
          {products
            ? lines.map((l) => (
                <div className="cart-row" key={l.productId}>
                  <div className="cart-thumb" style={{ background: `linear-gradient(140deg, ${l.product.hue[0]}, ${l.product.hue[1]})` }}>
                    {l.product.emoji}
                  </div>
                  <div>
                    <Link href={`/product/${l.product.slug}`} style={{ fontWeight: 700 }}>
                      {l.product.name}
                    </Link>
                    <div className="small muted">
                      {l.product.sellerName} · 📍 {l.product.city}
                    </div>
                    <div className="small">{formatIDR(l.product.price)}</div>
                    <div className="row" style={{ marginTop: 8, gap: 8 }}>
                      <div className="qty">
                        <button type="button" aria-label="Kurangi" onClick={() => setQty(l.productId, l.qty - 1)}>
                          −
                        </button>
                        <input readOnly value={l.qty} aria-label="Jumlah" />
                        <button
                          type="button"
                          aria-label="Tambah"
                          disabled={l.qty >= Math.min(99, l.product.stock)}
                          onClick={() => setQty(l.productId, l.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      {l.qty >= l.product.stock ? <span className="chip chip-danger">stok habis</span> : null}
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => removeLine(l.productId)}>
                        Hapus
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 800, color: 'var(--green-800)' }}>
                    {formatIDR(l.product.price * l.qty)}
                  </div>
                </div>
              ))
            : null}
          {products && lines.length !== items.length ? (
            <div className="alert alert-warn small" style={{ marginTop: 10 }}>
              Beberapa produk di keranjang sudah tidak tersedia dan tidak ikut dihitung.
            </div>
          ) : null}
        </section>

        <aside className="panel">
          <h3 style={{ marginTop: 0 }}>Ringkasan belanja</h3>
          <div className="sumline">
            <span className="muted">Subtotal {lines.length} produk</span>
            <strong>{formatIDR(subtotal)}</strong>
          </div>
          <div className="sumline small muted">
            <span>Ongkir &amp; biaya admin</span>
            <span>dihitung di checkout</span>
          </div>
          <div className="alert alert-info small" style={{ margin: '12px 0' }}>
            Harga di keranjang hanya perkiraan. Total final dihitung ulang di server saat pesanan dibuat — supaya tidak
            bisa dimanipulasi.
          </div>
          <Link className="btn btn-primary btn-block" href="/checkout">
            Lanjut ke Checkout
          </Link>
          <Link className="btn btn-ghost btn-block" href="/catalog" style={{ marginTop: 8 }}>
            Belanja lagi
          </Link>
        </aside>
      </div>
    </div>
  );
}
