import { NextResponse } from 'next/server';
import { ingest, GatewayError } from '@/lib/gateway';
import { rateLimit } from '@/lib/ratelimit';
import { clientIp } from '@/lib/http';

export const runtime = 'nodejs';

/**
 * Endpoint notifikasi gateway (Midtrans/Xendit-like).
 * Autentikasinya adalah HMAC-SHA256 atas body mentah + timestamp, jadi
 * sengaja TIDAK memakai cek Origin (pembayar server-to-server bukan browser).
 */
export async function POST(req) {
  const rl = rateLimit({ key: `webhook:${clientIp(req)}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate limited' }, { status: 429 });

  const rawBody = await req.text();
  const signature = req.headers.get('x-lebah-signature');
  const timestamp = req.headers.get('x-lebah-timestamp');

  try {
    const result = await ingest({ rawBody, signature, timestamp });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.reason }, { status: result.reason === 'Jumlah tidak cocok dengan tagihan' ? 422 : 400 });
    }
    return NextResponse.json({ ok: true, duplicate: !!result.duplicate, status: result.to || result.status });
  } catch (err) {
    const status = err instanceof GatewayError ? err.statusCode : 400;
    return NextResponse.json({ ok: false, error: status === 400 ? 'Payload tidak valid' : 'Verifikasi gagal' }, { status });
  }
}
