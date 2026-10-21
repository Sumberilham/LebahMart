'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addLine } from '@/lib/cart-client';

export default function BuyButtons({ product }) {
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState('');
  const router = useRouter();
  const max = Math.max(1, Math.min(99, product.stock));

  function addToCart() {
    addLine(product.id, qty);
    setDone('Masuk keranjang 🐝');
    setTimeout(() => setDone(''), 1800);
  }

  function buyNow() {
    addLine(product.id, qty);
    router.push('/checkout');
  }

  return (
    <div className="row" style={{ flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
      <div className="qty">
        <button type="button" aria-label="Kurangi jumlah" onClick={() => setQty((q) => Math.max(1, q - 1))}>
          −
        </button>
        <input
          aria-label="Jumlah"
          inputMode="numeric"
          value={qty}
          onChange={(e) => {
            const n = Number.parseInt(e.target.value.replace(/\D/g, ''), 10);
            setQty(Number.isFinite(n) ? Math.min(max, Math.max(1, n)) : 1);
          }}
        />
        <button type="button" aria-label="Tambah jumlah" onClick={() => setQty((q) => Math.min(max, q + 1))}>
          +
        </button>
      </div>
      <button className="btn btn-ghost" type="button" onClick={addToCart}>
        🛒 Keranjang
      </button>
      <button className="btn btn-primary" type="button" onClick={buyNow} style={{ flex: '1 1 160px' }}>
        Beli Sekarang
      </button>
      {done ? <span className="chip">{done}</span> : null}
    </div>
  );
}
