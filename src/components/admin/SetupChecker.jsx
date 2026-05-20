import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Icon } from '../Icons';

const SQL = `-- ═══════════════════════════════════════════════
-- EJECUTAR COMPLETO EN: Supabase → SQL Editor
-- ═══════════════════════════════════════════════

-- 1. Columnas en productos
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen_url text;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS mascota text DEFAULT 'Varios';

-- 2. Columnas en profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email            text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nombre_completo  text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS celular          text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS barrio           text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nombre_mascota   text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS edad_mascota     text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS juguete_preferido text;

-- 3. is_admin(): evita recursión en RLS, corre sin RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- 4. Trigger: crear/actualizar fila en profiles al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email, created_at)
  VALUES (NEW.id, 'cliente', NEW.email, NOW())
  ON CONFLICT (id) DO UPDATE SET email = NEW.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. RPC: get_users_with_email() — admin puede leer auth.users via SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_users_with_email()
RETURNS TABLE (
  id uuid, email text, role text,
  nombre_completo text, celular text, barrio text,
  nombre_mascota text, edad_mascota text, juguete_preferido text,
  created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'acceso denegado';
  END IF;
  RETURN QUERY
    SELECT
      p.id,
      u.email,
      p.role,
      p.nombre_completo,
      p.celular,
      p.barrio,
      p.nombre_mascota,
      p.edad_mascota,
      p.juguete_preferido,
      COALESCE(p.created_at, u.created_at)
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    ORDER BY u.created_at DESC;
END;
$$;

-- 6. Quitar policies viejas para empezar limpio
DROP POLICY IF EXISTS "Enable read access for all users"   ON productos;
DROP POLICY IF EXISTS "Admin gestiona productos"           ON productos;
DROP POLICY IF EXISTS "Admin puede ver todos"              ON productos;
DROP POLICY IF EXISTS "Lectura publica productos"          ON productos;
DROP POLICY IF EXISTS "Admin lee todos los productos"      ON productos;
DROP POLICY IF EXISTS "Admin inserta productos"            ON productos;
DROP POLICY IF EXISTS "Admin actualiza productos"          ON productos;
DROP POLICY IF EXISTS "Admin elimina productos"            ON productos;
DROP POLICY IF EXISTS "Admin gestiona categorias"          ON categorias;
DROP POLICY IF EXISTS "Admin inserta categorias"           ON categorias;
DROP POLICY IF EXISTS "Admin actualiza categorias"         ON categorias;
DROP POLICY IF EXISTS "Admin elimina categorias"           ON categorias;
DROP POLICY IF EXISTS "Users can read own profile"         ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile"       ON profiles;
DROP POLICY IF EXISTS "Users can update own profile"       ON profiles;
DROP POLICY IF EXISTS "Admin reads all profiles"           ON profiles;

-- 7. Policies: productos
CREATE POLICY "Lectura publica productos"
  ON productos FOR SELECT USING (activo = true);
CREATE POLICY "Admin lee todos los productos"
  ON productos FOR SELECT USING (is_admin());
CREATE POLICY "Admin inserta productos"
  ON productos FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin actualiza productos"
  ON productos FOR UPDATE USING (is_admin());
CREATE POLICY "Admin elimina productos"
  ON productos FOR DELETE USING (is_admin());

-- 8. Policies: categorias
CREATE POLICY "Admin inserta categorias"
  ON categorias FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin actualiza categorias"
  ON categorias FOR UPDATE USING (is_admin());
CREATE POLICY "Admin elimina categorias"
  ON categorias FOR DELETE USING (is_admin());

-- 9. Policies: profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

-- INSERT: necesario para upsert cuando la fila no existe aún
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Admin lee todos los perfiles via is_admin() (sin recursión)
CREATE POLICY "Admin reads all profiles"
  ON profiles FOR SELECT USING (is_admin());

-- 10. Dar rol admin
UPDATE profiles SET role = 'admin'
  WHERE id = (SELECT id FROM auth.users WHERE email = 'marcelolascano2020@gmail.com');

-- 11. Backfill de emails para usuarios ya registrados
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- 12. Verificar
SELECT u.email, p.role FROM auth.users u
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

  // 6. Can admin call get_users_with_email() RPC?
  const { data: rpcData, error: rpcErr } = await supabase.rpc('get_users_with_email');
  const canSeeAll = !rpcErr && (rpcData?.length ?? 0) >= 1;
  results.readAllProfiles = {
    ok: canSeeAll,
    detail: rpcErr?.message || (canSeeAll ? `OK (${rpcData.length} usuario(s))` : 'Sin datos. Ejecutá el SQL para crear get_users_with_email().'),
  };

  // 7. Can user update own profile? (upsert a harmless field and verify it stuck)
  const testBarrio = `__test_${Date.now()}__`;
  const { data: upserted, error: upErr } = await supabase
    .from('profiles')
    .upsert({ id: user.id, barrio: testBarrio }, { onConflict: 'id' })
    .select('barrio')
    .single();
  const updateOk = !upErr && upserted?.barrio === testBarrio;
  if (updateOk) {
    // Restore to null
    await supabase.from('profiles').update({ barrio: null }).eq('id', user.id);
  }
  results.updateProfile = {
    ok: updateOk,
    detail: upErr?.message || (updateOk ? 'OK' : 'El UPDATE en profiles fue bloqueado por RLS. Ejecutá el SQL para crear "Users can update own profile".'),
  };

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
    && checks.readProductos?.ok && checks.writeProductos?.ok && checks.writeCategorias?.ok
    && checks.readAllProfiles?.ok && checks.updateProfile?.ok;

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
        <Row label="Admin ve todos los perfiles"  result={checks.readAllProfiles} />
        <Row label="Guardar perfil de cliente"    result={checks.updateProfile} />
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
