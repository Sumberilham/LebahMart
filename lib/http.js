import { NextResponse } from 'next/server';

export function json(data, init = {}) {
  return NextResponse.json(data, init);
}

export function fail(status, message, extra = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export function clientIp(req) {
  // Header ini dikontrol klien; hanya dipercaya di belakang reverse proxy
  // yang menulis ulang header (set TRUST_PROXY=1 saat deploy di Vercel/Nginx).
  if (process.env.TRUST_PROXY === '1') {
    const fwd = req.headers.get('x-forwarded-for');
    if (fwd) return fwd.split(',')[0].trim();
    const real = req.headers.get('x-real-ip');
    if (real) return real;
  }
  return 'direct';
}

/**
 * Anti-CSRF untuk endpoint mutasi: cookie sesi bersifat SameSite=Lax,
 * tapi kita tetap validasi Origin/Host karena beberapa browser mengizinkan
 * POST cross-origin dengan simple request.
 */
export function assertTrustedOrigin(req) {
  const origin = req.headers.get('origin');
  if (!origin) return null;
  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    return fail(403, 'Origin tidak valid');
  }
  const host = req.headers.get('host');
  if (originHost !== host) return fail(403, 'Permintaan cross-origin ditolak');
  return null;
}

export function api(handler, { mutate = false } = {}) {
  return async (req, ctx) => {
    try {
      if (mutate) {
        const denied = assertTrustedOrigin(req);
        if (denied) return denied;
      }
      return await handler(req, ctx);
    } catch (err) {
      if (err?.expected) return fail(err.statusCode || 400, err.message);
      console.error('Unhandled API error', err);
      return fail(500, 'Terjadi kesalahan pada server');
    }
  };
}

export async function readJsonBody(req, { maxBytes = 64 * 1024 } = {}) {
  const len = Number(req.headers.get('content-length') || 0);
  if (len > maxBytes) {
    const e = new Error('Payload terlalu besar');
    e.statusCode = 413;
    e.expected = true;
    throw e;
  }
  const text = await req.text();
  if (text.length > maxBytes) {
    const e = new Error('Payload terlalu besar');
    e.statusCode = 413;
    e.expected = true;
    throw e;
  }
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('bad');
    return parsed;
  } catch {
    const e = new Error('Body harus JSON objek yang valid');
    e.statusCode = 400;
    e.expected = true;
    throw e;
  }
}
