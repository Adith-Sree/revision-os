import { createClient } from '@supabase/supabase-js';

const DEFAULT_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_g6f2zn68OSWM8Hmnf1PhQg_JiTw01AX';
const DEFAULT_URL = import.meta.env.VITE_SUPABASE_URL || '';

export function getStoredSupabaseConfig() {
  const customUrl = localStorage.getItem('revision_os_supabase_url');
  const customKey = localStorage.getItem('revision_os_supabase_key');
  return {
    url: customUrl || DEFAULT_URL,
    key: customKey || DEFAULT_KEY,
    isCustom: Boolean(customUrl || customKey)
  };
}

export function saveStoredSupabaseConfig(url, key) {
  if (url) localStorage.setItem('revision_os_supabase_url', url.trim());
  else localStorage.removeItem('revision_os_supabase_url');

  if (key) localStorage.setItem('revision_os_supabase_key', key.trim());
  else localStorage.removeItem('revision_os_supabase_key');
}

let cachedClient = null;
let currentClientKey = '';

export function getSupabaseClient() {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.key) {
    return null;
  }
  const keyFingerprint = `${config.url}_${config.key}`;
  if (cachedClient && currentClientKey === keyFingerprint) {
    return cachedClient;
  }
  try {
    cachedClient = createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    currentClientKey = keyFingerprint;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url, key) {
  if (!url || !key) {
    return { ok: false, message: 'URL and API Key are required' };
  }
  try {
    const client = createClient(url, key);
    const { data, error } = await client.from('revision_os_data').select('count', { count: 'exact', head: true });
    if (error && error.code === '42P01') {
      // Table doesn't exist yet, but connection is successful!
      return { ok: true, tableMissing: true, message: 'Connected to Supabase! (Run supabase/schema.sql to create revision_os_data table)' };
    }
    if (error && (error.code === 'PGRST301' || error.message?.includes('JWT') || error.message?.includes('apikey'))) {
      return { ok: false, message: `Authentication error: ${error.message}` };
    }
    return { ok: true, message: 'Supabase connection verified successfully!' };
  } catch (err) {
    return { ok: false, message: err.message || 'Connection failed' };
  }
}
