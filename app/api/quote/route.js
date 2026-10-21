import { api, json, readJsonBody, clientIp, fail } from '@/lib/http';
import { quote } from '@/lib/pricing';
import { rateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';

export const POST = api(
  async (req) => {
    const rl = rateLimit({ key: `quote:${clientIp(req)}`, limit: 60, windowMs: 60_000 });
    if (!rl.ok) return fail(429, 'Terlalu sering menghitung harga, tunggu sebentar');

    const body = await readJsonBody(req);
    const result = await quote({
      lines: body.lines,
      serviceCode: body.serviceCode,
      paymentMethodCode: body.paymentMethodCode,
      voucherCode: body.voucherCode,
    });
    return json({ ok: true, quote: result });
  },
  { mutate: true },
);
