import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseReady } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Icon } from './Icons';

// ─── Login Modal ──────────────────────────────────────────────────────────────
function LoginModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabaseReady) {
      setError('Servicio no disponible: variables de entorno no configuradas.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
    }
    // On success: onAuthStateChange fires → useAuth updates → redirect effect fires
  };

  return (
    <>
      <div className="luka-scrim is-open" onClick={onClose} />
      <div className="luka-modal" role="dialog" aria-label="Iniciar sesión" style={{ width: 'min(400px, 92vw)' }}>
        <header className="luka-modal-head">
          <div>
            <div className="luka-eyebrow">Acceso</div>
            <h2>Iniciá sesión</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--muted)' }}
            aria-label="Cerrar"
          >
            <Icon.Close s={18} />
          </button>
        </header>
        <div className="luka-modal-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label className="luka-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                style={inputStyle}
                placeholder="tu@email.com"
              />
            </label>
            <label className="luka-field">
              <span>Contraseña</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </label>
            {error && <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="luka-cta-dark"
              style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

const inputStyle = {
  padding: '9px 12px',
  border: '1px solid var(--line-2)',
  borderRadius: 10,
  background: 'var(--bg)',
  fontSize: 14,
  color: 'var(--ink)',
  width: '100%',
  boxSizing: 'border-box',
};

// ─── Header ───────────────────────────────────────────────────────────────────
export default function Header({ query, setQuery, totalItems, onCartOpen, onCalcOpen }) {
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  // Redirect after login based on role — wait for role to be fetched (not null)
  useEffect(() => {
    if (!loading && session && role !== null) {
      if (role === 'admin') navigate('/admin', { replace: true });
      setLoginOpen(false);
    }
  }, [loading, session, role, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <header className="luka-top">
        <div className="luka-top-inner">
          <a className="luka-brand" href="#">
            <img src="/assets/logo.jpg" alt="Luka" className="luka-logo" style={{ objectFit: 'contain' }} />
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
            {!loading && (
              session ? (
                <button className="luka-pill" onClick={handleLogout} title="Cerrar sesión">
                  <Icon.Close s={14} /> <span>Salir</span>
                </button>
              ) : (
                <button className="luka-pill" onClick={() => setLoginOpen(true)}>
                  <span>Iniciar sesión</span>
                </button>
              )
            )}
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

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </>
  );
}
