import { Icon } from './Icons';

const WA_PHONE = import.meta.env.VITE_WHATSAPP_NUMBER || "5493515504248";

export default function Header({ query, setQuery, totalItems, onCartOpen, onCalcOpen }) {
  return (
    <header className="luka-top">
      <div className="luka-top-inner">
        <a className="luka-brand" href="#">
          <img src="/assets/logo.jpg" alt="Luka" className="luka-logo" />
          <div className="luka-brand-text">
            <strong>Luka</strong>
            <span>Alimentos balanceados para mascotas</span>
          </div>
        </a>
        <div className="luka-search">
          <Icon.Search />
          <input
            placeholder="Buscá por marca, producto o categoría…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className="luka-search-clear" onClick={() => setQuery('')}>
              <Icon.Close s={14} />
            </button>
          )}
        </div>
        <div className="luka-top-actions">
          <button className="luka-pill" onClick={onCalcOpen}>
            <Icon.Calc s={16} /> <span>Calculadora de ración</span>
          </button>
          <button className="luka-pill luka-pill-primary" onClick={onCartOpen}>
            <Icon.Cart s={16} />
            <span>Mi pedido</span>
            {totalItems > 0 && <em>{totalItems}</em>}
          </button>
        </div>
      </div>
      <div className="luka-top-strip-wrap">
        <div className="luka-top-strip">
          <span><Icon.Pin /> Octavio Pinto 2207, Córdoba</span>
          <span><Icon.Phone /> +54 9 3515 50-4248</span>
          <span><Icon.Whatsapp s={14} /> Pedidos por WhatsApp · Envíos a domicilio</span>
        </div>
      </div>
    </header>
  );
}
