export function formatIDR(amount) {
  if (!Number.isInteger(amount)) throw new Error('amount harus integer rupiah');
  return `Rp${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(amount)}`;
}

export function formatNumber(amount) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(amount);
}

export function compactCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '')}rb`;
  return String(n);
}
