import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { getCatalog, searchCatalog } from '@/lib/db';

const SORTS = ['populer', 'terbaru', 'termurah', 'termahal', 'rating', 'diskon'];

function pageLink(sp, patch) {
  const params = new URLSearchParams(sp);
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === null || v === '') params.delete(k);
    else params.set(k, String(v));
  }
  const q = params.toString();
  return `/catalog${q ? `?${q}` : ''}`;
}

export default async function CatalogPage({ searchParams }) {
  const raw = await searchParams;
  const catalog = await getCatalog();

  const category = catalog.categories.some((c) => c.slug === raw.category) ? raw.category : '';
  const sort = SORTS.includes(raw.sort) ? raw.sort : 'populer';
  const q = typeof raw.q === 'string' ? raw.q.slice(0, 80) : '';
  const page = Math.max(1, Math.min(500, Number.parseInt(raw.page ?? '1', 10) || 1));
  const min = Number.isFinite(Number(raw.min)) && Number(raw.min) > 0 ? Math.floor(Number(raw.min)) : 0;
  const max = Number.isFinite(Number(raw.max)) && Number(raw.max) > 0 ? Math.floor(Number(raw.max)) : 20000000;

  const result = await searchCatalog({ q, category, sort, min, max, page, perPage: 18 });
  const priceCeiling = Math.max(...catalog.products.map((p) => p.price));

  return (
    <div className="container catalog">
      <aside>
        <div className="panel filters">
          <h3>Kategori</h3>
          <div className="filter-list">
            <Link className={category ? '' : 'on'} href={pageLink(raw, { category: '', page: '' })}>
              Semua kategori
            </Link>
            {catalog.categories.map((c) => (
              <Link key={c.id} className={category === c.slug ? 'on' : ''} href={pageLink(raw, { category: c.slug, page: '' })}>
                {c.emoji} {c.name}
              </Link>
            ))}
          </div>

          <form method="get" action="/catalog">
            {q ? <input type="hidden" name="q" value={q} /> : null}
            {category ? <input type="hidden" name="category" value={category} /> : null}
            <input type="hidden" name="sort" value={sort} />
            <label htmlFor="min">Harga minimum (Rp)</label>
            <input id="min" name="min" type="number" min="0" max={priceCeiling} step="1000" defaultValue={min || ''} placeholder="0" />
            <label htmlFor="max">Harga maksimum (Rp)</label>
            <input id="max" name="max" type="number" min="1000" max="20000000" step="1000" defaultValue={max && max < 20000000 ? max : ''} placeholder={String(priceCeiling)} />
            <button className="btn btn-outline btn-sm btn-block" style={{ marginTop: 12 }} type="submit">
              Terapkan filter
            </button>
          </form>

          <div style={{ marginTop: 14 }}>
            <h3>Urutkan</h3>
            <div className="filter-list">
              {SORTS.map((s) => (
                <Link key={s} className={sort === s ? 'on' : ''} href={pageLink(raw, { sort: s, page: '' })}>
                  {s}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <section>
        <div className="result-bar">
          <strong>{result.total} produk</strong>
          {q ? <span className="chip">🔍 “{q}”</span> : null}
          {category ? <span className="chip">{catalog.categories.find((c) => c.slug === category)?.name}</span> : null}
          <span className="space" />
          <span className="small muted">Harga &amp; stok dihitung ulang dari server pada saat checkout.</span>
        </div>

        {result.items.length === 0 ? (
          <div className="panel empty">
            <div style={{ fontSize: 44 }}>🐝🍯</div>
            <p>Leba belum menemukan produk yang cocok. Coba ubah kata kunci atau filter harga.</p>
            <Link className="btn btn-primary btn-sm" href="/catalog">Reset filter</Link>
          </div>
        ) : (
          <div className="grid-products">
            {result.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {result.pages > 1 ? (
          <nav className="pagination" aria-label="Halaman">
            {Array.from({ length: result.pages }, (_, i) => i + 1).slice(0, 12).map((n) =>
              n === result.page ? (
                <span key={n} className="on">{n}</span>
              ) : (
                <Link key={n} href={pageLink(raw, { page: n })}>{n}</Link>
              ),
            )}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
