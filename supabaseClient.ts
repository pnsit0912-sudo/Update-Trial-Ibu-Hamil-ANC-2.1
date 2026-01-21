
import { createClient } from '@supabase/supabase-js';

// Akses variabel environment dengan aman
// Menggunakan casting 'any' untuk menghindari error TypeScript pada import.meta
const meta = import.meta as any;
const env = meta?.env || {};

// Gunakan nilai fallback jika env tidak ditemukan untuk mencegah crash 'supabaseUrl is required'
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = env.VITE_SUPABASE_KEY || 'placeholder-key';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('PERINGATAN: VITE_SUPABASE_URL tidak ditemukan. Pastikan file .env sudah dibuat.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
