import { Icon } from './Icons';

const WA_PHONE = import.meta.env.VITE_WHATSAPP_NUMBER || "5493515504248";

const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 980;

export default function CategoryFilter({ cats, cat, setCat, pet, setPet, sort, setSort, counts, filterOpen, onClose, filteredCount, onCalcOpen }) {

  const handlePet = (v) => {
    setPet(v);
    if (isMobile()) onClose();
  };

  const handleCat = (v) => {
    setCat(v);
    if (isMobile()) onClose();
  };

  return (
    <aside className={`luka-side ${filterOpen ? 'is-open' : ''}`}>
      <div className="luka-side-section">
        <div className="luka-side-title">Mascota</div>
        <div className="luka-chips">
          {[['all','Todas'],['Perros','Perros'],['Gatos','Gatos'],['Aves','Aves'],['Varios','Varios']].map(([v, l]) => (
            <button key={v} className={`luka-chip ${pet === v ? 'on' : ''}`} onClick={() => handlePet(v)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="luka-side-section">
        <div className="luka-side-title">Categoría</div>
        <button className={`luka-catbtn ${cat === 'all' ? 'on' : ''}`} onClick={() => handleCat('all')}>
          <span>Todo el catálogo</span><em>{counts.all}</em>
        </button>
        {cats.map(c => (
          <button key={c.id} className={`luka-catbtn ${cat === c.id ? 'on' : ''}`} onClick={() => handleCat(c.id)}>
            <span>{c.label}</span><em>{counts[c.id]}</em>
          </button>
        ))}
      </div>
      <div className="luka-side-section">
        <div className="luka-side-title">Ordenar</div>
        <select className="luka-select" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="default">Sugerido</option>
          <option value="az">Nombre A–Z</option>
          <option value="brand">Marca A–Z</option>
        </select>
      </div>
      <div className="luka-side-help">
        <div className="luka-eyebrow">¿Dudas?</div>
        <p>Los precios y stock se confirman por WhatsApp. Te asesoramos para elegir el alimento ideal.</p>
        <a className="luka-cta-wa luka-cta-wa-mini" href={`https://wa.me/${WA_PHONE}`} target="_blank" rel="noopener noreferrer">
          <Icon.Whatsapp s={14} /> Escribinos
        </a>
      </div>

      {/* Mobile-only sticky footer button */}
      <div className="luka-side-apply">
        <button onClick={onClose}>
          Ver {filteredCount} {filteredCount === 1 ? 'producto' : 'productos'} →
        </button>
      </div>
    </aside>
  );
}
