import { api, json } from '@/lib/http';
import { getCatalog, searchCatalog } from '@/lib/db';
import { rateLimit } from '@/lib/ratelimit';
import { clientIp } from '@/lib/http';

const PUBLIC_FIELDS = ['id', 'slug', 'name', 'price', 'mrp', 'stock', 'emoji', 'hue', 'city', 'sellerName', 'rating', 'sold', 'freeShipping', 'flashSale', 'categoryName', 'categorySlug'];

function publicView(p) {
  const out = {};
  for (const f of PUBLIC_FIELDS) out[f] = p[f];
  return out;
}

export const GET = api(async (req) => {
  const rl = rateLimit({ key: `catalog:${clientIp(req)}`, limit: 240, windowMs: 60_000 });
  if (!rl.ok) return json({ ok: false, error: 'Terlalu banyak permintaan' }, { status: 429 });

  const sp = new URL(req.url).searchParams;
  const catalog = await getCatalog();

  const idsParam = sp.get('ids');
  if (idsParam) {
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 50);
    const items = catalog.products.filter((p) => ids.includes(p.id)).map(publicView);
    return json({ ok: true, items });
  }

  const q = (sp.get('q') || '').slice(0, 80);
  const category = sp.get('category') || '';
  const sort = sp.get('sort') || 'populer';
  const page = Math.max(1, Math.min(500, Number.parseInt(sp.get('page') || '1', 10) || 1));
  const result = await searchCatalog({ q, category, sort, page, perPage: 24 });
  return json({ ok: true, total: result.total, page: result.page, pages: result.pages, items: result.items.map(publicView) });
});
