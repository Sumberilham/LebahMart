import { api, json, readJsonBody, clientIp, fail } from '@/lib/http';
import { quote } from '@/lib/pricing';
import { mutateCatalog, mutateOrders } from '@/lib/db';
import { ensureSessionId, sessionCookie } from '@/lib/session';
import { randomAlnum } from '@/lib/secrets';
import { rateLimit } from '@/lib/ratelimit';
import { cleanAddress } from '@/lib/validate';
import { ORDER_TTL_MS } from '@/lib/gateway';

export const runtime = 'nodejs';

export const POST = api(
  async (req) => {
    const ip = clientIp(req);
    const perIp = rateLimit({ key: `checkout:${ip}`, limit: 12, windowMs: 60_000 });
    if (!perIp.ok) return fail(429, 'Terlalu sering membuat pesanan, coba lagi sebentar lagi');

    const body = await readJsonBody(req);
    const { sessionId, rotate } = await ensureSessionId();
    const perSession = rateLimit({ key: `checkout-sesi:${sessionId}`, limit: 20, windowMs: 60 * 60_000 });
    if (!perSession.ok) return fail(429, 'Batas pembuatan pesanan per sesi tercapai');

    const totals = await quote({
      lines: body.lines,
      serviceCode: body.serviceCode,
      paymentMethodCode: body.paymentMethodCode,
      voucherCode: body.voucherCode,
    });
    const address = cleanAddress(body.address);

    // Reservasi stok: kurangi di server, bukan dari angka yang dikirim klien.
    const reserved = await mutateCatalog((catalog) => {
      for (const item of totals.items) {
        const product = catalog.products.find((p) => p.id === item.productId);
        if (!product || product.stock < item.qty) return { ok: false, name: product?.name ?? item.productId, stock: product?.stock ?? 0 };
      }
      for (const item of totals.items) {
        const product = catalog.products.find((p) => p.id === item.productId);
        product.stock -= item.qty;
      }
      return { ok: true };
    });
    if (!reserved.ok) {
      return fail(409, `Stok ${reserved.name} tinggal ${reserved.stock}, sesuaikan jumlahnya`);
    }

    const now = Date.now();
    const order = {
      orderNo: `LM${randomAlnum(10)}`,
      sessionId,
      status: 'pending',
      fulfillment: 'awaiting_payment',
      items: totals.items.map((i) => ({ productId: i.productId, slug: i.slug, name: i.name, emoji: i.emoji, hue: i.hue, unitPrice: i.unitPrice, qty: i.qty, lineTotal: i.lineTotal })),
      subtotal: totals.subtotal,
      discount: totals.discount,
      shippingFee: totals.shippingFee,
      shippingListPrice: totals.shippingListPrice,
      adminFee: totals.adminFee,
      total: totals.total,
      service: totals.service,
      paymentMethod: totals.paymentMethod,
      voucher: totals.voucher,
      address,
      createdAt: new Date(now).toISOString(),
      expiresAt: now + ORDER_TTL_MS,
      paymentEvents: [],
      charge: null,
    };

    try {
      await mutateOrders((list) => {
        list.push(order);
        if (list.length > 5000) list.splice(0, list.length - 5000);
      });
    } catch (err) {
      await mutateCatalog((catalog) => {
        for (const item of order.items) {
          const product = catalog.products.find((p) => p.id === item.productId);
          if (product) product.stock += item.qty;
        }
      });
      throw err;
    }

    const res = json({ ok: true, orderNo: order.orderNo, total: order.total, expiresAt: order.expiresAt, next: `/order/${order.orderNo}` });
    if (rotate) res.cookies.set(sessionCookie(sessionId));
    return res;
  },
  { mutate: true },
);
