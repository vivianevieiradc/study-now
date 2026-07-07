import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error("Faltam as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (.env).");
}

export const supabase = createClient(url, anon);
