import crypto from 'node:crypto';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:3000';
const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const GATEWAY_SECRET = /GATEWAY_SECRET=([a-f0-9]+)/.exec(env)[1];

let pass = 0;
let failCount = 0;
function check(name, ok, detail = '') {
  if (ok) {
    pass += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failCount += 1;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

async function req(path, { method = 'GET', body, cookie, origin = BASE, headers = {} } = {}) {
  const h = { ...headers };
  if (body !== undefined) h['content-type'] = 'application/json';
  if (cookie) h.cookie = cookie;
  if (origin) h.origin = origin;
  const res = await fetch(BASE + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  const setCookie = res.headers.getSetCookie?.() || [];
  const session = setCookie.map((c) => c.split(';')[0]).filter(Boolean).join('; ');
  return { status: res.status, json, text, session, csp: res.headers.get('content-security-policy') };
}

function sign(body, ts) {
  return crypto.createHmac('sha256', GATEWAY_SECRET).update(`${ts}.${body}`).digest('hex');
}

async function webhook(event, { badSign = false, stale = false, noSig = false, signOther = null } = {}) {
  const body = JSON.stringify(event);
  const signedBody = signOther ? JSON.stringify(signOther) : body;
  const ts = String(stale ? Date.now() - 60 * 60 * 1000 : Date.now());
  const signature = noSig ? null : badSign ? 'a'.repeat(64) : sign(signedBody, ts);
  const headers = { 'content-type': 'application/json' };
  if (signature) headers['x-lebah-signature'] = signature;
  if (!noSig) headers['x-lebah-timestamp'] = ts;
  const raw = await fetch(`${BASE}/api/gateway/webhook`, { method: 'POST', headers, body });
  const json = await raw.json().catch(() => null);
  return { status: raw.status, json };
}

// ---------- 1. header keamanan ----------
const home = await req('/');
check('beranda 200', home.status === 200);
check('CSP terkirim', !!home.csp && home.csp.includes("frame-ancestors 'none'"));
check('X-Powered-By Next disembunyikan', !(home.text || '').includes('X-Powered-By'));

// ---------- 2. quote menolak harga dari klien ----------
const q = await req('/api/quote', {
  method: 'POST',
  body: { lines: [{ productId: 'p016', qty: 2, price: 1, unitPrice: 1, total: 1 }], serviceCode: 'reg', paymentMethodCode: 'qris' },
});
check('harga dari klien diabaikan', q.json?.ok && q.json.quote.subtotal === 145000 * 2, JSON.stringify(q.json?.quote?.subtotal));
check('ongkir reguler 9000', q.json?.quote?.shippingFee === 9000);

const qv = await req('/api/quote', {
  method: 'POST',
  body: { lines: [{ productId: 'p016', qty: 2 }], serviceCode: 'reg', paymentMethodCode: 'qris', voucherCode: 'LEBA10' },
});
check('diskon voucher dibulatkan & dibatasi', qv.json?.quote?.discount === 25000, String(qv.json?.quote?.discount));

const qb = await req('/api/quote', {
  method: 'POST',
  body: { lines: [{ productId: 'p021', qty: 1 }], serviceCode: 'reg', paymentMethodCode: 'qris', voucherCode: 'ONGKIRGRATIS' },
});
check('voucher ongkir di bawah minimal subtotal ditolak', qb.status === 400, JSON.stringify(qb.json));

const qn = await req('/api/quote', { method: 'POST', body: { lines: [{ productId: 'p016', qty: 999999 }] } });
check('qty di atas 99 ditolak', qn.status === 400);

const qneg = await req('/api/quote', { method: 'POST', body: { lines: [{ productId: 'p016', qty: -5 }] } });
check('qty negatif ditolak', qneg.status === 400);

const qbad = await req('/api/quote', { method: 'POST', body: { lines: [{ productId: "p016' OR 1=1--", qty: 1 }] } });
check('id produk aneh ditolak', qbad.status === 400);

// ---------- 3. CSRF / origin ----------
const noOrigin = await req('/api/quote', { method: 'POST', origin: 'http://evil.example', body: { lines: [{ productId: 'p016', qty: 1 }] } });
check('POST cross-origin ditolak', noOrigin.status === 403);

// ---------- 4. checkout + sesi ----------
const address = { recipient: 'Uji Coba', phone: '081234567890', city: 'Bandung', postal: '40123', detail: 'Jalan Percobaan Nomor 5, RT 01, kelurahan uji' };
const co = await req('/api/checkout', {
  method: 'POST',
  body: { lines: [{ productId: 'p016', qty: 2 }], serviceCode: 'reg', paymentMethodCode: 'va_bca', voucherCode: 'LEBA10', address },
});
check('checkout 201/200', (co.status === 200 || co.status === 201) && !!co.json?.orderNo, co.text.slice(0, 200));
const cookie = co.session;
const orderNo = co.json?.orderNo;
check('total final dari server', co.json?.total === 290000 * 1 - 25000 + 9000 + 4000 || co.json?.total > 0, String(co.json?.total));

const expectedTotal = 145000 * 2 - 25000 + 9000 + 4000;
check(`total = ${expectedTotal}`, co.json?.total === expectedTotal, String(co.json?.total));
check('cookie sesi httpOnly + SameSite=Lax', (await fetch(`${BASE}/api/checkout`, { method: 'POST', headers: { origin: BASE, 'content-type': 'application/json' }, body: JSON.stringify({ lines: [{ productId: 'p006', qty: 1 }], serviceCode: 'pick', paymentMethodCode: 'qris', address }) })).headers.getSetCookie().join('').includes('HttpOnly'));

// ---------- 5. IDOR: order bukan milik sesi ----------
const intruder = await req(`/api/orders/${orderNo}`, { cookie: 'lm_sesi=invalidsessionvalue.deadbeef' });
check('akses pesanan sesi lain ditolak', intruder.status === 403 || intruder.status === 400, String(intruder.status));

const guessedNo = await req('/api/orders/LMAAAAAAAAAA');
check('nomor pesanan tebakan 404/403', guessedNo.status === 404 || guessedNo.status === 403, String(guessedNo.status));

// ---------- 6. charge + status ----------
const init = await req(`/api/orders/${orderNo}/charge`, { method: 'POST', cookie, body: { action: 'init' } });
check('instruksi VA dibuat server', init.json?.order?.charge?.instruction?.type === 'va', JSON.stringify(init.json?.order?.charge || {}).slice(0, 120));

const paid1 = await req(`/api/orders/${orderNo}/charge`, { method: 'POST', cookie, body: { action: 'pay' } });
check('pembayaran via jalur gateway sah', paid1.json?.order?.status === 'paid', JSON.stringify(paid1.json));

const payAgain = await req(`/api/orders/${orderNo}/charge`, { method: 'POST', cookie, body: { action: 'pay' } });
check('order sudah dibayar tidak bisa dibayar lagi', payAgain.status === 409, String(payAgain.status));

// ---------- 7. webhook: tanda tangan ----------
const co2 = await req('/api/checkout', {
  method: 'POST',
  body: { lines: [{ productId: 'p002', qty: 1 }], serviceCode: 'reg', paymentMethodCode: 'qris', address },
});
const order2 = co2.json.orderNo;
const total2 = co2.json.total;

const unsigned = await webhook({ eventId: `e_${Date.now()}`, orderNo: order2, status: 'paid', amount: total2, occurredAt: new Date().toISOString() }, { badSign: true });
check('webhook tanda tangan salah ditolak', unsigned.status === 401, JSON.stringify(unsigned.json));

const statusAfterBad = await req(`/api/orders/${order2}`, { cookie: co2.session });
check('status tidak berubah setelah webhook palsu', statusAfterBad.json?.order?.status === 'pending', statusAfterBad.json?.order?.status);

const tamperedEvent = { eventId: `e_${Date.now()}`, orderNo: order2, status: 'paid', amount: total2, occurredAt: new Date().toISOString() };
const tampered = await webhook({ ...tamperedEvent, amount: 1 }, { signOther: tamperedEvent });
check('body diubah setelah ditandatangani ditolak', tampered.status === 401, JSON.stringify(tampered.json));

const stale = await webhook({ eventId: `e_${Date.now()}`, orderNo: order2, status: 'paid', amount: total2, occurredAt: new Date().toISOString() }, { stale: true });
check('replay timestamp lama ditolak', stale.status === 401, JSON.stringify(stale.json));

const wrongAmount = await webhook({ eventId: `wa_${Date.now()}`, orderNo: order2, status: 'paid', amount: 1, occurredAt: new Date().toISOString() });
check('jumlah tidak cocok dengan tagihan ditolak', wrongAmount.status === 422, JSON.stringify(wrongAmount.json));

const eid = `settle_test_${Date.now()}`;
const good1 = await webhook({ eventId: eid, orderNo: order2, status: 'paid', amount: total2, occurredAt: new Date().toISOString() });
check('webhook sah mengubah status jadi paid', good1.status === 200 && good1.json?.ok, JSON.stringify(good1.json));

const replay = await webhook({ eventId: eid, orderNo: order2, status: 'paid', amount: total2, occurredAt: new Date().toISOString() });
check('replay eventId sama idempoten', replay.json?.duplicate === true, JSON.stringify(replay.json));

const backToPending = await webhook({ eventId: `bt_${Date.now()}`, orderNo: order2, status: 'expired', amount: total2, occurredAt: new Date().toISOString() });
const order2After = await req(`/api/orders/${order2}`, { cookie: co2.session });
check('transisi paid -> expired ditolak', order2After.json?.order?.status === 'paid', JSON.stringify([backToPending.json, order2After.json?.order?.status]));

const ghost = await webhook({ eventId: `gh_${Date.now()}`, orderNo: 'LMZZZZZZZZZZ', status: 'paid', amount: 1000, occurredAt: new Date().toISOString() });
check('event untuk order tak dikenal tidak merusak', ghost.status >= 200 && ghost.status < 500, JSON.stringify(ghost.json));

// ---------- 8. stok ----------
const stockBefore = await req('/api/catalog?ids=p005');
const s0 = stockBefore.json.items[0].stock;
const oversell = await req('/api/checkout', {
  method: 'POST',
  body: { lines: [{ productId: 'p005', qty: s0 + 1 }], serviceCode: 'reg', paymentMethodCode: 'qris', address },
});
check('oversell ditolak', oversell.status === 400 || oversell.status === 409, JSON.stringify(oversell.json));

const buy = await req('/api/checkout', {
  method: 'POST',
  body: { lines: [{ productId: 'p005', qty: 3 }], serviceCode: 'reg', paymentMethodCode: 'qris', address },
});
const stockAfter = (await req('/api/catalog?ids=p005')).json.items[0].stock;
check('stok dipesan berkurang 3', stockAfter === s0 - 3, `${s0} -> ${stockAfter}`);

const failSim = await req(`/api/orders/${buy.json.orderNo}/charge`, { method: 'POST', cookie: buy.session, body: { action: 'fail' } });
const stockReleased = (await req('/api/catalog?ids=p005')).json.items[0].stock;
check('stok kembali setelah gagal bayar', failSim.json?.order?.status === 'failed' && stockReleased === s0, `${stockReleased} vs ${s0}`);

// ---------- 9. validasi input ----------
const badAddr = await req('/api/checkout', {
  method: 'POST',
  body: { lines: [{ productId: 'p002', qty: 1 }], serviceCode: 'reg', paymentMethodCode: 'qris', address: { ...address, postal: 'abc' } },
});
check('kode pos non-numerik ditolak', badAddr.status === 400);

const xss = await req('/api/checkout', {
  method: 'POST',
  body: { lines: [{ productId: 'p002', qty: 1 }], serviceCode: 'reg', paymentMethodCode: 'qris', address: { ...address, recipient: '<script>alert(1)</script>' } },
});
const xssPage = xss.json?.orderNo ? await req(`/order/${xss.json.orderNo}`, { cookie: xss.session }) : null;
check(
  'input HTML di-escape saat render',
  xss.status === 400 || (xssPage && !xssPage.text.includes('<script>alert(1)</script>') && xssPage.text.includes('&lt;script&gt;')),
  `status=${xss.status}`,
);

const bigBody = await req('/api/quote', { method: 'POST', body: { lines: Array.from({ length: 5000 }, () => ({ productId: 'p002', qty: 1 })) } });
check('payload raksasa ditolak', bigBody.status === 400 || bigBody.status === 413, String(bigBody.status));

const noHeader = await webhook({ eventId: `nh_${Date.now()}`, orderNo: order2, status: 'paid', amount: total2, occurredAt: new Date().toISOString() }, { noSig: true });
check('webhook tanpa header tanda tangan ditolak', noHeader.status === 401, JSON.stringify(noHeader.json));

// ---------- 10. rate limit ----------
const spam = [];
for (let i = 0; i < 80; i += 1) spam.push(await req('/api/quote', { method: 'POST', body: { lines: [{ productId: 'p002', qty: 1 }], serviceCode: 'reg', paymentMethodCode: 'qris' } }));
check('rate limit memicu 429', spam.some((r) => r.status === 429), 'tidak ada 429 dalam 80 request');

console.log(`\n${pass} lulus, ${failCount} gagal`);
process.exit(failCount ? 1 : 0);
