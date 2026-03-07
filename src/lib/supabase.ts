import { createClient } from '@supabase/supabase-js';

// Chaves de simulação do Supabase (para ambiente de testes locais)
// No ambiente real, devem vir do .env
const supabaseUrl = 'https://sua-url-do-supabase.supabase.co';
const supabaseKey = 'sua-chave-anon-publica';

export const supabase = createClient(supabaseUrl, supabaseKey);
