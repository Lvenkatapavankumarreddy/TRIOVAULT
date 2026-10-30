import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'triovault-files';

let supabaseClient = null;

if (supabaseUrl && supabaseServiceRoleKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    console.log('[TrioVault Storage] Supabase Storage client initialized.');
  } catch (err) {
    console.error('[TrioVault Storage] Error initializing Supabase client:', err.message);
  }
} else {
  console.log('[TrioVault Storage] Supabase credentials not fully specified in .env. Storage service will operate in local fallback mode until credentials are provided.');
}

export const getSupabaseClient = () => supabaseClient;
export const isSupabaseConfigured = () => Boolean(supabaseClient && supabaseUrl && supabaseServiceRoleKey);

