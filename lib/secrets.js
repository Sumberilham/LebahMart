import crypto from 'node:crypto';

const devEphemeral = new Map();

export function getSecret(envName) {
  const fromEnv = process.env[envName];
  if (fromEnv && fromEnv.trim().length >= 16) return fromEnv.trim();
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${envName} wajib diisi di production (lihat .env.example)`);
  }
  if (!devEphemeral.has(envName)) {
    devEphemeral.set(envName, crypto.randomBytes(32).toString('hex'));
    console.warn(`[dev] ${envName} kosong — memakai kunci acak sementara. Sesi/webhook tidak akan valid setelah restart.`);
  }
  return devEphemeral.get(envName);
}

export function canonicalString(parts) {
  return parts.map((p) => String(p)).join('.');
}

export function hmac(key, value) {
  return crypto.createHmac('sha256', key).update(value).digest('hex');
}

export function sign(parts, keyName) {
  return hmac(getSecret(keyName), canonicalString(parts));
}

export function verifySignature(expectedHex, providedHex) {
  if (typeof expectedHex !== 'string' || typeof providedHex !== 'string') return false;
  const a = Buffer.from(expectedHex);
  const b = Buffer.from(providedHex);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function randomAlnum(length) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export function randomId(bytes = 12) {
  return crypto.randomBytes(bytes).toString('base64url');
}
