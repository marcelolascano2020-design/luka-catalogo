import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const HEADERS = [
  { key: 'id',                label: 'ID' },
  { key: 'email',             label: 'Email' },
  { key: 'role',              label: 'Rol' },
  { key: 'nombre_completo',   label: 'Nombre' },
  { key: 'celular',           label: 'Celular' },
  { key: 'barrio',            label: 'Barrio' },
  { key: 'nombre_mascota',    label: 'Mascota' },
  { key: 'edad_mascota',      label: 'Edad mascota' },
  { key: 'juguete_preferido', label: 'Juguete favorito' },
  { key: 'created_at',        label: 'Registro' },
];

function Cell({ col, p }) {
  if (col === 'id') return (
    <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#aaa' }}>{p.id?.slice(0, 8)}…</span>
  );
  if (col === 'email') return (
    <span style={{ fontWeight: 600 }}>{p.email || <span style={{ color: '#ccc', fontStyle: 'italic' }}>—</span>}</span>
  );
  if (col === 'role') return (
    <span style={{
      padding: '3px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: p.role === 'admin' ? '#FCEFA8' : '#f0ebe4',
      color: p.role === 'admin' ? '#2b1f14' : '#888',
    }}>
      {p.role || 'cliente'}
    </span>
  );
  if (col === 'created_at') return (
    <span style={{ color: '#888', fontSize: 13 }}>
      {p.created_at ? new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
    </span>
  );
  const val = p[col];
  return <span style={{ color: val ? '#2b1f14' : '#ccc', fontStyle: val ? 'normal' : 'italic' }}>{val || '—'}</span>;
}

export default function AdminClients() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

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
            Verificá que la tabla <code>profiles</code> exista y que RLS permita al admin leerla. Ejecutá el SQL del diagnóstico arriba del panel.
          </p>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>Cargando…</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e0d8', overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
            <thead>
              <tr style={{ background: '#f7f4f0', borderBottom: '1px solid #e8e0d8' }}>
                {HEADERS.map(h => (
                  <th key={h.key} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', whiteSpace: 'nowrap' }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < profiles.length - 1 ? '1px solid #f0ebe4' : 'none' }}>
                  {HEADERS.map(h => (
                    <td key={h.key} style={{ padding: '11px 14px', verticalAlign: 'middle' }}>
                      <Cell col={h.key} p={p} />
                    </td>
                  ))}
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr>
                  <td colSpan={HEADERS.length} style={{ padding: '40px 20px', textAlign: 'center', color: '#aaa' }}>
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
