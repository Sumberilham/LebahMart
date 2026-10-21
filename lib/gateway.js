import { getSecret, hmac, verifySignature, randomAlnum } from './secrets';
import { findOrder, mutateOrders, mutateCatalog, mutateGatewayEvents, listOrders } from './db';

export const WEBHOOK_TOLERANCE_MS = 5 * 60 * 1000;
export const SETTLE_GRACE_MS = 10 * 60 * 1000;
export const ORDER_TTL_MS = 20 * 60 * 1000;

const ALLOWED = {
  pending: new Set(['paid', 'expired', 'failed']),
  paid: new Set(['refunded']),
  expired: new Set(),
  failed: new Set(),
  refunded: new Set(),
};

export class GatewayError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.expected = true;
    this.statusCode = statusCode;
  }
}

function signBody(timestamp, rawBody) {
  return hmac(getSecret('GATEWAY_SECRET'), `${timestamp}.${rawBody}`);
}

export function verifyWebhook({ rawBody, signature, timestamp }) {
  if (typeof rawBody !== 'string' || !rawBody) throw new GatewayError('Body kosong', 400);
  if (!signature || !timestamp) throw new GatewayError('Header tanda tangan tidak lengkap', 401);
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) throw new GatewayError('Timestamp tidak valid', 401);
  const skew = Math.abs(Date.now() - ts);
  if (skew > WEBHOOK_TOLERANCE_MS) throw new GatewayError('Timestamp kedaluwarsa (replay ditolak)', 401);
  const expected = signBody(timestamp, rawBody);
  if (!verifySignature(expected, String(signature))) throw new GatewayError('Tanda tangan HMAC tidak valid', 401);
  return true;
}

export async function publishEvent(event) {
  const rawBody = JSON.stringify(event);
  const timestamp = String(Date.now());
  const signature = signBody(timestamp, rawBody);
  return ingest({ rawBody, signature, timestamp });
}

function validateShape(event) {
  if (typeof event !== 'object' || event === null) throw new GatewayError('Payload tidak valid');
  const { eventId, orderNo, status, amount, occurredAt } = event;
  if (typeof eventId !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(eventId)) throw new GatewayError('eventId tidak valid');
  if (typeof orderNo !== 'string' || !/^LM[A-Z2-9]{8,16}$/.test(orderNo)) throw new GatewayError('orderNo tidak valid');
  if (!['paid', 'expired', 'failed', 'refunded'].includes(status)) throw new GatewayError('status tidak dikenal');
  if (!Number.isInteger(amount) || amount <= 0 || amount > 1_000_000_000_000) throw new GatewayError('amount tidak valid');
  if (typeof occurredAt !== 'string') throw new GatewayError('occurredAt tidak valid');
  return event;
}

export async function ingest({ rawBody, signature, timestamp }) {
  verifyWebhook({ rawBody, signature, timestamp });
  const event = validateShape(JSON.parse(rawBody));

  let claimed = false;
  const reservation = await mutateGatewayEvents((state) => {
    if (state.processed.includes(event.eventId)) return { duplicate: true };
    state.processed.push(event.eventId);
    claimed = true;
    return { duplicate: false };
  });
  if (reservation.duplicate) {
    return { ok: true, duplicate: true, eventId: event.eventId };
  }

  try {
    const result = await applyEvent(event);
    if (!result.ok && result.revert) {
      await mutateGatewayEvents((state) => {
        state.processed = state.processed.filter((id) => id !== event.eventId);
      });
    }
    return result;
  } catch (err) {
    await mutateGatewayEvents((state) => {
      state.processed = state.processed.filter((id) => id !== event.eventId);
    });
    throw err;
  }
}

async function applyEvent(event) {
  let outcome = { ok: false, reason: 'unknown', revert: true };

  const updated = await mutateOrders((list) => {
    const order = list.find((o) => o.orderNo === event.orderNo);
    if (!order) {
      outcome = { ok: false, reason: 'order tidak ditemukan', revert: true };
      return null;
    }
    const now = Date.now();
    if (!ALLOWED[order.status] || !ALLOWED[order.status].has(event.status)) {
      outcome = { ok: true, ignored: true, status: order.status, reason: `Transisi ${order.status} -> ${event.status} ditolak` };
      return null;
    }
    if (order.total !== event.amount) {
      outcome = { ok: false, reason: 'Jumlah tidak cocok dengan tagihan', revert: false };
      return null;
    }
    if (event.status === 'paid' && now > order.expiresAt + SETTLE_GRACE_MS) {
      outcome = { ok: true, ignored: true, status: order.status, reason: 'Batas waktu pembayaran lewat' };
      return null;
    }

    order.status = event.status;
    order.updatedAt = new Date(now).toISOString();
    if (event.status === 'paid') {
      order.paidAt = order.updatedAt;
      order.fulfillment = 'processing';
      order.settlementRef = event.settlementRef || null;
    }
    order.paymentEvents = [...(order.paymentEvents || []), { status: event.status, at: order.updatedAt, eventId: event.eventId }];
    outcome = { ok: true, order, transitioned: true, to: event.status };
    return order;
  });

  if (!outcome.transitioned) return outcome;

  if (event.status === 'paid') await adjustStock(updated, -1);
  if (event.status === 'expired' || event.status === 'failed') await adjustStock(updated, +1);

  return outcome;
}

async function adjustStock(order, direction) {
  await mutateCatalog((catalog) => {
    for (const item of order.items) {
      const product = catalog.products.find((p) => p.id === item.productId);
      if (!product) continue;
      product.stock = Math.max(0, product.stock + direction * item.qty);
    }
  });
}

export async function createCharge(order, methodCode) {
  const instruction = buildInstruction(order, methodCode);
  const chargeRef = `CH${randomAlnum(10)}`;
  await mutateOrders((list) => {
    const order_ = list.find((o) => o.orderNo === order.orderNo);
    if (!order_) return;
    order_.charge = { chargeRef, method: methodCode, instruction, createdAt: new Date().toISOString() };
  });
  return { chargeRef, instruction };
}

function luhnDigit(digits) {
  let sum = 0;
  const arr = digits.split('').reverse();
  for (let i = 0; i < arr.length; i += 1) {
    let d = Number(arr[i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return String((10 - (sum % 10)) % 10);
}

export function buildInstruction(order, methodCode) {
  const tail = order.orderNo.replace('LM', '');
  if (methodCode === 'va_bca') {
    const base = `8808${tail}01${randomAlnum(4).replace(/[^0-9]/g, '7')}`.replace(/[^0-9]/g, '').slice(0, 14);
    return { type: 'va', label: 'Virtual Account BCA', number: `${base}${luhnDigit(base)}` };
  }
  if (methodCode === 'va_bri') {
    const base = `0002${tail}${randomAlnum(4).replace(/[^0-9]/g, '3')}`.replace(/[^0-9]/g, '').slice(0, 15);
    return { type: 'va', label: 'Virtual Account BRI', number: `${base}${luhnDigit(base)}` };
  }
  if (methodCode === 'qris') {
    return { type: 'qris', label: 'QRIS', payload: `ID52${randomAlnum(14)}LM${tail}${randomAlnum(20)}` };
  }
  if (methodCode === 'gopay' || methodCode === 'dana') {
    return { type: 'wallet', label: methodCode === 'gopay' ? 'GoPay' : 'DANA', pushTo: order.orderNo };
  }
  if (methodCode === 'lebacash') {
    return { type: 'balance', label: 'Saldo LebaCash' };
  }
  if (methodCode === 'cod') {
    return { type: 'cod', label: 'Bayar di tempat saat paket tiba' };
  }
  return { type: 'unknown', label: 'Metode tidak dikenal' };
}

export async function expireStaleOrders() {
  const now = Date.now();
  const stale = (await listOrders()).filter((o) => o.status === 'pending' && o.expiresAt < now);
  const results = [];
  for (const order of stale) {
    results.push(
      await publishEvent({
        eventId: `exp_${order.orderNo}`,
        orderNo: order.orderNo,
        status: 'expired',
        amount: order.total,
        occurredAt: new Date(now).toISOString(),
        reason: 'payment_window_closed',
      }),
    );
  }
  return { checked: stale.length, results };
}

export async function getOrderOrThrow(orderNo) {
  const order = await findOrder(orderNo);
  if (!order) throw new GatewayError('Pesanan tidak ditemukan', 404);
  return order;
}
