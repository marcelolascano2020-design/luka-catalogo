import { useState, useEffect } from 'react';
import { Icon } from './Icons';
import { supabase, supabaseReady } from '../lib/supabase';

const WA_PHONE = import.meta.env.VITE_WHATSAPP_NUMBER || "5493515504248";

const DEFAULTS = {
  hero_titulo:          'Comida y accesorios para que tu mascota coma como Luka.',
  hero_subtitulo:       'Alimento balanceado, snacks y todo lo que necesita tu mascota. Armá tu pedido y mandanos un mensaje — te confirmamos precios y stock al toque.',
  hero_hoy_etiqueta:    'Hoy',
  hero_hoy_titulo:      'Bolsa de 15 kg',
  hero_hoy_descripcion: 'Llevá tu marca habitual al mejor precio.',
};

function useHeroConfig() {
  const [cfg, setCfg] = useState(DEFAULTS);
  useEffect(() => {
    if (!supabaseReady) return;
    supabase
      .from('configuracion')
      .select('clave,valor')
      .in('clave', Object.keys(DEFAULTS))
      .then(({ data }) => {
        if (!data?.length) return;
        const patch = {};
        data.forEach(r => { patch[r.clave] = r.valor; });
        setCfg(c => ({ ...c, ...patch }));
      });
  }, []);
  return cfg;
}

export default function Hero({ onCalcOpen }) {
  const cfg = useHeroConfig();

  const scrollToCatalog = () => {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="luka-hero">
      <div className="luka-hero-inner">
        <div className="luka-hero-text">
          <div className="luka-eyebrow">Forrajería · Catálogo {new Date().getFullYear()}</div>
          <h1>{cfg.hero_titulo}</h1>
          <p>{cfg.hero_subtitulo}</p>
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

          {/* Card HOY — clickeable, scrollea al catálogo */}
          <button
            className="luka-hero-card luka-hero-card-1 luka-hero-card-clickable"
            onClick={scrollToCatalog}
          >
            <div className="luka-eyebrow">{cfg.hero_hoy_etiqueta}</div>
            <strong>{cfg.hero_hoy_titulo}</strong>
            <span>{cfg.hero_hoy_descripcion}</span>
            <span className="luka-hero-card-arrow">Ver ofertas →</span>
          </button>

          {/* Card TIP */}
          <div className="luka-hero-card luka-hero-card-2">
            <div className="luka-eyebrow">Tip</div>
            <strong>¿Cuánto le doy?</strong>
            <span>Usá la calculadora de ración diaria.</span>
            <button className="luka-hero-calc-btn" onClick={onCalcOpen}>
              Abrir calculadora →
            </button>
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
