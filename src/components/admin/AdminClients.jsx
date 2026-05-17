import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminClients() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) setError(err.message);
      else setProfiles(data || []);
      setLoading(false);
    };
    fetchProfiles();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, margin: '0 0 4px' }}>Clientes registrados</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
          Usuarios con cuenta en el sistema.
        </p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Cargando…</p>
      ) : error ? (
        <div style={{ background: '#fff5f5', borderRadius: 12, padding: 16, color: '#c0392b', fontSize: 13 }}>
          <strong>Error al cargar perfiles:</strong> {error}
          <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
            Asegurate de tener la tabla <code>profiles</code> creada y con RLS habilitado.
          </p>
        </div>
      ) : (
        <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 400 }}>
            <thead>
              <tr style={{ background: 'var(--cream-2)', borderBottom: '1px solid var(--line-2)' }}>
                {['ID', 'Rol', 'Fecha de registro', 'Email'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < profiles.length - 1 ? '1px solid var(--line)' : 'none' }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)' }}>
                    {p.id.slice(0, 8)}…
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                      background: p.role === 'admin' ? '#FCEFA8' : 'var(--cream-2)',
                      color: p.role === 'admin' ? 'var(--ink)' : 'var(--muted)',
                    }}>
                      {p.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--muted)', fontSize: 13 }}>
                    {p.created_at ? new Date(p.created_at).toLocaleDateString('es-AR') : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--muted)', fontSize: 13 }}>
                    {p.email || <span style={{ opacity: 0.5 }}>No disponible*</span>}
                  </td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '40px 14px', textAlign: 'center', color: 'var(--muted)' }}>No hay usuarios registrados todavía.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {profiles.length > 0 && !profiles[0]?.email && (
        <div style={{ background: 'var(--cream-2)', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>
          * Para mostrar emails, ejecutá en Supabase SQL Editor:{' '}
          <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>
            ALTER TABLE profiles ADD COLUMN email text;
          </code>{' '}
          y actualizá el trigger para incluir <code>new.email</code>.
        </div>
      )}
    </div>
  );
}
