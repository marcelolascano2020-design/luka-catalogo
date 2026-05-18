import { useState, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import CategoryFilter from './components/CategoryFilter';
import ProductGrid from './components/ProductGrid';
import CartDrawer from './components/CartDrawer';
import CalcModal from './components/CalcModal';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';
import { Icon } from './components/Icons';
import { CATEGORIAS as STATIC_CATS, PRODUCTOS as STATIC_PRODS } from './data/productos';
import { supabase, supabaseReady } from './lib/supabase';

const WA_PHONE = import.meta.env.VITE_WHATSAPP_NUMBER || "5493515504248";

const LAYOUTS = [
  { value: 'grid',    label: 'Grid' },
  { value: 'compact', label: 'Compact' },
  { value: 'list',    label: 'Lista' },
];

// Normaliza un producto de Supabase al mismo shape que los estáticos
function normalizeProduct(p) {
  return {
    id:    String(p.id),
    cat:   p.categorias?.nombre?.toLowerCase().replace(/\s+/g, '-') || 'general',
    pet: p.categorias?.nombre?.toLowerCase().includes('gato') ? 'Gatos' : p.categorias?.nombre?.toLowerCase().includes('ave') ? 'Aves' : p.categorias?.nombre?.toLowerCase().includes('perro') ? 'Perros' : 'Varios',
    name:  p.nombre,
    brand: p.marca || '',
    size:  p.unidad || '',
    tags:  [],
    desc:  p.descripcion || '',
    precio: p.precio,
    activo: p.activo,
imagen_url: p.imagen_url || null,
  };
}

function normalizeCategory(c) {
  return {
    id:    String(c.id),
    label: c.nombre,
    short: c.emoji || '',
  };
}

// ─── Catalog view ─────────────────────────────────────────────────────────────
function Catalog() {
  const [layout, setLayout]       = useState('grid');
  const [query, setQuery]         = useState('');
  const [cat, setCat]             = useState('all');
  const [pet, setPet]             = useState('all');
  const [sort, setSort]           = useState('default');
  const [filterOpen, setFilterOpen] = useState(false);

  const [cart, setCart]           = useState([]);
  const [cartOpen, setCartOpen]   = useState(false);
  const [calcOpen, setCalcOpen]   = useState(false);

  const [products, setProducts]   = useState([]);
  const [cats, setCats]           = useState([]);
  const [fromSupabase, setFromSupabase] = useState(false);

  // Load from Supabase; fall back to static data
  useEffect(() => {
    const load = async () => {
      if (supabaseReady) {
        try {
          const [{ data: prods, error: e1 }, { data: dbCats, error: e2 }] = await Promise.all([
            supabase.from('productos').select('*, categorias(nombre)').eq('activo', true).order('id'),
            supabase.from('categorias').select('*').eq('activa', true).order('orden'),
          ]);
          if (!e1 && !e2 && prods && dbCats) {
            setProducts(prods.map(normalizeProduct));
            setCats(dbCats.map(normalizeCategory));
            setFromSupabase(true);
            return;
          }
        } catch (_) {}
      }
      // Fallback to static
      setProducts(STATIC_PRODS);
      setCats(STATIC_CATS);
    };
    load();
  }, []);

  // Persist cart
  useEffect(() => {
    try {
      const raw = localStorage.getItem('luka-cart');
      if (raw) setCart(JSON.parse(raw));
    } catch (_) {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('luka-cart', JSON.stringify(cart)); } catch (_) {}
  }, [cart]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter(p => {
      if (cat !== 'all' && p.cat !== cat) return false;
      if (pet !== 'all' && p.pet !== pet) return false;
      if (q && !(`${p.name} ${p.brand} ${p.tags?.join(' ')} ${p.desc}`.toLowerCase().includes(q))) return false;
      return true;
    });
    if (sort === 'az')    list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'brand') list = [...list].sort((a, b) => a.brand.localeCompare(b.brand));
    return list;
  }, [products, query, cat, pet, sort]);

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

  const setQty    = (id, qty) => setCart(prev => prev.map(it => it.p.id === id ? { ...it, qty: Math.max(1, qty) } : it));
  const remove    = (id)       => setCart(prev => prev.filter(it => it.p.id !== id));
  const clearCart = ()          => setCart([]);
  const totalItems = cart.reduce((s, it) => s + it.qty, 0);

  const counts = useMemo(() => {
    const c = { all: products.length };
    for (const k of cats) c[k.id] = products.filter(p => p.cat === k.id).length;
    return c;
  }, [products, cats]);

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
            cats={cats}
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
                <div className="luka-eyebrow">
                  {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
                  {fromSupabase && <span style={{ marginLeft: 6, opacity: 0.5, fontSize: 10 }}>● live</span>}
                </div>
                <h2>{cat === 'all' ? 'Catálogo completo' : cats.find(c => c.id === cat)?.label}</h2>
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
                        padding: '6px 12px', borderRadius: 8,
                        border: '1px solid var(--line-2)',
                        background: layout === l.value ? 'var(--ink)' : 'var(--bg)',
                        color:      layout === l.value ? '#FCEFA8'   : 'var(--ink)',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <ProductGrid products={filtered} onAdd={addToCart} layout={layout} />
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

// ─── Router root ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"      element={<Catalog />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}
