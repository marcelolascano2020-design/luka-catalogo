import { Icon } from './Icons';

const PALETTE = [
  ["#FFE680", "#E5A82C"],
  ["#FAD9A8", "#C77F2A"],
  ["#F0E6D2", "#A88B5F"],
  ["#FFF3C4", "#D4A93B"],
  ["#EADBC0", "#7A5B36"],
];

function hashIdx(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % PALETTE.length;
}

export function ProductImage({ p, ratio = "4 / 3" }) {
  const [bg, fg] = PALETTE[hashIdx(p.id)];
  const label = `${p.brand} · ${p.size}`;
  if (p.imagen_url) {
    return (
      <div className="luka-prod-img" style={{ aspectRatio: ratio }}>
        <img src={p.imagen_url} alt={p.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  return (
    <div className="luka-prod-img" style={{ background: bg, aspectRatio: ratio }}>
      <svg className="luka-prod-stripes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <pattern id={`s-${p.id}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <line x1="0" y1="0" x2="0" y2="8" stroke={fg} strokeOpacity="0.18" strokeWidth="4" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill={`url(#s-${p.id})`} />
      </svg>
      <div className="luka-prod-img-tag">
        <span className="luka-mono">FOTO · {p.cat.toUpperCase()}</span>
        <span className="luka-mono luka-mono-sm">{label}</span>
      </div>
    </div>
  );
}

export default function ProductCard({ p, onAdd, layout }) {
  const cls = 'luka-card' + (layout === 'list' ? ' luka-card-list' : '');
  return (
    <article className={cls}>
      <div className="luka-card-media">
        <ProductImage p={p} ratio={layout === 'list' ? '1 / 1' : '4 / 3'} />
        <span className="luka-pet-chip">{p.pet}</span>
      </div>
      <div className="luka-card-body">
        <div className="luka-card-brand">{p.brand}</div>
        <h3 className="luka-card-name">{p.name}</h3>
        <div className="luka-card-meta">
          <span className="luka-size">{p.size}</span>
          <span className="luka-dot">·</span>
          <span>{p.tags.slice(0, 2).join(' · ')}</span>
        </div>
        {layout === 'list' && <p className="luka-card-desc">{p.desc}</p>}
        <button className="luka-add" onClick={() => onAdd(p)}>
          <Icon.Plus s={14} /> Sumar al pedido
        </button>
      </div>
    </article>
  );
}
