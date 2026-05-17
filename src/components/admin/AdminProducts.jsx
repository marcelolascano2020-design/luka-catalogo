import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { Icon } from '../Icons';

const EMPTY = {
  nombre: '', descripcion: '', marca: '', precio: '',
  unidad: '', categoria_id: '', activo: true, destacado: false,
};

const inputStyle = {
  padding: '9px 12px', border: '1px solid var(--line-2)', borderRadius: 10,
  background: 'var(--bg)', fontSize: 14, color: 'var(--ink)',
  width: '100%', boxSizing: 'border-box',
};
const ghostBtn = {
  padding: '5px 12px', borderRadius: 8, border: '1px solid var(--line-2)',
  background: 'transparent', color: 'var(--ink)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
};
const dangerBtn = { ...ghostBtn, color: '#c0392b', borderColor: '#f5c6c6' };

// ─── Product Form ─────────────────────────────────────────────────────────────
function ProductForm({ initial, categorias, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initial?.imagen_url || null);
  const imgRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (productId) => {
    if (!imageFile) return null;
    const ext = imageFile.name.split('.').pop().toLowerCase();
    const path = `${productId}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('productos')
      .upload(path, imageFile, { upsert: true });
    if (upErr) return null;
    const { data } = supabase.storage.from('productos').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      marca: form.marca,
      precio: parseFloat(form.precio) || 0,
      unidad: form.unidad,
      categoria_id: form.categoria_id ? parseInt(form.categoria_id) : null,
      activo: form.activo,
      destacado: form.destacado,
    };

    let id = form.id;
    let err;
    if (id) {
      ({ error: err } = await supabase.from('productos').update(payload).eq('id', id));
    } else {
      const { data, error: insErr } = await supabase.from('productos').insert(payload).select('id').single();
      err = insErr;
      id = data?.id;
    }

    if (err) { setError(err.message); setSaving(false); return; }

    if (imageFile && id) {
      const url = await uploadImage(id);
      if (url) await supabase.from('productos').update({ imagen_url: url }).eq('id', id);
    }

    onSave();
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
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

        {/* Image upload */}
        <div style={{ gridColumn: '1 / -1' }}>
          <span className="luka-field" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8 }}>Imagen del producto</span>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {imagePreview && (
              <img src={imagePreview} alt="preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--line-2)' }} />
            )}
            <div>
              <input ref={imgRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              <button type="button" onClick={() => imgRef.current.click()} style={ghostBtn}>
                <Icon.Image s={14} style={{ marginRight: 4 }} /> {imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
              </button>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                JPG, PNG, WebP. Requiere bucket "productos" en Supabase Storage.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center', gridColumn: '1 / -1' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} />
            Activo en catálogo
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.destacado} onChange={e => set('destacado', e.target.checked)} />
            Destacado
          </label>
        </div>
      </div>

      {error && <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={ghostBtn}>Cancelar</button>
        <button type="submit" disabled={saving} className="luka-cta-dark" style={{ opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Guardando…' : (form.id ? 'Guardar cambios' : 'Agregar producto')}
        </button>
      </div>
    </form>
  );
}

// ─── Excel Import ─────────────────────────────────────────────────────────────
function ExcelImport({ categorias, onDone }) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setResult(null);

    const catMap = {};
    categorias.forEach(c => { catMap[c.nombre.toLowerCase()] = c.id; });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(new Uint8Array(evt.target.result), { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

        let ok = 0, fail = 0;
        for (const row of rows) {
          const nombre = row.nombre || row.Nombre || row.NOMBRE;
          const precio = parseFloat(row.precio || row.Precio || row.PRECIO || 0);
          if (!nombre) { fail++; continue; }

          const catNombre = (row.categoria || row.Categoria || row.CATEGORIA || '').toLowerCase();
          const categoria_id = catMap[catNombre] || null;

          const { error } = await supabase.from('productos').insert({
            nombre,
            marca: row.marca || row.Marca || '',
            precio,
            unidad: row.unidad || row.Unidad || '',
            descripcion: row.descripcion || row.Descripcion || '',
            categoria_id,
            activo: true,
            destacado: false,
          });
          if (error) fail++; else ok++;
        }
        setResult({ ok, fail, total: rows.length });
        if (ok > 0) onDone();
      } catch (err) {
        setResult({ error: err.message });
      }
      setImporting(false);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div style={{ background: 'var(--cream-2)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Importar desde Excel</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
          Columnas: nombre, marca, precio, unidad, descripcion, categoria (nombre exacto)
        </div>
      </div>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display: 'none' }} />
      <button
        onClick={() => fileRef.current.click()}
        disabled={importing}
        style={{ ...ghostBtn, display: 'flex', alignItems: 'center', gap: 6, opacity: importing ? 0.7 : 1 }}
      >
        <Icon.FileXls s={14} /> {importing ? 'Importando…' : 'Seleccionar archivo'}
      </button>
      {result && (
        <div style={{ width: '100%', fontSize: 12, color: result.error ? '#c0392b' : result.fail > 0 ? '#856404' : '#155724' }}>
          {result.error
            ? `Error: ${result.error}`
            : `✓ ${result.ok} importados${result.fail > 0 ? ` · ${result.fail} fallaron` : ''} de ${result.total} filas`
          }
        </div>
      )}
    </div>
  );
}

// ─── Main Products Tab ────────────────────────────────────────────────────────
export default function AdminProducts() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('productos').select('*, categorias(nombre)').order('id'),
      supabase.from('categorias').select('*').order('orden'),
    ]);
    setProductos(prods || []);
    setCategorias(cats || []);
    setLoading(false);
  };

  const toggleActivo = async (p) => {
    await supabase.from('productos').update({ activo: !p.activo }).eq('id', p.id);
    setProductos(prev => prev.map(x => x.id === p.id ? { ...x, activo: !x.activo } : x));
  };

  const deleteProduct = async (id) => {
    await supabase.from('productos').delete().eq('id', id);
    setConfirmDelete(null);
    setProductos(prev => prev.filter(x => x.id !== id));
  };

  const filtered = productos.filter(p => {
    const q = search.toLowerCase();
    return !q || p.nombre?.toLowerCase().includes(q) || p.marca?.toLowerCase().includes(q);
  });

  if (editing !== null) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => setEditing(null)} style={ghostBtn}>← Volver</button>
          <h2 style={{ fontSize: 20, margin: 0 }}>
            {editing.id ? `Editando: ${editing.nombre}` : 'Nuevo producto'}
          </h2>
        </div>
        <div style={{ background: 'var(--paper)', borderRadius: 16, padding: 24, border: '1px solid var(--line-2)' }}>
          <ProductForm
            initial={editing.id ? editing : null}
            categorias={categorias}
            onSave={() => { setEditing(null); fetchAll(); }}
            onCancel={() => setEditing(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 22, margin: 0 }}>Productos ({productos.length})</h2>
        <button className="luka-cta-dark" onClick={() => setEditing({})}>
          <Icon.Plus s={14} /> Nuevo producto
        </button>
      </div>

      <ExcelImport categorias={categorias} onDone={fetchAll} />

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Icon.Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} s={16} />
          <input
            placeholder="Buscar por nombre o marca…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 34 }}
          />
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Cargando productos…</p>
      ) : (
        <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 600 }}>
            <thead>
              <tr style={{ background: 'var(--cream-2)', borderBottom: '1px solid var(--line-2)' }}>
                {['Imagen', 'Nombre', 'Marca', 'Precio', 'Unidad', 'Categoría', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--line)' : 'none', background: confirmDelete === p.id ? '#fff5f5' : 'transparent', opacity: p.activo ? 1 : 0.55 }}>
                  <td style={{ padding: '10px 14px' }}>
                    {p.imagen_url
                      ? <img src={p.imagen_url} alt={p.nombre} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                      : <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--cream-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}><Icon.Image s={16} /></div>
                    }
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{p.nombre}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--muted)' }}>{p.marca || '—'}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 13 }}>
                    {p.precio ? `$${Number(p.precio).toLocaleString('es-AR')}` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--muted)' }}>{p.unidad || '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--muted)' }}>{p.categorias?.nombre || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <button
                      onClick={() => toggleActivo(p)}
                      style={{
                        padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                        background: p.activo ? '#d4edda' : '#f8d7da',
                        color: p.activo ? '#155724' : '#721c24',
                      }}
                    >
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {confirmDelete === p.id ? (
                      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#c0392b' }}>¿Eliminar?</span>
                        <button onClick={() => deleteProduct(p.id)} style={{ padding: '4px 10px', borderRadius: 6, background: '#c0392b', color: 'white', border: 'none', fontSize: 12, cursor: 'pointer' }}>Sí</button>
                        <button onClick={() => setConfirmDelete(null)} style={ghostBtn}>No</button>
                      </span>
                    ) : (
                      <span style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setEditing(p)} style={ghostBtn}><Icon.Edit s={13} /></button>
                        <button onClick={() => setConfirmDelete(p.id)} style={dangerBtn}><Icon.Trash s={13} /></button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: '40px 14px', textAlign: 'center', color: 'var(--muted)' }}>
                  {search ? 'Sin resultados para esa búsqueda.' : 'No hay productos. Agregá uno o importá desde Excel.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
