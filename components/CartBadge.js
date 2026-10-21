'use client';

import { useSyncExternalStore } from 'react';
import { cartCount, getServerSnapshot, getSnapshot, subscribe } from '@/lib/cart-client';

export default function CartBadge() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const count = cartCount(items);
  if (!count) return null;
  return <span className="cart-count" aria-label={`${count} barang di keranjang`}>{count}</span>;
}
