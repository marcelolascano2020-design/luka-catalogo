import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Icon } from '../Icons';

const SQL = `-- ═══════════════════════════════════════════════
-- EJECUTAR COMPLETO EN: Supabase → SQL Editor
-- ═══════════════════════════════════════════════

-- 1. Columna de imagen en productos (si no existe)
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen_url text;

-- 2. Quitar policies viejas que puedan interferir
DROP POLICY IF EXISTS "Enable read access for all users" ON productos;
DROP POLICY IF EXISTS "Admin gestiona productos" ON productos;
DROP POLICY IF EXISTS "Admin gestiona categorias" ON categorias;
DROP POLICY IF EXISTS "Admin puede ver todos" ON productos;

-- 3. Policy: cualquiera puede LEER productos activos (catálogo público)
CREATE POLICY "Lectura publica productos"
  ON productos FOR SELECT
  USING (activo = true);

-- 4. Policy: admin puede leer TODOS los productos (incluso inactivos)
CREATE POLICY "Admin lee todos los productos"
  ON productos FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Policy: admin puede INSERTAR productos
CREATE POLICY "Admin inserta productos"
  ON productos FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. Policy: admin puede ACTUALIZAR productos
CREATE POLICY "Admin actualiza productos"
  ON productos FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 7. Policy: admin puede ELIMINAR productos
CREATE POLICY "Admin elimina productos"
  ON productos FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 8. Policy: admin gestiona categorías (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admin inserta categorias" ON categorias;
DROP POLICY IF EXISTS "Admin actualiza categorias" ON categorias;
DROP POLICY IF EXISTS "Admin elimina categorias" ON categorias;

CREATE POLICY "Admin inserta categorias"
  ON categorias FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin actualiza categorias"
  ON categorias FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin elimina categorias"
  ON categorias FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 9. Asegurarse de que profiles tiene RLS y el admin puede leerse a sí mismo
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 10. Dar rol admin (cambiá el email si es necesario)
UPDATE profiles SET role = 'admin'
  WHERE id = (SELECT id FROM auth.users WHERE email = 'marcelolascano2020@gmail.com');

-- 11. Verificar que quedó bien
SELECT u.email, p.role
  FROM auth.users u
  JOIN profiles p ON p.id = u.id
  WHERE u.email = 'marcelolascano2020@gmail.com';`;

async function runChecks() {
  const results = {};

  // 1. Auth: is there a logged-in user?
  const { data: { user } } = await supabase.auth.getUser();
  results.auth = { ok: !!user, detail: user?.email || 'Sin sesión' };

  if (!user) return results;

  // 2. Profile + role
  const { data: profile, error: profileErr } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  results.profile = {
    ok: !!profile && !profileErr,
    detail: profile ? `role = "${profile.role}"` : (profileErr?.message || 'Sin perfil'),
  };
  results.isAdmin = { ok: profile?.role === 'admin', detail: profile?.role === 'admin' ? 'Sí' : `role es "${profile?.role || '?'}", necesita ser "admin"` };

  // 3. Can read productos?
  const { error: readErr } = await supabase.from('productos').select('id').limit(1);
  results.readProductos = { ok: !readErr, detail: readErr?.message || 'OK' };

  // 4. Can INSERT into productos?
  const testNombre = `__setup_test_${Date.now()}__`;
  const { data: inserted, error: insertErr } = await supabase
    .from('productos').insert({ nombre: testNombre, precio: 0, activo: false }).select('id').single();
  results.writeProductos = { ok: !insertErr, detail: insertErr?.message || 'OK' };

  // Clean up test row
  if (inserted?.id) {
    await supabase.from('productos').delete().eq('id', inserted.id);
  }

  // 5. Can INSERT into categorias?
  const testCatName = `__setup_test_${Date.now()}__`;
  const { data: insertedCat, error: insertCatErr } = await supabase
    .from('categorias').insert({ nombre: testCatName, orden: 9999, activa: false }).select('id').single();
  results.writeCategorias = { ok: !insertCatErr, detail: insertCatErr?.message || 'OK' };
  if (insertedCat?.id) {
    await supabase.from('categorias').delete().eq('id', insertedCat.id);
  }

  return results;
}

export default function SetupChecker() {
  const [checks, setChecks]   = useState(null);
  const [running, setRunning] = useState(true);
  const [copied, setCopied]   = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    runChecks().then(r => { setChecks(r); setRunning(false); });
  }, []);

  const copy = () => {
    navigator.clipboard.writeText(SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (running) return null;
  if (!checks) return null;

  const allOk = checks.auth?.ok && checks.profile?.ok && checks.isAdmin?.ok
    && checks.readProductos?.ok && checks.writeProductos?.ok && checks.writeCategorias?.ok;

  if (allOk && dismissed) return null;
  if (allOk) return (
    <div style={{
      background: '#f0faf0', border: '1px solid #c3e6cb', borderRadius: 12,
      padding: '12px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 13, color: '#155724',
    }}>
      <Icon.Check s={16} />
      <span>Configuración completa: autenticación, perfiles y permisos de escritura OK.</span>
      <button onClick={() => setDismissed(true)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#155724', opacity: 0.6 }}>
        <Icon.Close s={14} />
      </button>
    </div>
  );

  // There are failures — show the full setup banner
  const Row = ({ label, result }) => result ? (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>
        {result.ok
          ? <span style={{ color: '#34d399', fontWeight: 700 }}>✓</span>
          : <span style={{ color: '#f87171', fontWeight: 700 }}>✗</span>
        }
      </span>
      <div>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{label}: </span>
        <span style={{ fontSize: 13, opacity: 0.85 }}>{result.detail}</span>
      </div>
    </div>
  ) : null;

  return (
    <div style={{
      background: '#1e1e2e', color: '#cdd6f4', borderRadius: 14,
      padding: '20px 22px', marginBottom: 28,
      border: '2px solid #f87171',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#f87171', marginBottom: 4 }}>
            ⚠ Configuración incompleta
          </div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            Algunas operaciones van a fallar hasta que ejecutes el SQL en Supabase.
          </div>
        </div>
      </div>

      {/* Check results */}
      <div style={{ marginBottom: 18 }}>
        <Row label="Sesión activa"                result={checks.auth} />
        <Row label="Perfil en tabla profiles"     result={checks.profile} />
        <Row label="Rol admin"                    result={checks.isAdmin} />
        <Row label="Leer productos"               result={checks.readProductos} />
        <Row label="Escribir en productos"        result={checks.writeProductos} />
        <Row label="Escribir en categorías"       result={checks.writeCategorias} />
      </div>

      {/* SQL Block */}
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#a6e3a1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          SQL para ejecutar en Supabase → SQL Editor:
        </div>
        <pre style={{
          background: '#181825', borderRadius: 10, padding: '14px 16px',
          fontSize: 11.5, lineHeight: 1.7, overflowX: 'auto', maxHeight: 260,
          overflowY: 'auto', margin: 0, color: '#cdd6f4',
        }}>
          {SQL}
        </pre>
        <button
          onClick={copy}
          style={{
            position: 'absolute', top: 36, right: 8,
            padding: '6px 14px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.2)',
            background: copied ? '#a6e3a1' : 'rgba(255,255,255,0.1)',
            color: copied ? '#1e1e2e' : '#cdd6f4',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {copied ? '✓ Copiado' : 'Copiar SQL'}
        </button>
      </div>

      <div style={{ marginTop: 14, fontSize: 12, opacity: 0.6, lineHeight: 1.6 }}>
        Después de ejecutar el SQL, recargá la página. El diagnóstico volverá a correr automáticamente.
      </div>
    </div>
  );
}
