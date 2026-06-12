import { createClient } from '@supabase/supabase-js';

// Membaca kredensial dari environment variable bentukan Vite atau localStorage untuk fleksibilitas di GitHub Pages
export function getSupabaseConfig() {
  const envUrl = (import.meta as any).env.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
  
  const localUrl = localStorage.getItem('DFW_SUPABASE_URL');
  const localKey = localStorage.getItem('DFW_SUPABASE_ANON_KEY');

  const url = (envUrl && envUrl !== "https://your-project-id.supabase.co" && envUrl !== "") ? envUrl : localUrl;
  const key = (envKey && envKey !== "your-anon-public-key" && envKey !== "") ? envKey : localKey;

  return {
    supabaseUrl: url?.trim() || '',
    supabaseAnonKey: key?.trim() || '',
    isConfigured: Boolean(url && key && url !== "https://your-project-id.supabase.co" && url !== "" && key !== "")
  };
}

const config = getSupabaseConfig();

// Menentukan apakah Supabase sudah terkonfigurasi dengan benar secara global
export const isSupabaseConfigured = config.isConfigured;

/**
 * Inisialisasi client Supabase secara aman (lazy initialization).
 * Jika variabel belum diatur, akan mereturn null sehingga modul tidak merusak rendering client.
 */
export const supabase = isSupabaseConfigured
  ? createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    "⚠️ Supabase belum dikonfigurasi secara lengkap.\n" +
    "Masukkan kredensial real Anda di file .env (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY)\n" +
    "atau tambahkan lewat tombol Atur Integrasi di sidebar dashboard Anda!"
  );
}

// Interface Helper untuk sinkronisasi data
export interface SyncStatus {
  success: boolean;
  message: string;
  error?: any;
}

