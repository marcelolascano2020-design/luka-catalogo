import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseReady } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Icon } from './Icons';

const inp = {
  padding: '10px 13px', border: '1.5px solid #e0d8d0', borderRadius: 10,
  fontSize: 14, background: '#faf8f5', color: '#2b1f14',
  width: '100%', boxSizing: 'border-box', outline: 'none',
};
const fld = { display: 'flex', flexDirection: 'column', gap: 6 };
const lbl = { fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' };

// ─── Auth Modal (login + registro completo) ───────────────────────────────────
const EMPTY_PROFILE = {
  nombre_completo: '', celular: '', barrio: '',
  nombre_mascota: '', edad_mascota: '', juguete_preferido: '',
};

function AuthModal({ onClose }) {
  const [mode, setMode]         = useState('login'); // 'login' | 'register'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [profile, setProfile]   = useState(EMPTY_PROFILE);
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);
  const [done, setDone]         = useState(false);

  const setP = (k, v) => setProfile(f => ({ ...f, [k]: v }));

  const switchMode = (m) => {
    setMode(m); setError(''); setPassword(''); setConfirm(''); setProfile(EMPTY_PROFILE);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!supabaseReady) { setError('Servicio no disponible.'); return; }
    setBusy(true); setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setBusy(false); }
    // on success: onAuthStateChange fires → useAuth updates → Header closes modal
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!supabaseReady) { setError('Servicio no disponible.'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (!profile.nombre_completo.trim()) { setError('El nombre completo es requerido.'); return; }
    setBusy(true); setError('');

    const { data, error: authErr } = await supabase.auth.signUp({ email, password });
    if (authErr) { setError(authErr.message); setBusy(false); return; }

    // Only upsert profile if the session is active (email confirm disabled).
    // When email confirm is ON, data.session is null — upsert would run
    // unauthenticated and be blocked by RLS. ProfileCompletionModal handles it
    // on first login instead.
    if (data?.session && data?.user?.id) {
      await supabase.from('profiles').upsert({
        id:                data.user.id,
        role:              'cliente',
        email,
        nombre_completo:   profile.nombre_completo.trim(),
        celular:           profile.celular.trim(),
        barrio:            profile.barrio.trim(),
        nombre_mascota:    profile.nombre_mascota.trim(),
        edad_mascota:      profile.edad_mascota.trim(),
        juguete_preferido: profile.juguete_preferido.trim(),
      }, { onConflict: 'id' });
    }

    setDone(true);
    setBusy(false);
  };

  // ── Shared section heading ────────────────────────────────────────────────
  const SecHead = ({ label }) => (
    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 10 }}>
      {label}
    </div>
  );

  return (
    <>
      <div className="luka-scrim is-open" onClick={onClose} />
      <div className="luka-modal" role="dialog" style={{ width: 'min(480px, 96vw)' }}>
        <header className="luka-modal-head">
          <div>
            <div className="luka-eyebrow">{mode === 'login' ? 'Acceso' : 'Registro'}</div>
            <h2>{mode === 'login' ? 'Iniciá sesión' : 'Creá tu cuenta'}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
            <Icon.Close s={18} />
          </button>
        </header>

        <div className="luka-modal-body">
          {done ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
              <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 8px' }}>¡Cuenta creada!</p>
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
                Si la confirmación de email está habilitada, revisá tu correo para activar la cuenta.
                Si no, ya podés ingresar con tu email y contraseña.
              </p>
              <button onClick={() => { setDone(false); switchMode('login'); }} style={{ marginTop: 20 }} className="luka-cta-dark">
                Iniciar sesión
              </button>
            </div>

          ) : mode === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={fld}>
                <span style={lbl}>Email</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus style={inp} placeholder="tu@email.com" />
              </div>
              <div style={fld}>
                <span style={lbl}>Contraseña</span>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inp} />
              </div>
              {error && <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{error}</p>}
              <button type="submit" disabled={busy} className="luka-cta-dark" style={{ width: '100%', justifyContent: 'center', opacity: busy ? 0.7 : 1 }}>
                {busy ? 'Ingresando…' : 'Ingresar'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
                ¿No tenés cuenta?{' '}
                <button type="button" onClick={() => switchMode('register')} style={{ background: 'none', border: 'none', color: 'var(--ink)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  Registrate
                </button>
              </p>
            </form>

          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* ── Acceso ── */}
              <div>
                <SecHead label="Datos de acceso" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={fld}>
                    <span style={lbl}>Email *</span>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus style={inp} placeholder="tu@email.com" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={fld}>
                      <span style={lbl}>Contraseña *</span>
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inp} placeholder="Mín. 6 caracteres" />
                    </div>
                    <div style={fld}>
                      <span style={lbl}>Repetir *</span>
                      <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required style={inp} placeholder="Repetir contraseña" />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--line)' }} />

              {/* ── Sobre vos ── */}
              <div>
                <SecHead label="Sobre vos" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={fld}>
                    <span style={lbl}>Nombre completo *</span>
                    <input type="text" style={inp} value={profile.nombre_completo} onChange={e => setP('nombre_completo', e.target.value)} required placeholder="Ej: María González" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={fld}>
                      <span style={lbl}>Celular</span>
                      <input type="tel" style={inp} value={profile.celular} onChange={e => setP('celular', e.target.value)} placeholder="Ej: 3515 123456" />
                    </div>
                    <div style={fld}>
                      <span style={lbl}>Barrio</span>
                      <input type="text" style={inp} value={profile.barrio} onChange={e => setP('barrio', e.target.value)} placeholder="Ej: Villa Cabrera" />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--line)' }} />

              {/* ── Sobre la mascota ── */}
              <div>
                <SecHead label="Sobre tu mascota" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={fld}>
                      <span style={lbl}>Nombre de la mascota</span>
                      <input type="text" style={inp} value={profile.nombre_mascota} onChange={e => setP('nombre_mascota', e.target.value)} placeholder="Ej: Firulais" />
                    </div>
                    <div style={fld}>
                      <span style={lbl}>Edad de la mascota</span>
                      <input type="text" style={inp} value={profile.edad_mascota} onChange={e => setP('edad_mascota', e.target.value)} placeholder="Ej: 3 años" />
                    </div>
                  </div>
                  <div style={fld}>
                    <span style={lbl}>Juguete preferido</span>
                    <ChipSelector options={JUGUETES} value={profile.juguete_preferido} onChange={v => setP('juguete_preferido', v)} />
                  </div>
                </div>
              </div>

              {error && <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{error}</p>}

              <button type="submit" disabled={busy} className="luka-cta-dark" style={{ width: '100%', justifyContent: 'center', opacity: busy ? 0.7 : 1 }}>
                {busy ? 'Creando cuenta…' : 'Crear cuenta'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', margin: '-4px 0 0' }}>
                ¿Ya tenés cuenta?{' '}
                <button type="button" onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', color: 'var(--ink)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  Iniciá sesión
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Profile Completion Modal ─────────────────────────────────────────────────
const JUGUETES = ['Pelota', 'Cuerda', 'Peluche', 'Hueso', 'Ratón', 'Láser', 'Otro'];

function ChipSelector({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => (
        <button
          key={o} type="button"
          onClick={() => onChange(value === o ? '' : o)}
          style={{
            padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', border: '1.5px solid',
            borderColor: value === o ? 'var(--ink)' : 'var(--line-2)',
            background:  value === o ? 'var(--ink)' : 'transparent',
            color:       value === o ? '#FCEFA8'   : 'var(--ink)',
          }}
        >{o}</button>
      ))}
    </div>
  );
}

function ProfileCompletionModal({ userId, onClose }) {
  const [form, setForm] = useState({
    nombre_completo: '', celular: '', barrio: '',
    nombre_mascota: '', edad_mascota: '', juguete_preferido: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { data: saved, error: err } = await supabase
      .from('profiles')
      .upsert({
        id:                userId,
        nombre_completo:   form.nombre_completo.trim(),
        celular:           form.celular.trim(),
        barrio:            form.barrio.trim(),
        nombre_mascota:    form.nombre_mascota.trim(),
        edad_mascota:      form.edad_mascota.trim(),
        juguete_preferido: form.juguete_preferido.trim(),
      }, { onConflict: 'id' })
      .select('id');
    if (err) { setError(err.message); setSaving(false); return; }
    if (!saved?.length) {
      setError('No se pudo guardar el perfil. El admin necesita ejecutar el SQL de configuración (política "Users can update own profile").');
      setSaving(false);
      return;
    }
    onClose();
  };

  return (
    <>
      <div className="luka-scrim is-open" style={{ zIndex: 96 }} />
      <div className="luka-modal" role="dialog" style={{ width: 'min(560px, 96vw)', zIndex: 97 }}>
        <header className="luka-modal-head">
          <div>
            <div className="luka-eyebrow">Bienvenido/a a Luka</div>
            <h2>Completá tu perfil 🐾</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
            <Icon.Close s={18} />
          </button>
        </header>

        <div className="luka-modal-body">
          <p style={{ margin: '0 0 20px', color: 'var(--muted)', fontSize: 14 }}>
            Nos ayuda a conocerte mejor para darte el mejor servicio. Podés saltear los campos que no querés completar ahora.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Sección: Sobre vos */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 12 }}>
                Sobre vos
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={fld}>
                  <span style={lbl}>Nombre completo *</span>
                  <input type="text" style={inp} value={form.nombre_completo} onChange={e => set('nombre_completo', e.target.value)} required placeholder="Ej: María González" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={fld}>
                    <span style={lbl}>Celular</span>
                    <input type="tel" style={inp} value={form.celular} onChange={e => set('celular', e.target.value)} placeholder="Ej: 3515 123456" />
                  </div>
                  <div style={fld}>
                    <span style={lbl}>Barrio</span>
                    <input type="text" style={inp} value={form.barrio} onChange={e => set('barrio', e.target.value)} placeholder="Ej: Villa Cabrera" />
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--line)' }} />

            {/* Sección: Sobre la mascota */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 12 }}>
                Sobre tu mascota
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={fld}>
                    <span style={lbl}>Nombre de la mascota</span>
                    <input type="text" style={inp} value={form.nombre_mascota} onChange={e => set('nombre_mascota', e.target.value)} placeholder="Ej: Firulais" />
                  </div>
                  <div style={fld}>
                    <span style={lbl}>Edad de la mascota</span>
                    <input type="text" style={inp} value={form.edad_mascota} onChange={e => set('edad_mascota', e.target.value)} placeholder="Ej: 3 años" />
                  </div>
                </div>
                <div style={fld}>
                  <span style={lbl}>Juguete preferido</span>
                  <ChipSelector options={JUGUETES} value={form.juguete_preferido} onChange={v => set('juguete_preferido', v)} />
                </div>
              </div>
            </div>

            {error && <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{error}</p>}

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} className="luka-cta-ghost" style={{ fontSize: 13 }}>
                Completar después
              </button>
              <button type="submit" disabled={saving} className="luka-cta-dark" style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Guardando…' : 'Guardar perfil'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
export default function Header({ query, setQuery, totalItems, onCartOpen, onCalcOpen }) {
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen]         = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  // Redirect admin after login; check if cliente has complete profile
  useEffect(() => {
    if (loading || !session || role === null) return;

    if (role === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }

    setAuthOpen(false);

    // Only check once per session
    if (role === 'cliente' && !profileChecked) {
      setProfileChecked(true);
      supabase
        .from('profiles')
        .select('nombre_completo')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          if (!data?.nombre_completo) setProfileOpen(true);
        });
    }
  }, [loading, session, role, navigate, profileChecked]);

  const handleLogout = async () => {
    setProfileChecked(false);
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
                <button className="luka-pill" onClick={() => setAuthOpen(true)}>
                  <span>Ingresar</span>
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

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {profileOpen && session && (
        <ProfileCompletionModal
          userId={session.user.id}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </>
  );
}
