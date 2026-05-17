import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Icon } from './Icons';

// ─── Login ───────────────────────────────────────────────────────────────────
function LoginForm() {
  const [email, setEmail] = useState('marcelolascano2020@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
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
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ padding: '10px 12px', border: '1px solid var(--line-2)', borderRadius: 10, background: 'var(--bg)', fontSize: 14 }}
            />
          </label>
          <label className="luka-field">
            <span>Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ padding: '10px 12px', border: '1px solid var(--line-2)', borderRadius: 10, background: 'var(--bg)', fontSize: 14 }}
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
  );
}

// ─── Product Form ─────────────────────────────────────────────────────────────
const EMPTY_PRODUCT = { nombre: '', descripcion: '', marca: '', precio: '', unidad: '', categoria_id: '', activo: true, destacado: false };

function ProductForm({ initial, categorias, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      marca: form.marca,
      precio: parseFloat(form.precio),
      unidad: form.unidad,
      categoria_id: form.categoria_id ? parseInt(form.categoria_id) : null,
      activo: form.activo,
      destacado: form.destacado,
    };
    let err;
    if (form.id) {
      ({ error: err } = await supabase.from('productos').update(payload).eq('id', form.id));
    } else {
      ({ error: err } = await supabase.from('productos').insert(payload));
    }
    if (err) setError(err.message);
    else onSave();
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <label className="luka-field" style={{ gridColumn: '1 / -1' }}>
          <span>Nombre *</span>
          <input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)} required style={inputStyle} />
        </label>
        <label className="luka-field">
          <span>Marca</span>
          <input type="text" value={form.marca} onChange={e => set('marca', e.target.value)} style={inputStyle} />
        </label>
        <label className="luka-field">
          <span>Unidad (ej: 15 kg)</span>
          <input type="text" value={form.unidad} onChange={e => set('unidad', e.target.value)} style={inputStyle} />
        </label>
        <label className="luka-field">
          <span>Precio (ARS) *</span>
          <input type="number" step="0.01" min="0" value={form.precio} onChange={e => set('precio', e.target.value)} required style={inputStyle} />
        </label>
        <label className="luka-field">
          <span>Categoría</span>
          <select value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)} style={inputStyle}>
            <option value="">— Sin categoría —</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </label>
        <label className="luka-field" style={{ gridColumn: '1 / -1' }}>
          <span>Descripción</span>
          <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </label>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} />
            Activo
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.destacado} onChange={e => set('destacado', e.target.checked)} />
            Destacado
          </label>
        </div>
      </div>
      {error && <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={ghostBtnStyle}>Cancelar</button>
        <button type="submit" disabled={saving} className="luka-cta-dark" style={{ opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Guardando…' : (form.id ? 'Guardar cambios' : 'Agregar producto')}
        </button>
      </div>
    </form>
  );
}

// ─── Category Form ────────────────────────────────────────────────────────────
function CategoryForm({ onSave }) {
  const [nombre, setNombre] = useState('');
  const [emoji, setEmoji] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('categorias').insert({ nombre, emoji });
    setNombre(''); setEmoji('');
    onSave();
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <label className="luka-field" style={{ flex: 1, minWidth: 140 }}>
        <span>Nombre</span>
        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required style={inputStyle} placeholder="Ej: Perros adultos" />
      </label>
      <label className="luka-field" style={{ width: 80 }}>
        <span>Emoji</span>
        <input type="text" value={emoji} onChange={e => setEmoji(e.target.value)} style={inputStyle} placeholder="🐶" />
      </label>
      <button type="submit" disabled={saving} className="luka-cta-dark" style={{ opacity: saving ? 0.7 : 1, flexShrink: 0 }}>
        {saving ? '…' : '+ Agregar'}
      </button>
    </form>
  );
}

// ─── Main AdminPanel ──────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { session, role, loading: loadingAuth } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('productos');

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null); // null = no form, {} = new, obj = edit
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (!loadingAuth && session && role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [loadingAuth, session, role, navigate]);

  useEffect(() => {
    if (session && role === 'admin') fetchAll();
  }, [session, role]);

  const fetchAll = async () => {
    setLoadingData(true);
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('productos').select('*, categorias(nombre)').order('id'),
      supabase.from('categorias').select('*').order('orden'),
    ]);
    setProductos(prods || []);
    setCategorias(cats || []);
    setLoadingData(false);
  };

  const deleteProduct = async (id) => {
    await supabase.from('productos').delete().eq('id', id);
    setConfirmDelete(null);
    fetchAll();
  };

  const deleteCategory = async (id) => {
    await supabase.from('categorias').delete().eq('id', id);
    fetchAll();
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  if (loadingAuth) return <div style={{ padding: 40, textAlign: 'center' }}>Cargando…</div>;
  if (!session) return <LoginForm />;
  if (role !== 'admin') return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'inherit' }}>
      {/* Header admin */}
      <header style={{ background: 'var(--ink)', color: '#FCEFA8', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/assets/logo.jpg" alt="Luka" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'contain' }} />
          <div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 18 }}>Luka Admin</div>
            <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Panel de gestión</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="/" style={{ color: '#FCEFA8', fontSize: 13, opacity: 0.8 }}>← Ver catálogo</a>
          <button onClick={logout} style={{ padding: '7px 14px', borderRadius: 999, border: '1px solid rgba(252,239,168,0.3)', background: 'transparent', color: '#FCEFA8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Salir
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {[['productos', 'Productos'], ['categorias', 'Categorías']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '9px 20px', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: tab === k ? 'var(--ink)' : 'var(--paper)',
              color: tab === k ? '#FCEFA8' : 'var(--ink)',
              border: tab === k ? '1px solid var(--ink)' : '1px solid var(--line-2)',
            }}>
              {l}
            </button>
          ))}
        </div>

        {/* ── PRODUCTOS TAB ── */}
        {tab === 'productos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 22 }}>Productos ({productos.length})</h2>
              {!editingProduct && (
                <button className="luka-cta-dark" onClick={() => setEditingProduct({})}>
                  <Icon.Plus s={14} /> Nuevo producto
                </button>
              )}
            </div>

            {editingProduct !== null && (
              <div style={{ background: 'var(--paper)', borderRadius: 16, padding: 24, marginBottom: 24, border: '1px solid var(--line-2)' }}>
                <h3 style={{ marginBottom: 18, fontSize: 17 }}>
                  {editingProduct.id ? `Editando: ${editingProduct.nombre}` : 'Nuevo producto'}
                </h3>
                <ProductForm
                  initial={editingProduct.id ? editingProduct : null}
                  categorias={categorias}
                  onSave={() => { setEditingProduct(null); fetchAll(); }}
                  onCancel={() => setEditingProduct(null)}
                />
              </div>
            )}

            {loadingData ? (
              <p style={{ color: 'var(--muted)' }}>Cargando productos…</p>
            ) : (
              <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: 'var(--cream-2)', borderBottom: '1px solid var(--line-2)' }}>
                      {['Nombre', 'Marca', 'Unidad', 'Precio', 'Categoría', 'Estado', ''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: i < productos.length - 1 ? '1px solid var(--line)' : 'none', background: confirmDelete === p.id ? '#fff5f5' : 'transparent' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{p.nombre}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>{p.marca}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>{p.unidad}</td>
                        <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
                          {p.precio ? `$${Number(p.precio).toLocaleString('es-AR')}` : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>{p.categorias?.nombre || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                            background: p.activo ? '#d4edda' : '#f8d7da',
                            color: p.activo ? '#155724' : '#721c24',
                          }}>
                            {p.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {confirmDelete === p.id ? (
                            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span style={{ fontSize: 12, color: '#c0392b' }}>¿Eliminar?</span>
                              <button onClick={() => deleteProduct(p.id)} style={{ padding: '4px 10px', borderRadius: 6, background: '#c0392b', color: 'white', border: 'none', fontSize: 12, cursor: 'pointer' }}>Sí</button>
                              <button onClick={() => setConfirmDelete(null)} style={ghostBtnStyle}>No</button>
                            </span>
                          ) : (
                            <span style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => setEditingProduct(p)} style={ghostBtnStyle}>Editar</button>
                              <button onClick={() => setConfirmDelete(p.id)} style={{ ...ghostBtnStyle, color: '#c0392b', borderColor: '#f5c6c6' }}>Eliminar</button>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {productos.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: '40px 14px', textAlign: 'center', color: 'var(--muted)' }}>No hay productos todavía. Agregá uno.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── CATEGORIAS TAB ── */}
        {tab === 'categorias' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, marginBottom: 16 }}>Categorías</h2>
              <div style={{ background: 'var(--paper)', borderRadius: 16, padding: 20, border: '1px solid var(--line)', marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, marginTop: 0 }}>Nueva categoría</p>
                <CategoryForm onSave={fetchAll} />
              </div>
            </div>

            {loadingData ? (
              <p style={{ color: 'var(--muted)' }}>Cargando…</p>
            ) : (
              <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: 'var(--cream-2)', borderBottom: '1px solid var(--line-2)' }}>
                      {['Emoji', 'Nombre', 'Productos', ''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.map((c, i) => {
                      const count = productos.filter(p => p.categoria_id === c.id).length;
                      return (
                        <tr key={c.id} style={{ borderBottom: i < categorias.length - 1 ? '1px solid var(--line)' : 'none' }}>
                          <td style={{ padding: '12px 14px', fontSize: 22 }}>{c.emoji || '—'}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 600 }}>{c.nombre}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>{count}</td>
                          <td style={{ padding: '12px 14px' }}>
                            {count === 0 && (
                              <button onClick={() => deleteCategory(c.id)} style={{ ...ghostBtnStyle, color: '#c0392b', borderColor: '#f5c6c6' }}>
                                Eliminar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {categorias.length === 0 && (
                      <tr><td colSpan={4} style={{ padding: '40px 14px', textAlign: 'center', color: 'var(--muted)' }}>No hay categorías todavía.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────
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

const ghostBtnStyle = {
  padding: '5px 12px',
  borderRadius: 8,
  border: '1px solid var(--line-2)',
  background: 'transparent',
  color: 'var(--ink)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};
