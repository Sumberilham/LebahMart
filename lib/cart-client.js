const KEY = 'lm_cart_v1';
const MAX_LINES = 50;
const listeners = new Set();
const EMPTY = [];
let cachedRaw = null;
let cachedItems = EMPTY;

function normalize(raw) {
  let arr;
  try {
    arr = raw ? JSON.parse(raw) : [];
  } catch {
    return EMPTY;
  }
  if (!Array.isArray(arr)) return EMPTY;
  const out = [];
  for (const line of arr) {
    const productId = typeof line?.productId === 'string' ? line.productId.slice(0, 24) : '';
    const qty = Number(line?.qty);
    if (!productId || !Number.isInteger(qty) || qty < 1 || qty > 99) continue;
    if (out.some((o) => o.productId === productId)) continue;
    out.push({ productId, qty });
    if (out.length >= MAX_LINES) break;
  }
  return out.length ? out : EMPTY;
}

export function getSnapshot() {
  if (typeof window === 'undefined') return EMPTY;
  const raw = window.localStorage.getItem(KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedItems = normalize(raw);
  }
  return cachedItems;
}

export function getServerSnapshot() {
  return EMPTY;
}

export function subscribe(cb) {
  const handler = () => cb();
  listeners.add(handler);
  window.addEventListener('storage', handler);
  return () => {
    listeners.delete(handler);
    window.removeEventListener('storage', handler);
  };
}

function commit(items) {
  const valid = items.filter((i) => Number.isInteger(i.qty) && i.qty >= 1 && i.qty <= 99).slice(0, MAX_LINES);
  window.localStorage.setItem(KEY, JSON.stringify(valid));
  cachedRaw = null;
  getSnapshot();
  for (const cb of listeners) cb();
}

export function addLine(productId, qty = 1) {
  const items = getSnapshot().slice();
  const found = items.find((i) => i.productId === productId);
  if (found) found.qty = Math.min(99, found.qty + qty);
  else items.push({ productId, qty: Math.min(99, Math.max(1, qty)) });
  commit(items);
}

export function setQty(productId, qty) {
  const items = getSnapshot().slice();
  const found = items.find((i) => i.productId === productId);
  if (!found) return;
  found.qty = qty;
  commit(qty <= 0 ? items.filter((i) => i.productId !== productId) : items);
}

export function removeLine(productId) {
  commit(getSnapshot().filter((i) => i.productId !== productId));
}

export function clearCart() {
  commit([]);
}

export function cartCount(items) {
  return items.reduce((n, i) => n + i.qty, 0);
}
