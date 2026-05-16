import { Icon } from './Icons';

const WA_PHONE = import.meta.env.VITE_WHATSAPP_NUMBER || "5493515504248";

export default function Hero({ onCalcOpen }) {
  const scrollToCatalog = () => {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="luka-hero">
      <div className="luka-hero-inner">
        <div className="luka-hero-text">
          <div className="luka-eyebrow">Forrajería · Catálogo {new Date().getFullYear()}</div>
          <h1>Comida y accesorios <br />para que tu mascota <em>coma como Luka</em>.</h1>
          <p>Alimento balanceado, snacks y todo lo que necesita tu mascota. Armá tu pedido y mandanos un mensaje &mdash; te confirmamos precios y stock al toque.</p>
          <div className="luka-hero-actions">
            <button className="luka-cta-dark" onClick={scrollToCatalog}>
              Ver el catálogo <Icon.Arrow />
            </button>
            <a className="luka-cta-ghost" href={`https://wa.me/${WA_PHONE}`} target="_blank" rel="noopener noreferrer">
              <Icon.Whatsapp s={16} /> Hablar con Luka
            </a>
          </div>
        </div>
        <div className="luka-hero-side">
          <div className="luka-hero-card luka-hero-card-1">
            <div className="luka-eyebrow">Hoy</div>
            <strong>Bolsa de 15 kg</strong>
            <span>Llevá tu marca habitual al mejor precio.</span>
          </div>
          <div className="luka-hero-card luka-hero-card-2">
            <div className="luka-eyebrow">Tip</div>
            <strong>¿Cuánto le doy?</strong>
            <span>Usá la calculadora de ración diaria.</span>
            <button className="luka-link" onClick={onCalcOpen}>Abrir <Icon.Arrow s={12} /></button>
          </div>
          <div className="luka-hero-card luka-hero-card-3">
            <div className="luka-eyebrow">Envíos</div>
            <strong>Córdoba Capital</strong>
            <span>Coordinamos por WhatsApp.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
