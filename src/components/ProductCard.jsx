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

const FALLBACK = {
  Perros: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400',
  Gatos:  'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400',
  _default:'https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=400',
};

function fallbackUrl(pet) {
  return FALLBACK[pet] ?? FALLBACK._default;
}

export function ProductImage({ p, layout }) {
  const src = p.imagen_url || fallbackUrl(p.pet);
  const isGrid = layout !== 'list';
  return (
    <div className={`luka-prod-img${isGrid ? ' luka-prod-img-grid' : ''}`}
      style={{ aspectRatio: layout === 'list' ? '1 / 1' : '4 / 3' }}>
      <img src={src} alt={p.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}

export default function ProductCard({ p, onAdd, layout }) {
  const isList = layout === 'list';
  return (
    <article className={`luka-card${isList ? ' luka-card-list' : ''}`}>
      <div className="luka-card-media">
        <ProductImage p={p} layout={layout} />
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
        {p.precio > 0 && <div className="luka-card-price">${p.precio.toLocaleString('es-AR')}</div>}
        {isList && <p className="luka-card-desc">{p.desc}</p>}
        <button className="luka-add" onClick={() => onAdd(p)}>
          <Icon.Plus s={14} />
          <span className="luka-add-full">Sumar al pedido</span>
          <span className="luka-add-short">Agregar</span>
        </button>
      </div>
    </article>
  );
}
