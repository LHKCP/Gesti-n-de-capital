import { createClient, SupabaseClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://dqozinvrbvzjsyumvfab.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxb3ppbnZyYnZ6anN5dW12ZmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MTE1MDksImV4cCI6MjEwNzQ4NzUwOX0.PcYVSHy66T8jinvDt8wmOCCjKVL-4gxF_VG5P8QrKBM';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ? import.meta.env.VITE_SUPABASE_URL.trim() : '';
  const envAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ? import.meta.env.VITE_SUPABASE_ANON_KEY.trim() : '';

  const url = envUrl || FALLBACK_SUPABASE_URL;
  const anonKey = envAnonKey || FALLBACK_SUPABASE_ANON_KEY;

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();

  return Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    anonKey.length > 20
  );
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey) {
    return null;
  }

  if (cachedClient) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'capitalfocus_auth_v1',
      },
    });
    return cachedClient;
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
    return null;
  }
}
