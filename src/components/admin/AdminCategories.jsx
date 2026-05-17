import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Icon } from '../Icons';

const inputStyle = {
  padding: '9px 12px', border: '1px solid var(--line-2)', borderRadius: 10,
  background: 'var(--bg)', fontSize: 14, color: 'var(--ink)',
  width: '100%', boxSizing: 'border-box',
};
const ghostBtn = {
  padding: '5px 10px', borderRadius: 8, border: '1px solid var(--line-2)',
  background: 'transparent', color: 'var(--ink)', fontSize: 12, fontWeight: 600,
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
};

export default function AdminCategories() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const [emoji, setEmoji] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [prodCounts, setProdCounts] = useState({});

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categorias').select('*').order('orden'),
      supabase.from('productos').select('id, categoria_id'),
    ]);
    setCategorias(cats || []);
    const counts = {};
    (prods || []).forEach(p => { counts[p.categoria_id] = (counts[p.categoria_id] || 0) + 1; });
    setProdCounts(counts);
    setLoading(false);
  };

  const addCategoria = async (e) => {
    e.preventDefault();
    setSaving(true);
    const maxOrden = Math.max(0, ...categorias.map(c => c.orden || 0));
    await supabase.from('categorias').insert({ nombre, emoji, orden: maxOrden + 1, activa: true });
    setNombre(''); setEmoji('');
    fetchAll();
    setSaving(false);
  };

  const startEdit = (c) => {
    setEditing(c.id);
    setEditNombre(c.nombre);
    setEditEmoji(c.emoji || '');
  };

  const saveEdit = async (id) => {
    await supabase.from('categorias').update({ nombre: editNombre, emoji: editEmoji }).eq('id', id);
    setEditing(null);
    fetchAll();
  };

  const deleteCategoria = async (id) => {
    await supabase.from('categorias').delete().eq('id', id);
    setConfirmDelete(null);
    fetchAll();
  };

  const moveUp = async (i) => {
    if (i === 0) return;
    const a = categorias[i], b = categorias[i - 1];
    await Promise.all([
      supabase.from('categorias').update({ orden: b.orden }).eq('id', a.id),
      supabase.from('categorias').update({ orden: a.orden }).eq('id', b.id),
    ]);
    fetchAll();
  };

  const moveDown = async (i) => {
    if (i === categorias.length - 1) return;
    const a = categorias[i], b = categorias[i + 1];
    await Promise.all([
      supabase.from('categorias').update({ orden: b.orden }).eq('id', a.id),
      supabase.from('categorias').update({ orden: a.orden }).eq('id', b.id),
    ]);
    fetchAll();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ fontSize: 22, margin: 0 }}>Categorías</h2>

      {/* Add form */}
      <div style={{ background: 'var(--paper)', borderRadius: 16, padding: 20, border: '1px solid var(--line-2)' }}>
        <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 14px' }}>Nueva categoría</p>
        <form onSubmit={addCategoria} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label className="luka-field" style={{ flex: 1, minWidth: 140 }}>
            <span>Nombre *</span>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required style={inputStyle} placeholder="Ej: Perros adultos" />
          </label>
          <label className="luka-field" style={{ width: 90 }}>
            <span>Emoji</span>
            <input type="text" value={emoji} onChange={e => setEmoji(e.target.value)} style={inputStyle} placeholder="🐶" />
          </label>
          <button type="submit" disabled={saving} className="luka-cta-dark" style={{ opacity: saving ? 0.7 : 1, flexShrink: 0 }}>
            <Icon.Plus s={14} /> {saving ? '…' : 'Agregar'}
          </button>
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Cargando categorías…</p>
      ) : (
        <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--cream-2)', borderBottom: '1px solid var(--line-2)' }}>
                {['Orden', 'Emoji', 'Nombre', 'Productos', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categorias.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < categorias.length - 1 ? '1px solid var(--line)' : 'none' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button onClick={() => moveUp(i)} disabled={i === 0} style={{ ...ghostBtn, padding: '2px 6px', opacity: i === 0 ? 0.3 : 1 }}>
                        <Icon.ChevronUp s={12} />
                      </button>
                      <button onClick={() => moveDown(i)} disabled={i === categorias.length - 1} style={{ ...ghostBtn, padding: '2px 6px', opacity: i === categorias.length - 1 ? 0.3 : 1 }}>
                        <Icon.ChevronDown s={12} />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 22 }}>{c.emoji || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {editing === c.id ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input value={editEmoji} onChange={e => setEditEmoji(e.target.value)} style={{ ...inputStyle, width: 60 }} placeholder="🐶" />
                        <input value={editNombre} onChange={e => setEditNombre(e.target.value)} style={inputStyle} />
                        <button onClick={() => saveEdit(c.id)} style={{ ...ghostBtn, color: '#155724', borderColor: '#d4edda' }}><Icon.Check s={13} /></button>
                        <button onClick={() => setEditing(null)} style={ghostBtn}><Icon.Close s={13} /></button>
                      </div>
                    ) : (
                      <span style={{ fontWeight: 600 }}>{c.nombre}</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--muted)' }}>{prodCounts[c.id] || 0}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {editing !== c.id && (
                        <button onClick={() => startEdit(c)} style={ghostBtn}><Icon.Edit s={13} /></button>
                      )}
                      {confirmDelete === c.id ? (
                        <>
                          <span style={{ fontSize: 12, color: '#c0392b', alignSelf: 'center' }}>¿Eliminar?</span>
                          <button onClick={() => deleteCategoria(c.id)} style={{ padding: '4px 10px', borderRadius: 6, background: '#c0392b', color: 'white', border: 'none', fontSize: 12, cursor: 'pointer' }}>Sí</button>
                          <button onClick={() => setConfirmDelete(null)} style={ghostBtn}>No</button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(c.id)}
                          disabled={prodCounts[c.id] > 0}
                          title={prodCounts[c.id] > 0 ? 'Tiene productos asociados' : 'Eliminar'}
                          style={{ ...ghostBtn, color: '#c0392b', borderColor: '#f5c6c6', opacity: prodCounts[c.id] > 0 ? 0.4 : 1 }}
                        >
                          <Icon.Trash s={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {categorias.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '40px 14px', textAlign: 'center', color: 'var(--muted)' }}>No hay categorías todavía.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
