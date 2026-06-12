import { createClient } from '@supabase/supabase-js';

// Membaca kredensial dari environment variable bentukan Vite (ramah GitHub Pages)
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Menentukan apakah Supabase sudah terkonfigurasi dengan benar
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== "https://your-project-id.supabase.co");

/**
 * Inisialisasi client Supabase secara aman (lazy initialization).
 * Jika variabel belum diatur, akan mereturn null sehingga modul tidak merusak rendering client.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    "⚠️ Supabase belum dikonfigurasi secara lengkap.\n" +
    "Masukkan kredensial real Anda di file .env (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY)\n" +
    "atau tambahkan sebagai Secrets di pengaturan GitHub Repository Anda untuk men-live-kan database secara otomatis!"
  );
}

// Interface Helper untuk sinkronisasi data
export interface SyncStatus {
  success: boolean;
  message: string;
  error?: any;
}
