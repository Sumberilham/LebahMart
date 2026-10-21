import { api, json, readJsonBody, fail, clientIp } from '@/lib/http';
import { loadOwnedOrder, normalizeNo, publicOrder } from '@/lib/orders';
import { createCharge, publishEvent } from '@/lib/gateway';
import { findOrder } from '@/lib/db';
import { rateLimit } from '@/lib/ratelimit';
import { randomAlnum } from '@/lib/secrets';
import { bad } from '@/lib/validate';

export const runtime = 'nodejs';

export const POST = api(
  async (req, ctx) => {
    const { orderNo } = await ctx.params;
    const no = normalizeNo(orderNo);

    const rl = rateLimit({ key: `charge:${clientIp(req)}:${no}`, limit: 15, windowMs: 60_000 });
    if (!rl.ok) return fail(429, 'Terlalu banyak percobaan pembayaran, tunggu sebentar');

    const body = await readJsonBody(req);
    const action = String(body.action ?? 'init');
    if (!['init', 'pay', 'fail'].includes(action)) throw bad('Aksi tidak dikenal');

    const { order, denied } = await loadOwnedOrder(no);
    if (denied) return fail(403, 'Pesanan bukan milik sesi ini');
    if (!order) return fail(404, 'Pesanan tidak ditemukan');
    if (order.status !== 'pending') return fail(409, `Pesanan sudah ${label(order.status)}`);
    if (order.expiresAt < Date.now()) return fail(409, 'Batas waktu pembayaran habis, buat pesanan baru');

    let current = order;
    if (action === 'init') {
      await createCharge(current, current.paymentMethod.code);
      current = await findOrder(no);
    }

    if (action === 'pay') {
      if (!current.charge) {
        await createCharge(current, current.paymentMethod.code);
        current = await findOrder(no);
      }
      const result = await publishEvent({
        eventId: `settle_${no}_${current.charge.chargeRef}`,
        orderNo: no,
        status: 'paid',
        amount: current.total,
        occurredAt: new Date().toISOString(),
        settlementRef: `STL${randomAlnum(8)}`,
        channel: current.paymentMethod.code,
      });
      if (!result.ok) return fail(422, result.reason || 'Pembayaran ditolak gateway');
      current = await findOrder(no);
    }

    if (action === 'fail') {
      if (!current.charge) {
        await createCharge(current, current.paymentMethod.code);
        current = await findOrder(no);
      }
      const result = await publishEvent({
        eventId: `decline_${no}_${current.charge.chargeRef}`,
        orderNo: no,
        status: 'failed',
        amount: current.total,
        occurredAt: new Date().toISOString(),
        reason: 'insufficient_balance',
        channel: current.paymentMethod.code,
      });
      if (!result.ok) return fail(422, result.reason || 'Gateway menolak event');
      current = await findOrder(no);
    }

    return json({ ok: true, order: publicOrder(current) });
  },
  { mutate: true },
);

function label(status) {
  return { pending: 'menunggu pembayaran', paid: 'dibayar', expired: 'kedaluwarsa', failed: 'gagal', refunded: 'direfund' }[status] || status;
}
