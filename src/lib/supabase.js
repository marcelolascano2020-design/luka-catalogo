import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL  || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabaseReady = !!(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Diagnostic: visible in browser console to confirm env vars reach the client
console.log(
  '[supabase] ready:', supabaseReady,
  '| url:', import.meta.env.VITE_SUPABASE_URL ? supabaseUrl.slice(0, 30) + '…' : 'MISSING',
  '| key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? supabaseKey.slice(0, 20) + '…' : 'MISSING',
);

export const supabase = createClient(supabaseUrl, supabaseKey);
