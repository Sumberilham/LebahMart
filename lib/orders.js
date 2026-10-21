import { findOrder, listOrders } from './db';
import { readSessionId } from './session';
import { expireStaleOrders } from './gateway';

export function publicOrder(order) {
  return {
    orderNo: order.orderNo,
    status: order.status,
    fulfillment: order.fulfillment,
    items: order.items,
    subtotal: order.subtotal,
    discount: order.discount,
    shippingFee: order.shippingFee,
    shippingListPrice: order.shippingListPrice,
    adminFee: order.adminFee,
    total: order.total,
    service: order.service,
    paymentMethod: order.paymentMethod,
    voucher: order.voucher,
    address: order.address,
    createdAt: order.createdAt,
    expiresAt: order.expiresAt,
    paidAt: order.paidAt || null,
    settlementRef: order.settlementRef || null,
    paymentEvents: order.paymentEvents,
    charge: order.charge,
  };
}

export function normalizeNo(input) {
  const t = String(input ?? '').trim().toUpperCase();
  if (!/^LM[A-Z2-9]{8,16}$/.test(t)) {
    const err = new Error('Nomor pesanan tidak valid');
    err.expected = true;
    err.statusCode = 400;
    throw err;
  }
  return t;
}

export async function loadOwnedOrder(orderNo) {
  const sessionId = await readSessionId();
  if (!sessionId) return { order: null, denied: true };
  await expireStaleOrders();
  const order = await findOrder(orderNo);
  if (!order || order.sessionId !== sessionId) return { order: null, denied: true };
  return { order, denied: false };
}

export async function loadMyOrders() {
  const sessionId = await readSessionId();
  if (!sessionId) return [];
  await expireStaleOrders();
  const all = await listOrders();
  return all
    .filter((o) => o.sessionId === sessionId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}
