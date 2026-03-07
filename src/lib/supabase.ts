import { createClient } from '@supabase/supabase-js';

// Chaves de simulação do Supabase (para ambiente de testes locais)
// No ambiente real, devem vir do .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);
