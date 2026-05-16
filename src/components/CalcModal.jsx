import { useState } from 'react';
import { Icon } from './Icons';

function calcRation({ species, weight, activity, life }) {
  const w = Math.max(0.5, Number(weight) || 0);
  const rer = 70 * Math.pow(w, 0.75);
  let factor = 1.6;
  if (species === 'perro') {
    if (life === 'cachorro') factor = w < 5 ? 3.0 : 2.5;
    else if (life === 'senior') factor = 1.2;
    else factor = activity === 'alta' ? 1.8 : activity === 'baja' ? 1.4 : 1.6;
  } else {
    if (life === 'cachorro') factor = 2.5;
    else if (life === 'senior') factor = 1.1;
    else factor = activity === 'alta' ? 1.4 : activity === 'baja' ? 1.0 : 1.2;
  }
  const kcal = rer * factor;
  const grams = Math.round(kcal / 3.5 / 5) * 5;
  return { kcal: Math.round(kcal), grams };
}

export default function CalcModal({ open, onClose }) {
  const [species, setSpecies] = useState('perro');
  const [weight, setWeight] = useState(10);
  const [activity, setActivity] = useState('media');
  const [life, setLife] = useState('adulto');
  const r = calcRation({ species, weight, activity, life });

  if (!open) return null;
  return (
    <>
      <div className="luka-scrim is-open" onClick={onClose} />
      <div className="luka-modal" role="dialog" aria-label="Calculadora de ración">
        <header className="luka-modal-head">
          <div>
            <div className="luka-eyebrow">Herramienta</div>
            <h2>Calculadora de ración diaria</h2>
          </div>
          <button className="luka-iconbtn" onClick={onClose}><Icon.Close /></button>
        </header>

        <div className="luka-modal-body">
          <div className="luka-calc-row">
            <label className="luka-field">
              <span>Mascota</span>
              <div className="luka-seg">
                <button className={species === 'perro' ? 'on' : ''} onClick={() => setSpecies('perro')}>Perro</button>
                <button className={species === 'gato' ? 'on' : ''} onClick={() => setSpecies('gato')}>Gato</button>
              </div>
            </label>
            <label className="luka-field">
              <span>Etapa de vida</span>
              <div className="luka-seg">
                <button className={life === 'cachorro' ? 'on' : ''} onClick={() => setLife('cachorro')}>Cachorro</button>
                <button className={life === 'adulto' ? 'on' : ''} onClick={() => setLife('adulto')}>Adulto</button>
                <button className={life === 'senior' ? 'on' : ''} onClick={() => setLife('senior')}>Senior</button>
              </div>
            </label>
          </div>

          <label className="luka-field">
            <span>Peso del animal: <b>{weight} kg</b></span>
            <input type="range" min="0.5" max="60" step="0.5" value={weight} onChange={e => setWeight(+e.target.value)} />
            <div className="luka-range-axis"><span>0,5</span><span>30</span><span>60 kg</span></div>
          </label>

          <label className="luka-field">
            <span>Actividad</span>
            <div className="luka-seg">
              <button className={activity === 'baja' ? 'on' : ''} onClick={() => setActivity('baja')}>Baja</button>
              <button className={activity === 'media' ? 'on' : ''} onClick={() => setActivity('media')}>Media</button>
              <button className={activity === 'alta' ? 'on' : ''} onClick={() => setActivity('alta')}>Alta</button>
            </div>
          </label>

          <div className="luka-calc-result">
            <div className="luka-calc-result-main">
              <div className="luka-calc-big">{r.grams} <span>g/día</span></div>
              <div className="luka-calc-sub">Equivale a ~{r.kcal} kcal diarias</div>
            </div>
            <div className="luka-calc-tip">
              <div className="luka-eyebrow">Recomendación</div>
              <p>Dividilo en {life === 'cachorro' ? '3–4' : '2'} tomas a lo largo del día. Es una estimación; consultá al veterinario para casos especiales.</p>
            </div>
          </div>
        </div>

        <footer className="luka-modal-foot">
          <p className="luka-fineprint">Cálculo orientativo basado en alimento estándar (~3.5 kcal/g). El valor puede variar según la marca.</p>
          <button className="luka-cta-dark" onClick={onClose}>Listo</button>
        </footer>
      </div>
    </>
  );
}
