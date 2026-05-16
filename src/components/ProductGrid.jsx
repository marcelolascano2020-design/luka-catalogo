import ProductCard from './ProductCard';
import { Icon } from './Icons';

export default function ProductGrid({ products, onAdd, layout }) {
  if (products.length === 0) {
    return (
      <div className="luka-empty">
        <div className="luka-empty-circle"><Icon.Search s={32} /></div>
        <p>No encontramos productos con esos filtros.</p>
      </div>
    );
  }
  return (
    <div className={`luka-grid luka-grid-${layout}`}>
      {products.map(p => (
        <ProductCard key={p.id} p={p} onAdd={onAdd} layout={layout} />
      ))}
    </div>
  );
}
