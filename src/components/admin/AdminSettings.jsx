import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Icon } from '../Icons';

const inputStyle = {
  padding: '9px 12px', border: '1px solid var(--line-2)', borderRadius: 10,
  background: 'var(--bg)', fontSize: 14, color: 'var(--ink)',
  width: '100%', boxSizing: 'border-box',
};

const DEFAULTS = {
  nombre_negocio: 'Luka',
  direccion: 'Octavio Pinto 2207, Córdoba',
  telefono: '+54 9 3515 50-4248',
  whatsapp: '5493515504248',
  descripcion: 'Alimentos balanceados para mascotas',
  horario: '',
};

const STORAGE_KEY = 'luka-config';

export default function AdminSettings() {
  const [config, setConfig] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [source, setSource] = useState('local');

  useEffect(() => {
    const loadConfig = async () => {
      // Try Supabase configuracion table first
      const { data } = await supabase.from('configuracion').select('*');
      if (data && data.length > 0) {
        const dbConfig = {};
        data.forEach(row => { dbConfig[row.clave] = row.valor; });
        setConfig(prev => ({ ...prev, ...dbConfig }));
        setSource('supabase');
        return;
      }
      // Fallback: localStorage
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) { setConfig(prev => ({ ...prev, ...JSON.parse(raw) })); }
      } catch (_) {}
    };
    loadConfig();
  }, []);

  const set = (k, v) => setConfig(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    // Try to save to Supabase
    let savedToDb = false;
    try {
      const rows = Object.entries(config).map(([clave, valor]) => ({ clave, valor }));
      const { error } = await supabase.from('configuracion').upsert(rows, { onConflict: 'clave' });
      if (!error) { savedToDb = true; setSource('supabase'); }
    } catch (_) {}

    // Always save to localStorage as backup
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch (_) {}

    if (!savedToDb) setSource('local');
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, margin: '0 0 4px' }}>Configuración del negocio</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
          {source === 'supabase'
            ? <><Icon.Check s={12} /> Datos guardados en Supabase</>
            : <><Icon.Settings s={12} /> Guardado en localStorage (local)</>
          }
        </div>
      </div>

      <form onSubmit={handleSave} style={{ background: 'var(--paper)', borderRadius: 16, padding: 24, border: '1px solid var(--line-2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <label className="luka-field">
            <span>Nombre del negocio</span>
            <input type="text" value={config.nombre_negocio} onChange={e => set('nombre_negocio', e.target.value)} style={inputStyle} />
          </label>
          <label className="luka-field">
            <span>Descripción breve</span>
            <input type="text" value={config.descripcion} onChange={e => set('descripcion', e.target.value)} style={inputStyle} />
          </label>
          <label className="luka-field">
            <span>Dirección</span>
            <input type="text" value={config.direccion} onChange={e => set('direccion', e.target.value)} style={inputStyle} />
          </label>
          <label className="luka-field">
            <span>Teléfono (con formato)</span>
            <input type="text" value={config.telefono} onChange={e => set('telefono', e.target.value)} style={inputStyle} placeholder="+54 9 3515 50-4248" />
          </label>
          <label className="luka-field">
            <span>WhatsApp (solo números, ej: 5493515504248)</span>
            <input type="text" value={config.whatsapp} onChange={e => set('whatsapp', e.target.value)} style={inputStyle} placeholder="5493515504248" />
          </label>
          <label className="luka-field">
            <span>Horario de atención</span>
            <input type="text" value={config.horario} onChange={e => set('horario', e.target.value)} style={inputStyle} placeholder="Lun–Vie 9–18hs" />
          </label>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="submit" disabled={saving} className="luka-cta-dark" style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {saved && <span style={{ fontSize: 13, color: '#155724', display: 'flex', alignItems: 'center', gap: 4 }}><Icon.Check s={14} /> Guardado</span>}
        </div>
      </form>

      {source === 'local' && (
        <div style={{ background: 'var(--cream-2)', borderRadius: 12, padding: '14px 18px', fontSize: 12, color: 'var(--muted)' }}>
          Para guardar la config en la base de datos, ejecutá en Supabase SQL Editor:
          <pre style={{ background: 'var(--bg)', borderRadius: 8, padding: 12, marginTop: 8, fontSize: 11, overflow: 'auto' }}>{`CREATE TABLE IF NOT EXISTS configuracion (
  clave text PRIMARY KEY,
  valor text NOT NULL DEFAULT ''
);
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access" ON configuracion
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));`}</pre>
        </div>
      )}
    </div>
  );
}
