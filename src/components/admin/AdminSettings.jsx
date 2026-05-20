import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Icon } from '../Icons';

const inp = {
  padding: '10px 13px', border: '1.5px solid #e0d8d0', borderRadius: 10,
  fontSize: 14, background: '#faf8f5', color: '#2b1f14',
  width: '100%', boxSizing: 'border-box',
};
const fld = { display: 'flex', flexDirection: 'column', gap: 6 };
const lbl = { fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' };

const DEFAULTS = {
  nombre_negocio:      'Luka',
  descripcion:         'Alimentos balanceados para mascotas',
  direccion:           'Octavio Pinto 2207, Córdoba',
  telefono:            '+54 9 3515 50-4248',
  whatsapp:            '5493515504248',
  horario:             '',
  hero_titulo:         'Comida y accesorios para que tu mascota coma como Luka.',
  hero_subtitulo:      'Alimento balanceado, snacks y todo lo que necesita tu mascota. Armá tu pedido y mandanos un mensaje — te confirmamos precios y stock al toque.',
  hero_hoy_etiqueta:   'Hoy',
  hero_hoy_titulo:     'Bolsa de 15 kg',
  hero_hoy_descripcion:'Llevá tu marca habitual al mejor precio.',
};
const LS_KEY = 'luka-config';

export default function AdminSettings() {
  const [config, setConfig]  = useState(DEFAULTS);
  const [saving, setSaving]  = useState(false);
  const [saved, setSaved]    = useState(false);
  const [useDb, setUseDb]    = useState(false);
  const [tab, setTab]        = useState('config'); // 'config' | 'sql'

  useEffect(() => {
    const load = async () => {
      // Try DB first
      const { data, error } = await supabase.from('configuracion').select('*');
      if (!error && data?.length) {
        const obj = {};
        data.forEach(r => { obj[r.clave] = r.valor; });
        setConfig(c => ({ ...c, ...obj }));
        setUseDb(true);
        return;
      }
      // Fallback localStorage
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) setConfig(c => ({ ...c, ...JSON.parse(raw) }));
      } catch (_) {}
    };
    load();
  }, []);

  const set = (k, v) => setConfig(c => ({ ...c, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    // Try Supabase
    let dbOk = false;
    try {
      const rows = Object.entries(config).map(([clave, valor]) => ({ clave, valor }));
      const { error } = await supabase.from('configuracion').upsert(rows, { onConflict: 'clave' });
      if (!error) { dbOk = true; setUseDb(true); }
    } catch (_) {}

    // Always save locally too
    try { localStorage.setItem(LS_KEY, JSON.stringify(config)); } catch (_) {}
    if (!dbOk) setUseDb(false);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const SQL_SETUP = `-- 1. Tabla configuracion
CREATE TABLE IF NOT EXISTS configuracion (
  clave text PRIMARY KEY,
  valor text NOT NULL DEFAULT ''
);
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin lee config" ON configuracion
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admin edita config" ON configuracion
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Columna imagen en productos
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen_url text;

-- 3. RLS: admin puede escribir en productos
CREATE POLICY "Admin gestiona productos" ON productos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. RLS: admin puede escribir en categorias
CREATE POLICY "Admin gestiona categorias" ON categorias
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Tabla profiles con email y fecha
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 6. Trigger actualizado (copia email al registrarse)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email, created_at)
  VALUES (new.id, 'cliente', new.email, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- 7. Dar rol admin al usuario administrador
UPDATE profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'marcelolascano2020@gmail.com');

-- 8. Bucket de storage (hacer esto en Dashboard → Storage)
-- Crear bucket público llamado: productos`;

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 800 }}>Configuración</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[['config', 'Datos del negocio'], ['sql', 'Setup SQL / Base de datos']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: tab === k ? '2px solid #2b1f14' : '2px solid #e0d8d0',
              background: tab === k ? '#2b1f14' : 'transparent',
              color: tab === k ? '#FCEFA8' : '#2b1f14',
            }}
          >{l}</button>
        ))}
      </div>

      {tab === 'config' && (
        <form onSubmit={handleSave}>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e0d8', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Storage indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: useDb ? '#155724' : '#856404', background: useDb ? '#f0faf0' : '#fff8e1', border: `1px solid ${useDb ? '#c3e6cb' : '#ffc107'}`, borderRadius: 8, padding: '8px 12px' }}>
              {useDb ? <Icon.Check s={13} /> : <Icon.Settings s={13} />}
              {useDb ? 'Guardado en Supabase (tabla configuracion)' : 'Guardado en localStorage. Ejecutá el SQL del tab "Setup" para usar la base de datos.'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div style={fld}>
                <span style={lbl}>Nombre del negocio</span>
                <input type="text" style={inp} value={config.nombre_negocio} onChange={e => set('nombre_negocio', e.target.value)} />
              </div>
              <div style={fld}>
                <span style={lbl}>Descripción</span>
                <input type="text" style={inp} value={config.descripcion} onChange={e => set('descripcion', e.target.value)} />
              </div>
              <div style={fld}>
                <span style={lbl}>Dirección</span>
                <input type="text" style={inp} value={config.direccion} onChange={e => set('direccion', e.target.value)} />
              </div>
              <div style={fld}>
                <span style={lbl}>Teléfono (mostrado en el sitio)</span>
                <input type="text" style={inp} value={config.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+54 9 3515 50-4248" />
              </div>
              <div style={fld}>
                <span style={lbl}>WhatsApp (solo números)</span>
                <input type="text" style={inp} value={config.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="5493515504248" />
              </div>
              <div style={fld}>
                <span style={lbl}>Horario de atención</span>
                <input type="text" style={inp} value={config.horario} onChange={e => set('horario', e.target.value)} placeholder="Lun–Vie 9–18hs" />
              </div>
            </div>

            {/* Hero texts */}
            <div style={{ borderTop: '1px solid #e8e0d8', paddingTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2b1f14', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Textos del Hero
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={fld}>
                  <span style={lbl}>Título principal</span>
                  <input type="text" style={inp} value={config.hero_titulo} onChange={e => set('hero_titulo', e.target.value)} placeholder="Comida y accesorios para que tu mascota coma como Luka." />
                </div>
                <div style={fld}>
                  <span style={lbl}>Subtítulo</span>
                  <textarea style={{ ...inp, resize: 'vertical', minHeight: 72 }} value={config.hero_subtitulo} onChange={e => set('hero_subtitulo', e.target.value)} placeholder="Descripción debajo del título…" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  <div style={fld}>
                    <span style={lbl}>Card HOY — Etiqueta</span>
                    <input type="text" style={inp} value={config.hero_hoy_etiqueta} onChange={e => set('hero_hoy_etiqueta', e.target.value)} placeholder="Hoy" />
                  </div>
                  <div style={fld}>
                    <span style={lbl}>Card HOY — Título</span>
                    <input type="text" style={inp} value={config.hero_hoy_titulo} onChange={e => set('hero_hoy_titulo', e.target.value)} placeholder="Bolsa de 15 kg" />
                  </div>
                  <div style={fld}>
                    <span style={lbl}>Card HOY — Descripción</span>
                    <input type="text" style={inp} value={config.hero_hoy_descripcion} onChange={e => set('hero_hoy_descripcion', e.target.value)} placeholder="Llevá tu marca habitual al mejor precio." />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button type="submit" disabled={saving} style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: '#2b1f14', color: '#FCEFA8', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
              {saved && (
                <span style={{ fontSize: 13, color: '#155724', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon.Check s={14} /> Guardado
                </span>
              )}
            </div>
          </div>
        </form>
      )}

      {tab === 'sql' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e0d8', padding: 24 }}>
          <p style={{ margin: '0 0 14px', fontSize: 14, color: '#555' }}>
            Copiá y ejecutá este SQL en <strong>Supabase → SQL Editor</strong> para configurar la base de datos completa del panel admin:
          </p>
          <div style={{ position: 'relative' }}>
            <pre style={{
              background: '#1e1e2e', color: '#cdd6f4', borderRadius: 12,
              padding: '18px 20px', fontSize: 12, lineHeight: 1.6,
              overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap',
            }}>
              {SQL_SETUP}
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(SQL_SETUP)}
              style={{
                position: 'absolute', top: 12, right: 12,
                padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)', color: '#cdd6f4',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Copiar
            </button>
          </div>
          <div style={{ marginTop: 16, background: '#f7f4f0', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#666' }}>
            <strong>Notas:</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 20, lineHeight: 1.7 }}>
              <li>El bucket de Storage "productos" se crea desde Supabase Dashboard → Storage → New bucket (marcarlo como público).</li>
              <li>Después de ejecutar el SQL, recargá el panel admin.</li>
              <li>Si ya tenés las tablas, algunos <code>CREATE TABLE IF NOT EXISTS</code> van a omitirse sin error.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
