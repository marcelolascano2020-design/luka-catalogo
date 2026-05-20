import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { Icon } from '../Icons';

// ─── Shared styles ─────────────────────────────────────────────────────────────
const field = { display: 'flex', flexDirection: 'column', gap: 6 };
const label = { fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' };
const input = {
  padding: '10px 13px', border: '1.5px solid #e0d8d0', borderRadius: 10,
  fontSize: 14, background: '#faf8f5', color: '#2b1f14', width: '100%',
  boxSizing: 'border-box', outline: 'none',
};
const btnPrimary = {
  padding: '11px 22px', borderRadius: 10, border: 'none', background: '#2b1f14',
  color: '#FCEFA8', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 8,
};
const btnGhost = {
  padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e0d8d0',
  background: 'transparent', color: '#2b1f14', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
};
const btnDanger = { ...btnGhost, color: '#c0392b', borderColor: '#f5c6c6' };

// ─── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(43,31,20,0.55)', zIndex: 200 }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 201, background: '#fff',
        borderRadius: 20, width: wide ? 'min(720px,96vw)' : 'min(520px,96vw)',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(43,31,20,0.25)',
      }}>
        {/* Header */}
        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid #f0ebe4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 4 }}>
            <Icon.Close s={20} />
          </button>
        </div>
        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '20px 26px 26px', flex: 1 }}>
          {children}
        </div>
      </div>
    </>
  );
}

// ─── Product Form ──────────────────────────────────────────────────────────────
const EMPTY = { nombre: '', descripcion: '', marca: '', precio: '', unidad: '', categoria_id: '', mascota: 'Varios', activo: true, destacado: false };
// Valores deben coincidir con el filtro de CategoryFilter y con los datos estáticos
const MASCOTAS = [
  { value: 'Perros', label: 'Perros' },
  { value: 'Gatos',  label: 'Gatos'  },
  { value: 'Aves',   label: 'Aves'   },
  { value: 'Varios', label: 'Varios' },
];

function ProductForm({ initial, categorias, onSave, onClose }) {
  const [form, setForm] = useState(() => initial ? { ...EMPTY, ...initial, precio: initial.precio ?? '' } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState(initial?.imagen_url || null);
  const imgRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImg = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const uploadImg = async (id) => {
    if (!imgFile) return null;
    const ext = imgFile.name.split('.').pop().toLowerCase();
    const path = `${id}.${ext}`;
    const { error: upErr } = await supabase.storage.from('productos').upload(path, imgFile, { upsert: true });
    if (upErr) {
      console.warn('Storage error (bucket "productos" might not exist):', upErr.message);
      return null;
    }
    return supabase.storage.from('productos').getPublicUrl(path).data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      nombre:       form.nombre.trim(),
      descripcion:  form.descripcion.trim(),
      marca:        form.marca.trim(),
      precio:       parseFloat(form.precio) || 0,
      unidad:       form.unidad.trim(),
      categoria_id: form.categoria_id ? parseInt(form.categoria_id) : null,
      mascota:      form.mascota || 'Varios',
      activo:       !!form.activo,
      destacado:    !!form.destacado,
    };

    let productId = form.id;
    let dbError;

    if (productId) {
      const { error: e } = await supabase.from('productos').update(payload).eq('id', productId);
      dbError = e;
    } else {
      const { data, error: e } = await supabase.from('productos').insert(payload).select('id').single();
      dbError = e;
      productId = data?.id;
    }

    if (dbError) {
      const isRLS = dbError.message?.toLowerCase().includes('row-level security')
        || dbError.message?.toLowerCase().includes('permission')
        || dbError.message?.toLowerCase().includes('policy')
        || dbError.code === '42501';
      setError(isRLS
        ? '⛔ Sin permiso de escritura (RLS). Ejecutá el SQL del diagnóstico que aparece arriba del panel.'
        : `Error al guardar: ${dbError.message}`
      );
      setSaving(false);
      return;
    }

    if (imgFile && productId) {
      const url = await uploadImg(productId);
      if (url) {
        await supabase.from('productos').update({ imagen_url: url }).eq('id', productId);
      }
    }

    onSave();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Nombre */}
      <div style={field}>
        <span style={label}>Nombre *</span>
        <input style={input} type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)} required placeholder="Ej: Royal Canin Maxi Adult" />
      </div>

      {/* Marca + Unidad */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={field}>
          <span style={label}>Marca</span>
          <input style={input} type="text" value={form.marca} onChange={e => set('marca', e.target.value)} placeholder="Ej: Royal Canin" />
        </div>
        <div style={field}>
          <span style={label}>Unidad / Presentación</span>
          <input style={input} type="text" value={form.unidad} onChange={e => set('unidad', e.target.value)} placeholder="Ej: 15 kg" />
        </div>
      </div>

      {/* Precio + Categoría + Mascota */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        <div style={field}>
          <span style={label}>Precio (ARS) *</span>
          <input style={input} type="number" step="1" min="0" value={form.precio} onChange={e => set('precio', e.target.value)} required placeholder="0" />
        </div>
        <div style={field}>
          <span style={label}>Categoría</span>
          <select style={input} value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)}>
            <option value="">— Sin categoría —</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.emoji ? `${c.emoji} ${c.nombre}` : c.nombre}</option>)}
          </select>
        </div>
        <div style={field}>
          <span style={label}>Mascota</span>
          <select style={input} value={form.mascota} onChange={e => set('mascota', e.target.value)}>
            {MASCOTAS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {/* Descripción */}
      <div style={field}>
        <span style={label}>Descripción</span>
        <textarea style={{ ...input, resize: 'vertical', minHeight: 80 }} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción opcional del producto…" />
      </div>

      {/* Imagen */}
      <div style={field}>
        <span style={label}>Imagen del producto</span>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          {imgPreview
            ? <img src={imgPreview} alt="preview" style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', border: '2px solid #e0d8d0' }} />
            : <div style={{ width: 72, height: 72, borderRadius: 10, background: '#f0ebe4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb' }}><Icon.Image s={26} /></div>
          }
          <div>
            <input ref={imgRef} type="file" accept="image/*" onChange={handleImg} style={{ display: 'none' }} />
            <button type="button" onClick={() => imgRef.current.click()} style={btnGhost}>
              <Icon.Upload s={14} /> {imgPreview ? 'Cambiar foto' : 'Subir foto'}
            </button>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#999' }}>Requiere bucket público "productos" en Supabase Storage.</p>
          </div>
        </div>
      </div>

      {/* Checkboxes */}
      <div style={{ display: 'flex', gap: 24 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
          Activo en catálogo
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          <input type="checkbox" checked={form.destacado} onChange={e => set('destacado', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
          Destacado
        </label>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fdf0f0', border: '1px solid #f5c6c6', borderRadius: 10, padding: '12px 16px', color: '#c0392b', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f0ebe4' }}>
        <button type="button" onClick={onClose} style={btnGhost} disabled={saving}>Cancelar</button>
        <button type="submit" style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }} disabled={saving}>
          {saving ? 'Guardando…' : (form.id ? '✓ Guardar cambios' : '+ Agregar producto')}
        </button>
      </div>
    </form>
  );
}

// ─── Excel Import Modal ────────────────────────────────────────────────────────
function ExcelImportModal({ categorias, onDone, onClose }) {
  const [rows, setRows] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(new Uint8Array(evt.target.result), { type: 'array' });
      const parsed = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      setRows(parsed);
      setResult(null);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const doImport = async () => {
    if (!rows?.length) return;
    setImporting(true);
    const catMap = {};
    categorias.forEach(c => { catMap[c.nombre.toLowerCase().trim()] = c.id; });

    let ok = 0, fail = 0;
    for (const row of rows) {
      const nombre = (row.nombre || row.Nombre || row.NOMBRE || '').toString().trim();
      if (!nombre) { fail++; continue; }
      const precio = parseFloat(row.precio || row.Precio || row.PRECIO || 0);
      const catKey = (row.categoria || row.Categoria || row.CATEGORIA || '').toString().toLowerCase().trim();
      const { error } = await supabase.from('productos').insert({
        nombre,
        marca:        (row.marca || row.Marca || '').toString().trim(),
        precio,
        unidad:       (row.unidad || row.Unidad || '').toString().trim(),
        descripcion:  (row.descripcion || row.Descripcion || '').toString().trim(),
        categoria_id: catMap[catKey] || null,
        activo:       true,
        destacado:    false,
      });
      if (error) { console.error(error); fail++; } else ok++;
    }
    setResult({ ok, fail });
    if (ok > 0) onDone();
    setImporting(false);
  };

  return (
    <Modal title="Importar desde Excel" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ background: '#f7f4f0', borderRadius: 12, padding: '14px 18px', fontSize: 13 }}>
          <strong>Formato del archivo:</strong> columnas <code>nombre</code>, <code>marca</code>, <code>precio</code>, <code>unidad</code>, <code>descripcion</code>, <code>categoria</code> (nombre exacto de la categoría).
        </div>

        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display: 'none' }} />
        <button onClick={() => fileRef.current.click()} style={btnGhost}>
          <Icon.FileXls s={15} /> Elegir archivo .xlsx
        </button>

        {rows && (
          <div style={{ background: '#f0faf0', border: '1px solid #c3e6cb', borderRadius: 10, padding: '12px 16px', fontSize: 13 }}>
            <strong>{rows.length} filas detectadas.</strong> Columnas: {Object.keys(rows[0] || {}).join(', ')}
          </div>
        )}

        {result && (
          <div style={{ background: result.fail > 0 ? '#fff8e1' : '#f0faf0', border: `1px solid ${result.fail > 0 ? '#ffc107' : '#c3e6cb'}`, borderRadius: 10, padding: '12px 16px', fontSize: 13 }}>
            ✓ <strong>{result.ok} productos importados</strong>{result.fail > 0 && ` · ${result.fail} fallaron (revisá consola)`}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnGhost}>Cerrar</button>
          {rows && !result && (
            <button onClick={doImport} disabled={importing} style={{ ...btnPrimary, opacity: importing ? 0.7 : 1 }}>
              {importing ? 'Importando…' : `Importar ${rows.length} productos`}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ nombre, onConfirm, onCancel }) {
  return (
    <Modal title="Confirmar eliminación" onClose={onCancel}>
      <p style={{ fontSize: 15, margin: '0 0 24px' }}>
        ¿Eliminar <strong>{nombre}</strong>? Esta acción no se puede deshacer.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={btnGhost}>Cancelar</button>
        <button onClick={onConfirm} style={{ ...btnPrimary, background: '#c0392b' }}>Eliminar</button>
      </div>
    </Modal>
  );
}

// ─── Main tab ──────────────────────────────────────────────────────────────────
export default function AdminProducts() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'delete' | 'excel'
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState(null);
  const [tab, setTab] = useState('todos'); // 'todos' | 'destacados'

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    const [{ data: prods, error: e1 }, { data: cats, error: e2 }] = await Promise.all([
      supabase.from('productos').select('*, categorias(nombre)').order('id'),
      supabase.from('categorias').select('*').order('orden'),
    ]);
    if (e1) setError(`Error al cargar productos: ${e1.message}`);
    setProductos(prods || []);
    setCategorias(cats || []);
    setLoading(false);
  };

  const openEdit = (p) => { setSelected(p); setModal('edit'); };
  const openDelete = (p) => { setSelected(p); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = () => { closeModal(); fetchAll(); };

  const handleDelete = async () => {
    await supabase.from('productos').delete().eq('id', selected.id);
    closeModal();
    fetchAll();
  };

  const toggleActivo = async (p) => {
    setToggling(p.id + '-activo');
    const { error: e } = await supabase.from('productos').update({ activo: !p.activo }).eq('id', p.id);
    if (!e) setProductos(prev => prev.map(x => x.id === p.id ? { ...x, activo: !x.activo } : x));
    else alert(`Error: ${e.message}`);
    setToggling(null);
  };

  const toggleDestacado = async (p) => {
    setToggling(p.id + '-dest');
    const { error: e } = await supabase.from('productos').update({ destacado: !p.destacado }).eq('id', p.id);
    if (!e) setProductos(prev => prev.map(x => x.id === p.id ? { ...x, destacado: !x.destacado } : x));
    else alert(`Error: ${e.message}`);
    setToggling(null);
  };

  const baseList = tab === 'destacados'
    ? productos.filter(p => p.destacado)
    : productos;

  const filtered = baseList.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.nombre?.toLowerCase().includes(q) || p.marca?.toLowerCase().includes(q);
  });

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, flex: 1, fontSize: 22, fontWeight: 800 }}>
          Productos <span style={{ fontWeight: 400, color: '#999', fontSize: 16 }}>({productos.length})</span>
        </h2>
        <button onClick={() => setModal('excel')} style={btnGhost}>
          <Icon.FileXls s={15} /> Importar Excel
        </button>
        <button onClick={() => { setSelected(null); setModal('add'); }} style={btnPrimary}>
          <Icon.Plus s={15} /> Agregar producto
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['todos', `Todos (${productos.length})`], ['destacados', `⭐ Destacados (${productos.filter(p => p.destacado).length})`]].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: tab === k ? '2px solid #2b1f14' : '2px solid #e0d8d0',
              background: tab === k ? '#2b1f14' : 'transparent',
              color: tab === k ? '#FCEFA8' : '#2b1f14',
            }}
          >{l}</button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}>
          <Icon.Search s={15} />
        </span>
        <input
          style={{ ...input, paddingLeft: 36, maxWidth: 340 }}
          placeholder="Buscar nombre o marca…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background: '#fdf0f0', border: '1px solid #f5c6c6', borderRadius: 12, padding: '14px 18px', color: '#c0392b', fontSize: 13, marginBottom: 16 }}>
          <strong>Error:</strong> {error}
          <p style={{ margin: '6px 0 0' }}>Verificá que la RLS policy permita al admin leer y escribir en la tabla <code>productos</code>.</p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>Cargando…</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e0d8', overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 640 }}>
            <thead>
              <tr style={{ background: '#f7f4f0', borderBottom: '1px solid #e8e0d8' }}>
                {['Imagen', 'Nombre', 'Marca', 'Precio', 'Unidad', 'Categoría', 'Activo', 'Dest.', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f0ebe4' : 'none', background: p.activo ? 'transparent' : '#fafafa', opacity: p.activo ? 1 : 0.6 }}>
                  <td style={{ padding: '10px 14px' }}>
                    {p.imagen_url
                      ? <img src={p.imagen_url} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f0ebe4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}><Icon.Image s={18} /></div>
                    }
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, maxWidth: 200 }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre}</div>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#666' }}>{p.marca || '—'}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700 }}>
                    {p.precio ? `$${Number(p.precio).toLocaleString('es-AR')}` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#666' }}>{p.unidad || '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#666' }}>{p.categorias?.nombre || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <button
                      onClick={() => toggleActivo(p)}
                      disabled={toggling === p.id + '-activo'}
                      style={{
                        padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                        border: 'none', cursor: 'pointer', opacity: toggling === p.id + '-activo' ? 0.5 : 1,
                        background: p.activo ? '#d4edda' : '#f8d7da',
                        color: p.activo ? '#155724' : '#721c24',
                      }}
                    >
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button
                      onClick={() => toggleDestacado(p)}
                      disabled={toggling === p.id + '-dest'}
                      title={p.destacado ? 'Quitar destacado' : 'Destacar'}
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                        opacity: toggling === p.id + '-dest' ? 0.5 : 1,
                        background: p.destacado ? '#FEF3C7' : '#f0ebe4',
                        fontSize: 16,
                      }}
                    >
                      {p.destacado ? '⭐' : '☆'}
                    </button>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(p)} style={btnGhost} title="Editar"><Icon.Edit s={14} /></button>
                      <button onClick={() => openDelete(p)} style={btnDanger} title="Eliminar"><Icon.Trash s={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ padding: '48px 20px', textAlign: 'center', color: '#aaa' }}>
                  {tab === 'destacados' ? 'No hay productos destacados. Usá la estrella ☆ en cualquier producto para destacarlo.' : search ? 'Sin resultados.' : 'No hay productos todavía. Usá "Agregar producto" o importá desde Excel.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {modal === 'add' && (
        <Modal title="Nuevo producto" onClose={closeModal} wide>
          <ProductForm categorias={categorias} onSave={handleSave} onClose={closeModal} />
        </Modal>
      )}
      {modal === 'edit' && selected && (
        <Modal title={`Editar: ${selected.nombre}`} onClose={closeModal} wide>
          <ProductForm initial={selected} categorias={categorias} onSave={handleSave} onClose={closeModal} />
        </Modal>
      )}
      {modal === 'delete' && selected && (
        <DeleteConfirm nombre={selected.nombre} onConfirm={handleDelete} onCancel={closeModal} />
      )}
      {modal === 'excel' && (
        <ExcelImportModal categorias={categorias} onDone={fetchAll} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
