import { getCatalog } from './db';
import { bad } from './validate';

const MAX_LINES = 50;

/**
 * Semua angka dihitung ulang di server dari katalog.
 * Nilai price/subtotal/total yang dikirim klien selalu diabaikan.
 */
export async function quote({ lines, serviceCode, paymentMethodCode, voucherCode }) {
  if (!Array.isArray(lines) || lines.length === 0) throw bad('Keranjang kosong');
  if (lines.length > MAX_LINES) throw bad('Terlalu banyak baris pesanan');

  const catalog = await getCatalog();
  const productById = new Map(catalog.products.map((p) => [p.id, p]));

  const merged = new Map();
  for (const line of lines) {
    const productId = String(line?.productId ?? '');
    const qty = Number(line?.qty);
    const product = productById.get(productId);
    if (!product) throw bad('Ada produk yang tidak ditemukan, muat ulang halaman');
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw bad(`Jumlah "${product.name}" harus 1-99`);
    merged.set(productId, (merged.get(productId) || 0) + qty);
  }

  const items = [];
  let subtotal = 0;
  for (const [productId, qty] of merged) {
    const product = productById.get(productId);
    if (qty > product.stock) throw bad(`Stok ${product.name} tinggal ${product.stock}`);
    const lineTotal = product.price * qty;
    subtotal += lineTotal;
    items.push({
      productId,
      slug: product.slug,
      name: product.name,
      emoji: product.emoji,
      hue: product.hue,
      city: product.city,
      sellerName: product.sellerName,
      unitPrice: product.price,
      qty,
      lineTotal,
      stock: product.stock,
    });
  }

  const service = catalog.shippingServices.find((s) => s.code === serviceCode);
  if (!service) throw bad('Layanan pengiriman tidak dikenal');

  const method = catalog.paymentMethods.find((m) => m.code === paymentMethodCode);
  if (!method) throw bad('Metode pembayaran tidak dikenal');

  let discount = 0;
  let shippingDiscount = 0;
  let voucher = null;
  if (voucherCode) {
    const code = String(voucherCode).trim().toUpperCase();
    voucher = catalog.vouchers.find((v) => v.code === code) || null;
    if (!voucher) throw bad('Kode voucher tidak valid');
    if (subtotal < voucher.minSubtotal) throw bad(`Voucher ${voucher.code} minimal belanja ${voucher.minSubtotal}`);
    if (voucher.kind === 'percent') {
      discount = Math.min(Math.floor((subtotal * voucher.value) / 100), voucher.maxDiscount);
    } else if (voucher.kind === 'shipping') {
      shippingDiscount = Math.min(service.price, voucher.maxDiscount);
    }
  }

  const shippingFee = Math.max(0, service.price - shippingDiscount);
  const adminFee = method.fee;
  const total = Math.max(0, subtotal - discount) + shippingFee + adminFee;

  return {
    items,
    subtotal,
    discount,
    shippingFee,
    shippingListPrice: service.price,
    service: { code: service.code, name: service.name, eta: service.eta },
    paymentMethod: { code: method.code, name: method.name, fee: method.fee, kind: method.kind },
    voucher: voucher ? { code: voucher.code, label: voucher.label } : null,
    adminFee,
    total,
    itemCount: items.reduce((n, i) => n + i.qty, 0),
  };
}
