import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Icon } from './Icons';
import AdminProducts from './admin/AdminProducts';
import AdminCategories from './admin/AdminCategories';
import AdminClients from './admin/AdminClients';
import AdminSettings from './admin/AdminSettings';

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--paper)', borderRadius: 20, padding: '40px 36px', width: 'min(400px, 92vw)', boxShadow: '0 20px 60px -20px rgba(43,31,20,0.2)' }}>
        <div style={{ marginBottom: 28 }}>
          <div className="luka-eyebrow">Panel de administración</div>
          <h2 style={{ marginTop: 8 }}>Ingresá a Luka</h2>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label className="luka-field">
            <span>Email</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
              style={{ padding: '10px 12px', border: '1px solid var(--line-2)', borderRadius: 10, background: 'var(--bg)', fontSize: 14, color: 'var(--ink)', width: '100%', boxSizing: 'border-box' }} />
          </label>
          <label className="luka-field">
            <span>Contraseña</span>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ padding: '10px 12px', border: '1px solid var(--line-2)', borderRadius: 10, background: 'var(--bg)', fontSize: 14, color: 'var(--ink)', width: '100%', boxSizing: 'border-box' }} />
          </label>
          {error && <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} className="luka-cta-dark"
            style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <a href="/" style={{ fontSize: 13, color: 'var(--muted)' }}>← Volver al catálogo</a>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const NAV = [
  { key: 'productos',    label: 'Productos',    Icon: Icon.Package  },
  { key: 'categorias',   label: 'Categorías',   Icon: Icon.Tag      },
  { key: 'clientes',     label: 'Clientes',     Icon: Icon.Users    },
  { key: 'configuracion',label: 'Configuración',Icon: Icon.Settings },
];

function Sidebar({ tab, setTab, open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 49 }}
        />
      )}

      <nav style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 220, background: 'var(--ink)', color: '#FCEFA8',
        display: 'flex', flexDirection: 'column',
        zIndex: 50, transition: 'transform 0.22s ease',
        transform: open ? 'translateX(0)' : undefined,
        // On desktop always visible; on mobile slide in/out
      }} className="admin-sidebar">
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(252,239,168,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/assets/logo.jpg" alt="Luka" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'contain' }} />
            <div>
              <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 16 }}>Luka Admin</div>
              <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Panel de gestión</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(({ key, label, Icon: NavIcon }) => (
            <button
              key={key}
              onClick={() => { setTab(key); onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: tab === key ? 'rgba(252,239,168,0.12)' : 'transparent',
                color: tab === key ? '#FCEFA8' : 'rgba(252,239,168,0.55)',
                fontSize: 14, fontWeight: tab === key ? 700 : 500, textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <NavIcon s={17} />
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(252,239,168,0.1)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, color: 'rgba(252,239,168,0.55)', fontSize: 13, textDecoration: 'none' }}>
            <Icon.Arrow s={14} style={{ transform: 'rotate(180deg)' }} /> Ver catálogo
          </a>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: 'rgba(252,239,168,0.55)', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}
          >
            <Icon.Close s={14} /> Cerrar sesión
          </button>
        </div>
      </nav>
    </>
  );
}

// ─── Main AdminPanel ──────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('productos');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Only redirect after auth resolves AND role is known (not null)
    if (!loading && session && role !== null && role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [loading, session, role, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>Cargando…</div>
      </div>
    );
  }

  if (!session) return <LoginForm />;
  if (role === null || role !== 'admin') return null;

  const TAB_COMPONENTS = {
    productos:     <AdminProducts />,
    categorias:    <AdminCategories />,
    clientes:      <AdminClients />,
    configuracion: <AdminSettings />,
  };

  return (
    <>
      <style>{`
        @media (min-width: 769px) {
          .admin-sidebar { transform: none !important; }
          .admin-content { margin-left: 220px; }
        }
        @media (max-width: 768px) {
          .admin-sidebar { transform: translateX(-100%); }
          .admin-sidebar.open { transform: translateX(0); }
          .admin-content { margin-left: 0; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar tab={tab} setTab={setTab} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="admin-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* Top bar (mobile only / page header) */}
          <header style={{
            position: 'sticky', top: 0, zIndex: 40,
            background: 'var(--paper)', borderBottom: '1px solid var(--line)',
            padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <button
              className="admin-hamburger"
              onClick={() => setSidebarOpen(o => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', padding: 4, display: 'none' }}
            >
              <Icon.Menu s={22} />
            </button>
            <style>{`.admin-hamburger { display: none; } @media (max-width: 768px) { .admin-hamburger { display: block !important; } }`}</style>

            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{NAV.find(n => n.key === tab)?.label}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Panel de administración · Luka</div>
            </div>
          </header>

          {/* Content */}
          <main style={{ flex: 1, padding: '28px 24px', maxWidth: 1100, width: '100%', boxSizing: 'border-box' }}>
            {TAB_COMPONENTS[tab]}
          </main>
        </div>
      </div>
    </>
  );
}
