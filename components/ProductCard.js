import Link from 'next/link';
import { formatIDR, compactCount } from '@/lib/money';

export default function ProductCard({ product }) {
  const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  return (
    <article className="card">
      <Link href={`/product/${product.slug}`} aria-label={product.name}>
        <div className="card-art" style={{ background: `linear-gradient(140deg, ${product.hue[0]}, ${product.hue[1]})` }}>
          <span className="card-flag">
            {product.flashSale ? <span className="chip chip-honey">⚡ Flash</span> : null}
          </span>
          <span className="emoji" style={{ fontSize: 52 }}>{product.emoji}</span>
        </div>
      </Link>
      <div className="card-body">
        <Link href={`/product/${product.slug}`} className="card-name">
          {product.name}
        </Link>
        <div className="price">
          {formatIDR(product.price)} {discount > 0 ? <span className="strike">{formatIDR(product.mrp)}</span> : null}
        </div>
        {discount > 0 ? <div><span className="chip">Diskon {discount}%</span></div> : null}
        <div className="card-city">📍 {product.city}</div>
        <div className="card-meta">
          <span>⭐ {product.rating.toFixed(1)}</span>
          <span>·</span>
          <span>{compactCount(product.sold)} terjual</span>
        </div>
        {product.freeShipping ? <span className="chip chip-honey">🚚 Gratis ongkir</span> : null}
        <div className="card-actions" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{product.sellerName}</div>
      </div>
    </article>
  );
}
