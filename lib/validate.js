const ID_ORDER = /^(LM)[A-Z2-9]{8,16}$/;

export function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function str(v, { min = 1, max = 200, pattern, name }) {
  if (typeof v !== 'string') throw bad(`${name} harus string`);
  const t = v.trim();
  if (t.length < min || t.length > max) throw bad(`${name} harus ${min}-${max} karakter`);
  if (pattern && !pattern.test(t)) throw bad(`${name} formatnya tidak valid`);
  return t;
}

export function oneOf(v, allowed, name) {
  if (!allowed.includes(v)) throw bad(`${name} tidak dikenal`);
  return v;
}

export function intInRange(v, min, max, name) {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw bad(`${name} harus antara ${min} dan ${max}`);
  return n;
}

export function orderNo(v) {
  const t = String(v ?? '').trim().toUpperCase();
  if (!ID_ORDER.test(t)) throw bad('Nomor pesanan tidak valid');
  return t;
}

export function cleanAddress(raw) {
  return {
    recipient: str(raw?.recipient, { min: 3, max: 60, name: 'Nama penerima' }),
    phone: str(raw?.phone, { min: 8, max: 16, pattern: /^[0-9+\-\s]+$/, name: 'Nomor telepon' }),
    city: str(raw?.city, { min: 3, max: 60, name: 'Kota' }),
    postal: str(raw?.postal, { min: 5, max: 5, pattern: /^[0-9]{5}$/, name: 'Kode pos' }),
    detail: str(raw?.detail, { min: 10, max: 300, name: 'Alamat lengkap' }),
  };
}

export function bad(message) {
  const err = new Error(message);
  err.statusCode = 400;
  err.expected = true;
  return err;
}
