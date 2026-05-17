import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Icon } from '../Icons';

const inp = {
  padding: '10px 13px', border: '1.5px solid #e0d8d0', borderRadius: 10,
  fontSize: 14, background: '#faf8f5', color: '#2b1f14',
  width: '100%', boxSizing: 'border-box',
};
const btnGhost = {
  padding: '7px 13px', borderRadius: 8, border: '1.5px solid #e0d8d0',
  background: 'transparent', color: '#2b1f14', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
};
const btnPrimary = {
  padding: '10px 20px', borderRadius: 10, border: 'none', background: '#2b1f14',
  color: '#FCEFA8', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 7,
};
const btnDanger = { ...btnGhost, color: '#c0392b', borderColor: '#f5c6c6' };

export default function AdminCategories() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nombre, setNombre] = useState('');
  const [emoji, setEmoji] = useState('');
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [prodCounts, setProdCounts] = useState({});

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    const [{ data: cs, error: e }, { data: prods }] = await Promise.all([
      supabase.from('categorias').select('*').order('orden'),
      supabase.from('productos').select('id, categoria_id'),
    ]);
    if (e) setError(e.message);
    setCats(cs || []);
    const counts = {};
    (prods || []).forEach(p => { if (p.categoria_id) counts[p.categoria_id] = (counts[p.categoria_id] || 0) + 1; });
    setProdCounts(counts);
    setLoading(false);
  };

  const add = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setAdding(true);
    const maxOrden = cats.length ? Math.max(...cats.map(c => c.orden || 0)) : 0;
    const { error: e2 } = await supabase.from('categorias').insert({ nombre: nombre.trim(), emoji: emoji.trim(), orden: maxOrden + 1, activa: true });
    if (e2) { setError(e2.message); setAdding(false); return; }
    setNombre(''); setEmoji('');
    fetchAll();
    setAdding(false);
  };

  const startEdit = (c) => { setEditId(c.id); setEditNombre(c.nombre); setEditEmoji(c.emoji || ''); };

  const saveEdit = async (id) => {
    const { error: e } = await supabase.from('categorias').update({ nombre: editNombre.trim(), emoji: editEmoji.trim() }).eq('id', id);
    if (e) { setError(e.message); return; }
    setEditId(null);
    fetchAll();
  };

  const del = async (id) => {
    const { error: e } = await supabase.from('categorias').delete().eq('id', id);
    if (e) { setError(e.message); } else { setConfirmId(null); fetchAll(); }
  };

  const swapOrder = async (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= cats.length) return;
    const a = cats[i], b = cats[j];
    const aOrd = a.orden ?? i, bOrd = b.orden ?? j;
    await Promise.all([
      supabase.from('categorias').update({ orden: bOrd }).eq('id', a.id),
      supabase.from('categorias').update({ orden: aOrd }).eq('id', b.id),
    ]);
    fetchAll();
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 800 }}>Categorías</h2>

      {error && (
        <div style={{ background: '#fdf0f0', border: '1px solid #f5c6c6', borderRadius: 12, padding: '12px 16px', color: '#c0392b', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Add form */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e0d8', padding: 20, marginBottom: 20 }}>
        <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 14 }}>Agregar nueva categoría</p>
        <form onSubmit={add} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nombre *</span>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required style={inp} placeholder="Ej: Perros adultos" />
          </div>
          <div style={{ width: 100, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Emoji</span>
            <input type="text" value={emoji} onChange={e => setEmoji(e.target.value)} style={inp} placeholder="🐶" />
          </div>
          <button type="submit" disabled={adding || !nombre.trim()} style={{ ...btnPrimary, opacity: adding ? 0.7 : 1 }}>
            <Icon.Plus s={14} /> Agregar
          </button>
        </form>
      </div>

      {/* List */}
      {loading ? (
        <p style={{ color: '#999', textAlign: 'center', padding: 32 }}>Cargando…</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e0d8', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f7f4f0', borderBottom: '1px solid #e8e0d8' }}>
                {['Orden', '', 'Nombre', 'Productos', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cats.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < cats.length - 1 ? '1px solid #f0ebe4' : 'none' }}>
                  {/* Order buttons */}
                  <td style={{ padding: '10px 14px', width: 60 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button onClick={() => swapOrder(i, -1)} disabled={i === 0} style={{ ...btnGhost, padding: '3px 7px', opacity: i === 0 ? 0.25 : 1 }}>
                        <Icon.ChevronUp s={12} />
                      </button>
                      <button onClick={() => swapOrder(i, 1)} disabled={i === cats.length - 1} style={{ ...btnGhost, padding: '3px 7px', opacity: i === cats.length - 1 ? 0.25 : 1 }}>
                        <Icon.ChevronDown s={12} />
                      </button>
                    </div>
                  </td>
                  {/* Emoji */}
                  <td style={{ padding: '10px 14px', fontSize: 24, width: 50 }}>
                    {editId === c.id
                      ? <input type="text" value={editEmoji} onChange={e => setEditEmoji(e.target.value)} style={{ ...inp, width: 60, fontSize: 20 }} placeholder="🐶" />
                      : c.emoji || '—'
                    }
                  </td>
                  {/* Name */}
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                    {editId === c.id ? (
                      <input type="text" value={editNombre} onChange={e => setEditNombre(e.target.value)} style={{ ...inp, maxWidth: 240 }} />
                    ) : c.nombre}
                  </td>
                  {/* Count */}
                  <td style={{ padding: '10px 14px', color: '#888' }}>{prodCounts[c.id] || 0}</td>
                  {/* Actions */}
                  <td style={{ padding: '10px 14px' }}>
                    {editId === c.id ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => saveEdit(c.id)} style={{ ...btnGhost, color: '#155724', borderColor: '#c3e6cb' }}>
                          <Icon.Check s={13} /> Guardar
                        </button>
                        <button onClick={() => setEditId(null)} style={btnGhost}><Icon.Close s={13} /></button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => startEdit(c)} style={btnGhost}><Icon.Edit s={14} /> Editar</button>
                        {confirmId === c.id ? (
                          <>
                            <span style={{ fontSize: 12, color: '#c0392b', alignSelf: 'center', marginLeft: 4 }}>¿Eliminar?</span>
                            <button onClick={() => del(c.id)} style={{ ...btnGhost, background: '#c0392b', color: '#fff', borderColor: '#c0392b' }}>Sí</button>
                            <button onClick={() => setConfirmId(null)} style={btnGhost}>No</button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmId(c.id)}
                            disabled={prodCounts[c.id] > 0}
                            title={prodCounts[c.id] > 0 ? 'Tiene productos asociados' : 'Eliminar'}
                            style={{ ...btnDanger, opacity: prodCounts[c.id] > 0 ? 0.35 : 1 }}
                          >
                            <Icon.Trash s={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {cats.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', color: '#aaa' }}>No hay categorías. Agregá la primera arriba.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
