import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Returns { session, role, loading }
// role: 'admin' | 'cliente' | null (null = not logged in)
export function useAuth() {
  const [session, setSession] = useState(null);
  const [role, setRole]       = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    setRole(data?.role ?? 'cliente');
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session;
      setSession(s);
      if (s?.user) await fetchRole(s.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user) {
        await fetchRole(s.user.id);
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, role, loading };
}
