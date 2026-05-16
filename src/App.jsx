import { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import CategoryFilter from './components/CategoryFilter';
import ProductGrid from './components/ProductGrid';
import CartDrawer from './components/CartDrawer';
import CalcModal from './components/CalcModal';
import Footer from './components/Footer';
import { Icon } from './components/Icons';
import { CATEGORIAS, PRODUCTOS } from './data/productos';

const WA_PHONE = import.meta.env.VITE_WHATSAPP_NUMBER || "5493515504248";

const LAYOUTS = [
  { value: 'grid',    label: 'Grid' },
  { value: 'compact', label: 'Compact' },
  { value: 'list',    label: 'Lista' },
];

export default function App() {
  const [layout, setLayout] = useState('grid');
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [pet, setPet] = useState('all');
  const [sort, setSort] = useState('default');
  const [filterOpen, setFilterOpen] = useState(false);

  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('luka-cart');
      if (raw) setCart(JSON.parse(raw));
    } catch (e) {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('luka-cart', JSON.stringify(cart)); } catch (e) {}
  }, [cart]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = PRODUCTOS.filter(p => {
      if (cat !== 'all' && p.cat !== cat) return false;
      if (pet !== 'all' && p.pet !== pet) return false;
      if (q && !(`${p.name} ${p.brand} ${p.tags.join(' ')} ${p.desc}`.toLowerCase().includes(q))) return false;
      return true;
    });
    if (sort === 'az') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'brand') list = [...list].sort((a, b) => a.brand.localeCompare(b.brand));
    return list;
  }, [query, cat, pet, sort]);

  const addToCart = (p) => {
    setCart(prev => {
      const i = prev.findIndex(it => it.p.id === p.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + 1 };
        return next;
      }
      return [...prev, { p, qty: 1 }];
    });
    setCartOpen(true);
  };

  const setQty = (id, qty) => setCart(prev => prev.map(it => it.p.id === id ? { ...it, qty: Math.max(1, qty) } : it));
  const remove = (id) => setCart(prev => prev.filter(it => it.p.id !== id));
  const clearCart = () => setCart([]);
  const totalItems = cart.reduce((s, it) => s + it.qty, 0);

  const counts = useMemo(() => {
    const c = { all: PRODUCTOS.length };
    for (const k of CATEGORIAS) c[k.id] = PRODUCTOS.filter(p => p.cat === k.id).length;
    return c;
  }, []);

  return (
    <div className="luka-app">
      <Header
        query={query}
        setQuery={setQuery}
        totalItems={totalItems}
        onCartOpen={() => setCartOpen(true)}
        onCalcOpen={() => setCalcOpen(true)}
      />

      <Hero onCalcOpen={() => setCalcOpen(true)} />

      <main className="luka-main" id="catalogo">
        <div className="luka-main-inner">
          <CategoryFilter
            cats={CATEGORIAS}
            cat={cat}
            setCat={setCat}
            pet={pet}
            setPet={setPet}
            sort={sort}
            setSort={setSort}
            counts={counts}
            filterOpen={filterOpen}
            onCalcOpen={() => setCalcOpen(true)}
          />

          <section className="luka-feed">
            <div className="luka-feed-head">
              <div>
                <div className="luka-eyebrow">{filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}</div>
                <h2>{cat === 'all' ? 'Catálogo completo' : CATEGORIAS.find(c => c.id === cat)?.label}</h2>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="luka-mobile-filter" onClick={() => setFilterOpen(o => !o)}>
                  <Icon.Filter /> Filtros
                </button>
                <div style={{ display: 'flex', gap: 4 }}>
                  {LAYOUTS.map(l => (
                    <button
                      key={l.value}
                      onClick={() => setLayout(l.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--line-2)',
                        background: layout === l.value ? 'var(--ink)' : 'var(--bg)',
                        color: layout === l.value ? '#FCEFA8' : 'var(--ink)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <ProductGrid
              products={filtered}
              onAdd={addToCart}
              layout={layout}
            />
          </section>
        </div>
      </main>

      <Footer />

      <CartDrawer
        open={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onQty={setQty}
        onRemove={remove}
        onClear={clearCart}
      />

      <CalcModal open={calcOpen} onClose={() => setCalcOpen(false)} />

      {!cartOpen && !calcOpen && (
        <a className="luka-fab" href={`https://wa.me/${WA_PHONE}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
          <Icon.Whatsapp s={26} />
        </a>
      )}
    </div>
  );
}
