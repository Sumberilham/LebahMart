import { api, json, fail, clientIp } from '@/lib/http';
import { loadOwnedOrder, normalizeNo, publicOrder } from '@/lib/orders';
import { rateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';

export const GET = api(async (req, ctx) => {
  const rl = rateLimit({ key: `order:${clientIp(req)}`, limit: 120, windowMs: 60_000 });
  if (!rl.ok) return fail(429, 'Terlalu sering memeriksa status');

  const { orderNo } = await ctx.params;
  const { order, denied } = await loadOwnedOrder(normalizeNo(orderNo));
  if (denied) return fail(403, 'Pesanan bukan milik sesi ini');
  if (!order) return fail(404, 'Pesanan tidak ditemukan');
  return json({ ok: true, order: publicOrder(order) });
});
