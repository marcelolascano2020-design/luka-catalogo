import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Icon } from './Icons';
import AdminProducts    from './admin/AdminProducts';
import AdminCategories  from './admin/AdminCategories';
import AdminClients     from './admin/AdminClients';
import AdminSettings    from './admin/AdminSettings';

// ─── Login ─────────────────────────────────────────────────────────────────────
function LoginForm() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    setBusy(false);
  };

  const inp = {
    padding: '11px 14px', border: '1.5px solid #e0d8d0', borderRadius: 10,
    fontSize: 15, background: '#faf8f5', color: '#2b1f14',
    width: '100%', boxSizing: 'border-box', outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8f5' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '40px 36px', width: 'min(400px, 92vw)', boxShadow: '0 20px 60px rgba(43,31,20,0.15)' }}>
        <div style={{ marginBottom: 28 }}>
          <img src="/assets/logo.jpg" alt="Luka" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'contain', marginBottom: 16 }} />
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: 4 }}>Panel de administración</div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Ingresá a Luka</h2>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus style={inp} placeholder="admin@email.com" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inp} />
          </div>

          {error && (
            <div style={{ background: '#fdf0f0', border: '1px solid #f5c6c6', borderRadius: 10, padding: '10px 14px', color: '#c0392b', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={busy} style={{
            padding: '13px', borderRadius: 10, border: 'none',
            background: busy ? '#888' : '#2b1f14', color: '#FCEFA8',
            fontSize: 15, fontWeight: 800, cursor: busy ? 'default' : 'pointer', marginTop: 4,
          }}>
            {busy ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/" style={{ fontSize: 13, color: '#aaa', textDecoration: 'none' }}>← Ver catálogo</a>
        </div>
      </div>
    </div>
  );
}

// ─── Nav items ──────────────────────────────────────────────────────────────────
const NAV = [
  { key: 'productos',     label: 'Productos',     Ico: Icon.Package  },
  { key: 'categorias',    label: 'Categorías',    Ico: Icon.Tag      },
  { key: 'clientes',      label: 'Clientes',      Ico: Icon.Users    },
  { key: 'configuracion', label: 'Configuración', Ico: Icon.Settings },
];

// ─── Sidebar ────────────────────────────────────────────────────────────────────
function Sidebar({ tab, setTab, mobile, onClose }) {
  return (
    <>
      {mobile && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 49 }} />
      )}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 230,
        background: '#2b1f14', color: '#FCEFA8',
        display: 'flex', flexDirection: 'column', zIndex: 50,
        transform: mobile ? 'translateX(0)' : undefined,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(252,239,168,0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/assets/logo.jpg" alt="Luka" style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'contain', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>Luka Admin</div>
            <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Panel de gestión</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ key, label, Ico }) => (
            <button
              key={key}
              onClick={() => { setTab(key); if (mobile) onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '10px 13px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: tab === key ? 'rgba(252,239,168,0.14)' : 'transparent',
                color: tab === key ? '#FCEFA8' : 'rgba(252,239,168,0.5)',
                fontSize: 14, fontWeight: tab === key ? 700 : 500, textAlign: 'left',
              }}
            >
              <Ico s={17} />
              {label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '10px 10px 16px', borderTop: '1px solid rgba(252,239,168,0.1)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <a
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 13px', borderRadius: 10, color: 'rgba(252,239,168,0.45)', fontSize: 13, textDecoration: 'none' }}
          >
            <Icon.Arrow s={14} style={{ transform: 'scaleX(-1)' }} /> Ver catálogo
          </a>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 13px', borderRadius: 10, border: 'none', background: 'transparent', color: 'rgba(252,239,168,0.45)', fontSize: 13, cursor: 'pointer' }}
          >
            <Icon.Close s={14} /> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
const SIDEBAR_W = 230;

export default function AdminPanel() {
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]             = useState('productos');
  const [mobileSidebar, setMobile] = useState(false);
  const [isMobile, setIsMobile]   = useState(window.innerWidth < 769);

  // Track viewport width to toggle sidebar behaviour
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 769);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Auth guard: wait until role is resolved, then redirect non-admins
  useEffect(() => {
    if (!loading && session && role !== null && role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [loading, session, role, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8f5' }}>
        <span style={{ color: '#aaa', fontSize: 14 }}>Cargando…</span>
      </div>
    );
  }
  if (!session) return <LoginForm />;
  if (role === null || role !== 'admin') return null;

  const CONTENT = {
    productos:     <AdminProducts />,
    categorias:    <AdminCategories />,
    clientes:      <AdminClients />,
    configuracion: <AdminSettings />,
  };

  const showSidebar = !isMobile || mobileSidebar;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0ea', fontFamily: 'inherit' }}>
      {showSidebar && (
        <Sidebar
          tab={tab}
          setTab={setTab}
          mobile={isMobile}
          onClose={() => setMobile(false)}
        />
      )}

      {/* Main column */}
      <div style={{ marginLeft: isMobile ? 0 : SIDEBAR_W, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: '#fff', borderBottom: '1px solid #e8e0d8',
          padding: '0 24px', height: 58,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          {isMobile && (
            <button
              onClick={() => setMobile(o => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2b1f14', padding: 4, flexShrink: 0 }}
            >
              <Icon.Menu s={22} />
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1 }}>{NAV.find(n => n.key === tab)?.label}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>Luka · Panel de administración</div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px 24px', maxWidth: 1080, width: '100%', boxSizing: 'border-box' }}>
          {CONTENT[tab]}
        </main>
      </div>
    </div>
  );
}
