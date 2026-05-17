import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminClients() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error: e }) => {
        if (e) setError(e.message);
        setProfiles(data || []);
        setLoading(false);
      });
  }, []);

  const hasEmail = profiles.length > 0 && profiles[0]?.email !== undefined;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800 }}>Clientes registrados</h2>
        <p style={{ margin: 0, color: '#888', fontSize: 14 }}>{profiles.length} usuarios en el sistema</p>
      </div>

      {error && (
        <div style={{ background: '#fdf0f0', border: '1px solid #f5c6c6', borderRadius: 12, padding: '14px 18px', color: '#c0392b', fontSize: 13, marginBottom: 16 }}>
          <strong>Error al cargar perfiles:</strong> {error}
          <p style={{ margin: '8px 0 0', color: '#888' }}>
            Verificá que la tabla <code>profiles</code> exista y que RLS permita al admin leerla.
          </p>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>Cargando…</p>
      ) : (
        <>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e0d8', overflow: 'hidden', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 400 }}>
              <thead>
                <tr style={{ background: '#f7f4f0', borderBottom: '1px solid #e8e0d8' }}>
                  {['ID', 'Email', 'Rol', 'Fecha de registro'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profiles.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < profiles.length - 1 ? '1px solid #f0ebe4' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: '#aaa' }}>
                      {p.id.slice(0, 8)}…
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      {p.email || <span style={{ color: '#ccc', fontStyle: 'italic' }}>No disponible</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                        background: p.role === 'admin' ? '#FCEFA8' : '#f0ebe4',
                        color: p.role === 'admin' ? '#2b1f14' : '#888',
                      }}>
                        {p.role || 'cliente'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#888', fontSize: 13 }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
                {profiles.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: '40px 20px', textAlign: 'center', color: '#aaa' }}>No hay usuarios registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {!hasEmail && profiles.length > 0 && (
            <div style={{ marginTop: 16, background: '#f7f4f0', borderRadius: 12, padding: '14px 18px', fontSize: 12, color: '#888' }}>
              Para mostrar emails, ejecutá en Supabase → SQL Editor:
              <pre style={{ margin: '8px 0 0', background: '#fff', border: '1px solid #e8e0d8', borderRadius: 8, padding: '10px 14px', fontSize: 12, overflowX: 'auto' }}>{`-- Agregar columna email a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Actualizar trigger para guardar email al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email, created_at)
  VALUES (new.id, 'cliente', new.email, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;`}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
